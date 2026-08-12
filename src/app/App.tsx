import React, { useState, useEffect } from 'react';
import { AuthPage, ChangePasswordModal, useAuth } from '../features/auth';
import { AvailabilityManager, availabilityService, profileService, TutorCard, TutorDetailModal, TutorProfileEditModal, TutorSearchFilter, tutorService, type Subject, type TutorSearchResult } from '../features/tutors';
import { BookingModal, bookingService, groupBookings, ReviewModal, SessionRecordModal, type BookingDto, type GroupedBooking } from '../features/bookings';
import { creditService, WalletDashboard } from '../features/wallet';
import { LearningProgressDashboard } from '../features/progress';
import { AdminDashboard, AdminRevenueDashboard, AdminReviewsDashboard, AdminSubjectManagement, AdminTutorApproval, AdminUserManagement } from '../features/admin';
import { CenterNotifications, notificationService, NotificationDropdown, type NotificationDto } from '../features/notifications';

// Phase 6 imports
import { HubConnectionBuilder } from '@microsoft/signalr';
import { ToastContainer, Sidebar, Header, type TabType, type ToastItem } from '../shared';

export default function App() {
  const { user, isAuthenticated, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => typeof window !== 'undefined' && window.innerWidth >= 1024);
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    const paymentParam = params.get('payment');
    if (paymentParam || tabParam === 'wallet') {
      return 'wallet';
    }
    const validTabs: TabType[] = ['home', 'tutors', 'bookings', 'wallet', 'progress', 'admin-reviews', 'admin-users', 'admin-tutors', 'admin-revenue', 'admin-subjects', 'admin-notifications', 'center-notifications'];
    if (tabParam && (validTabs as string[]).includes(tabParam)) {
      return tabParam as TabType;
    }
    return 'home';
  });
  const [visitedTabs, setVisitedTabs] = useState<Set<string>>(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    const paymentParam = params.get('payment');
    if (paymentParam || tabParam === 'wallet') {
      return new Set(['home', 'wallet']);
    }
    if (tabParam) {
      return new Set(['home', tabParam]);
    }
    return new Set(['home']);
  });

  useEffect(() => {
    setVisitedTabs((prev) => {
      const next = new Set(prev);
      next.add('home');
      next.add(activeTab);
      return next;
    });
  }, [activeTab, user?.id, isAuthenticated]);

  // Session validation heartbeat: detect single-session eviction even if SignalR is idle
  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => {
      creditService.getBalance().catch((err: any) => {
        if (err?.response?.status === 401) {
          window.dispatchEvent(new CustomEvent('auth:force_logout', { 
            detail: { message: 'Tài khoản của bạn đã được đăng nhập ở nơi khác.' } 
          }));
        }
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const isTabMounted = (tab: string) => visitedTabs.has(tab) || activeTab === tab;

  // Role-based active tab guards during render to prevent stale/unauthorized tab mounts
  const roleNum = Number(user?.role);
  const isAdmin = roleNum === 0 || user?.role === 'Admin';
  if (isAuthenticated) {
    if (isAdmin && activeTab === 'progress') {
      setActiveTab('home');
    }
    if (!isAdmin && (activeTab === 'admin-reviews' || activeTab === 'admin-users' || activeTab === 'admin-tutors' || activeTab === 'admin-revenue' || activeTab === 'admin-subjects')) {
      setActiveTab('home');
    }
  }
  const [isProfileEditOpen, setIsProfileEditOpen] = useState<boolean>(() => window.location.pathname === '/profile');
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState<boolean>(false);
  const [tutorProfileState, setTutorProfileState] = useState<{
    bio?: string;
    qualifications?: string;
    approvalStatus: number;
    isApproved: boolean;
  } | null>(null);
  const [hasAvailability, setHasAvailability] = useState<boolean>(false);

  const fetchTutorProfileStatus = async () => {
    const isTutor = Number(user?.role) === 1 || user?.role === 'Tutor';
    if (!isAuthenticated || !isTutor || !user?.id) return;
    try {
      const profile = await profileService.getMyProfile();
      if (profile && profile.tutorProfile) {
        setTutorProfileState({
          bio: profile.tutorProfile.bio || '',
          qualifications: profile.tutorProfile.qualifications || '',
          approvalStatus: profile.tutorProfile.approvalStatus,
          isApproved: profile.tutorProfile.isApproved,
        });
      }
      
      const availabilities = await availabilityService.getAvailabilities(user.id);
      setHasAvailability(availabilities && availabilities.length > 0);
    } catch (err) {
      console.error('Failed to fetch tutor profile status or availabilities:', err);
    }
  };

  useEffect(() => {
    fetchTutorProfileStatus();
  }, [isAuthenticated, user]);

  const [adminUserSubTab, setAdminUserSubTab] = useState<'students' | 'tutors'>('students');

  const handleTabChange = (
    tab: TabType,
    subTab?: 'students' | 'tutors'
  ) => {
    const roleNum = Number(user?.role);
    const isAdmin = roleNum === 0 || user?.role === 'Admin';

    // Role guards for tab switching
    if (tab === 'admin-reviews' && !isAdmin) return;
    if (tab === 'admin-users' && !isAdmin) return;
    if (tab === 'admin-tutors' && !isAdmin) return;
    if (tab === 'admin-revenue' && !isAdmin) return;
    if (tab === 'admin-subjects' && !isAdmin) return;
    if (tab === 'progress' && isAdmin) return;
    // Allow notification center for admin

    if (subTab) {
      setAdminUserSubTab(subTab);
    }

    setActiveTab(tab);
    const path = `/${tab}`;
    if (window.location.pathname !== path) {
      window.history.pushState(null, '', path);
    }
  };

  const handleOpenProfileEdit = (open: boolean) => {
    const roleNum = Number(user?.role);
    const isTutor = roleNum === 1 || user?.role === 'Tutor';

    // Profile edit modal is only for tutors
    if (open && !isTutor) return;

    setIsProfileEditOpen(open);
    if (open) {
      if (window.location.pathname !== '/profile') {
        window.history.pushState(null, '', '/profile');
      }
    } else {
      const path = `/${activeTab}`;
      if (window.location.pathname !== path) {
        window.history.pushState(null, '', path);
      }
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    const handleLocation = () => {
      const path = window.location.pathname;
      const roleNum = Number(user?.role);
      const isTutor = roleNum === 1 || user?.role === 'Tutor';
      const isAdmin = roleNum === 0 || user?.role === 'Admin';

      // 1. Guard check for /profile (Tutors only)
      if (path === '/profile') {
        if (!isTutor) {
          setIsProfileEditOpen(false);
          setActiveTab('home');
          window.history.replaceState(null, '', '/home');
          return;
        }
        setIsProfileEditOpen(true);
      } else {
        setIsProfileEditOpen(false);

        // 2. Guard checks for tab routes
        if (path === '/tutors') {
          setActiveTab('tutors');
        } else if (path === '/bookings') {
          setActiveTab('bookings');
        } else if (path === '/wallet') {
          setActiveTab('wallet');
        } else if (path === '/progress') {
          // Progress is only for Students and Tutors
          if (isAdmin) {
            setActiveTab('home');
            window.history.replaceState(null, '', '/home');
          } else {
            setActiveTab('progress');
          }
        } else if (path === '/center-notifications' || path === '/admin-notifications') {
          setActiveTab('admin-notifications');
        } else if (path === '/admin-reviews') {
          // Admin reviews is only for Admin
          if (!isAdmin) {
            setActiveTab('home');
            window.history.replaceState(null, '', '/home');
          } else {
            setActiveTab('admin-reviews');
          }
        } else if (path === '/admin-users') {
          // Admin user management is only for Admin
          if (!isAdmin) {
            setActiveTab('home');
            window.history.replaceState(null, '', '/home');
          } else {
            setActiveTab('admin-users');
          }
        } else if (path === '/admin-tutors') {
          // Admin tutor approval is only for Admin
          if (!isAdmin) {
            setActiveTab('home');
            window.history.replaceState(null, '', '/home');
          } else {
            setActiveTab('admin-tutors');
          }
        } else if (path === '/admin-revenue') {
          // Admin revenue report is only for Admin
          if (!isAdmin) {
            setActiveTab('home');
            window.history.replaceState(null, '', '/home');
          } else {
            setActiveTab('admin-revenue');
          }
        } else if (path === '/admin-subjects') {
          // Admin subject management is only for Admin
          if (!isAdmin) {
            setActiveTab('home');
            window.history.replaceState(null, '', '/home');
          } else {
            setActiveTab('admin-subjects');
          }
        } else if (path === '/home' || path === '/' || path === '') {
          const params = new URLSearchParams(window.location.search);
          const tabParam = params.get('tab');
          const paymentParam = params.get('payment');
          if (paymentParam || tabParam === 'wallet') {
            setActiveTab('wallet');
            if (window.location.pathname !== '/wallet') {
              window.history.replaceState(null, '', `/wallet${window.location.search}`);
            }
          } else if (tabParam === 'tutors') {
            setActiveTab('tutors');
            window.history.replaceState(null, '', '/tutors');
          } else if (tabParam === 'bookings') {
            setActiveTab('bookings');
            window.history.replaceState(null, '', '/bookings');
          } else if (tabParam === 'progress' && !isAdmin) {
            setActiveTab('progress');
            window.history.replaceState(null, '', '/progress');
          } else {
            setActiveTab('home');
            if (window.location.pathname !== '/home') {
              window.history.replaceState(null, '', '/home');
            }
          }
        } else {
          setActiveTab('home');
          window.history.replaceState(null, '', '/home');
        }
      }
    };

    handleLocation();
    window.addEventListener('popstate', handleLocation);
    return () => window.removeEventListener('popstate', handleLocation);
  }, [isAuthenticated, activeTab, user]);

  const handleLogout = () => {
    logout();
    setActiveTab('home');
    setVisitedTabs(new Set(['home']));
    window.history.replaceState(null, '', '/login');
  };

  const getActiveTabTitle = (): string => {
    switch (activeTab) {
      case 'home':
        return '🏠 Dashboard & Bảng Điều Khiển';
      case 'tutors':
        return '🔍 Tìm Kiếm & Đặt Lịch Gia Sư';
      case 'bookings':
        return '🗓️ Quản Lý Lịch Học & Ca Dạy';
      case 'wallet':
        return Number(user?.role) === 0 || user?.role === 'Admin' ? '💎 Quản Lý Nạp Tiền & Tín Chỉ' : '💎 Ví Tín Dụng & Nạp Tiền';
      case 'progress':
        return '🎯 Tiến Độ Học Tập & Mục Tiêu';
      case 'admin-notifications':
      case 'center-notifications':
        return Number(user?.role) === 0 || user?.role === 'Admin' ? '📢 Trung Tâm Thông Báo System & Khiếu Nại' : '📢 Thông Báo Từ Trung Tâm';
      case 'admin-reviews':
        return '⭐ Quản Lý Đánh Giá & Phản Hồi';
      case 'admin-users':
        return '👥 Quản Lý Người Dùng';
      case 'admin-tutors':
        return '📝 Duyệt Hồ Sơ Đăng Ký Gia Sư';
      case 'admin-revenue':
        return '📊 Báo Cáo Doanh Thu Hệ Thống';
      case 'admin-subjects':
        return '📚 Quản Lý Danh Mục Môn Học';
      default:
        return 'TutorMatching Platform';
    }
  };

  // Phase 4 Wallet State
  const [walletBalance, setWalletBalance] = useState<number | null>(null);

  // Phase 2 Tutors Search & Filter States
  const [tutors, setTutors] = useState<TutorSearchResult[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedTutor, setSelectedTutor] = useState<TutorSearchResult | null>(null);

  // Filter States
  const [searchTermInput, setSearchTermInput] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [minRating, setMinRating] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Debounce search input
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setSearchTerm(searchTermInput);
      setPageNumber(1);
    }, 350);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTermInput]);

  // Booking notification toast state
  const [bookingNotice, setBookingNotice] = useState<string | null>(null);

  // Phase 3 Booking States
  const [isBookingOpen, setIsBookingOpen] = useState<boolean>(false);
  const [bookingTutor, setBookingTutor] = useState<TutorSearchResult | null>(null);
  const [bookings, setBookings] = useState<BookingDto[]>([]);
  const [bookingsPage, setBookingsPage] = useState<number>(1);
  const [bookingsTotalPages, setBookingsTotalPages] = useState<number>(1);
  const [bookingsTotalCount, setBookingsTotalCount] = useState<number>(0);
  const [bookingsLoading, setBookingsLoading] = useState<boolean>(false);
  const [tutorSubTab, setTutorSubTab] = useState<'list' | 'availability'>('list');

  // Phase 5 Modals States
  const [reviewBookingId, setReviewBookingId] = useState<string | null>(null);
  const [reviewTutorName, setReviewTutorName] = useState<string>('');
  const [reviewSubjectName, setReviewSubjectName] = useState<string>('');

  const [sessionRecordBookingId, setSessionRecordBookingId] = useState<string | null>(null);
  const [sessionStudentName, setSessionStudentName] = useState<string>('');
  const [sessionSubjectName, setSessionSubjectName] = useState<string>('');

  // Booking confirm/cancel modals
  const [cancelBookingId, setCancelBookingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [confirmBookingId, setConfirmBookingId] = useState<string | null>(null);
  const [meetingLink, setMeetingLink] = useState<string>('');
  const [submittingAction, setSubmittingAction] = useState<boolean>(false);

  const isTutorRole = Number(user?.role) === 1 || user?.role === 'Tutor';
  const isStudentRole = !isTutorRole && !isAdmin;

  // Status Filter Tab state
  const [bookingStatusFilter, setBookingStatusFilter] = useState<'all' | 'upcoming' | 'completed' | 'cancelled'>('all');

  // Review detail popup state for viewing reviews
  const [viewReviewDetails, setViewReviewDetails] = useState<BookingDto | null>(null);

  // Student Complaint Modal states
  const [complaintBookingId, setComplaintBookingId] = useState<string | null>(null);
  const [complaintTutorName, setComplaintTutorName] = useState<string>('');
  const [complaintSubjectName, setComplaintSubjectName] = useState<string>('');
  const [complaintReason, setComplaintReason] = useState<string>('');
  const [isSubmittingComplaint, setIsSubmittingComplaint] = useState<boolean>(false);
  const [complaintSuccessMsg, setComplaintSuccessMsg] = useState<string | null>(null);
  const [complaintErrorMsg, setComplaintErrorMsg] = useState<string | null>(null);

  const handleSubmitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintBookingId || !complaintReason.trim()) return;
    try {
      setIsSubmittingComplaint(true);
      setComplaintErrorMsg(null);
      await bookingService.submitComplaint(complaintBookingId, complaintReason.trim());
      setComplaintSuccessMsg('Gửi khiếu nại thành công! Ban quản trị (Admin) sẽ xem xét và cảnh cáo gia sư.');
      setTimeout(() => {
        setComplaintBookingId(null);
        setComplaintReason('');
        setComplaintSuccessMsg(null);
        fetchBookings();
      }, 1500);
    } catch (err: any) {
      setComplaintErrorMsg(err?.response?.data?.message || err?.response?.data?.messages?.[0] || 'Có lỗi xảy ra khi gửi khiếu nại.');
    } finally {
      setIsSubmittingComplaint(false);
    }
  };

  // Grouped Booking state for Tutor multiple student viewer modal
  const [viewGroupedBooking, setViewGroupedBooking] = useState<GroupedBooking | null>(null);

  // Bulk action states for group classes
  const [isBulkConfirmOpen, setIsBulkConfirmOpen] = useState<boolean>(false);
  const [bulkMeetingLink, setBulkMeetingLink] = useState<string>('');
  const [isBulkUpdateLinkOpen, setIsBulkUpdateLinkOpen] = useState<boolean>(false);
  const [bulkNewMeetingLink, setBulkNewMeetingLink] = useState<string>('');
  const [isBulkCancelOpen, setIsBulkCancelOpen] = useState<boolean>(false);
  const [bulkCancelReason, setBulkCancelReason] = useState<string>('');
  const [bulkLoading, setBulkLoading] = useState<boolean>(false);

  // Sync modal details when bookings change
  useEffect(() => {
    if (viewGroupedBooking) {
      const grouped = groupBookings(bookings, isTutorRole);
      const match = grouped.find(g => 
        g.subjectId === viewGroupedBooking.subjectId && 
        g.scheduledStartAt === viewGroupedBooking.scheduledStartAt && 
        g.scheduledEndAt === viewGroupedBooking.scheduledEndAt
      );
      if (match) {
        setViewGroupedBooking(match);
      } else {
        setViewGroupedBooking(null);
      }
    }
  }, [bookings]);

  // Phase 6 real-time notifications states
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // Load initial notifications & count on mount / login
  const fetchNotifications = async () => {
    try {
      const res = await notificationService.getNotifications(1, 10);
      setNotifications(res.items || []);
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    } else {
      setNotifications([]);
      setUnreadCount(0);
      setActiveTab('home');
    }
  }, [isAuthenticated]);

  // SignalR Hub Connection Setup
  useEffect(() => {
    if (!isAuthenticated) return;

    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    if (!token) return;

    let isCancelled = false;

    // Connect directly to Azure backend hub for native WebSocket support
    const hubUrl = (import.meta as any).env?.VITE_HUB_URL || 'https://tutorplatform-gcdueeejgkefcya6.eastasia-01.azurewebsites.net/hubs/notifications';
    const connection = new HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect()
      .build();

    connection
      .start()
      .then(() => {
        if (!isCancelled) {
          console.log('SignalR connected to NotificationHub successfully.');
        }
      })
      .catch((err) => {
        if (isCancelled || err?.name === 'AbortError' || err?.message?.includes('stopped during negotiation')) {
          // Expected lifecycle cleanup when React mounts/remounts or user navigates
          return;
        }
        console.warn('SignalR NotificationHub connection note:', err?.message || err);
      });

    // Listen for single-session eviction event (ForceLogout when another user logs into the same account)
    connection.on('ForceLogout', (data: { userId?: string; message?: string }) => {
      if (isCancelled) return;
      const targetUserId = data?.userId?.toLowerCase();
      const currentUserId = user?.id?.toLowerCase();

      // If event targets this logged-in account (or broadcast without userId)
      if (!targetUserId || targetUserId === currentUserId) {
        const message = data?.message || 'Tài khoản của bạn đã được đăng nhập ở nơi khác.';
        window.dispatchEvent(new CustomEvent('auth:force_logout', { detail: { message } }));
      }
    });

    // Listen to real-time incoming notification events
    connection.on('ReceiveNotification', (notification: NotificationDto) => {
      if (isCancelled) return;
      console.log('Received real-time notification:', notification);

      // Add to notifications list
      setNotifications((prev) => [notification, ...prev.slice(0, 9)]);
      setUnreadCount((prev) => prev + 1);

      // Add to toasts list
      setToasts((prev) => [
        ...prev,
        {
          id: notification.id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
        },
      ]);

      // Dynamic reload depending on notification action type
      if (
        notification.type === 'BookingCreated' ||
        notification.type === 'BookingConfirmed' ||
        notification.type === 'BookingCancelled' ||
        notification.type === 'MeetingLinkUpdated' ||
        notification.type === 'BookingCompleted' ||
        notification.type === 'ReviewReceived'
      ) {
        fetchBookings();
      }
      if (notification.type === 'CreditChanged' || notification.type === 'BookingCancelled' || notification.type === 'BookingCompleted') {
        fetchWalletBalance();
      }
    });

    return () => {
      isCancelled = true;
      connection.stop().catch(() => {});
    };
  }, [isAuthenticated]);

  const handleMarkNotificationRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(prev - 1, 0));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  const handleRemoveToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Load Subjects on mount
  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchSubjects = async () => {
      try {
        const data = await tutorService.getAllSubjects();
        setSubjects(data || []);
      } catch (err) {
        console.error('Failed to load subjects:', err);
      }
    };
    fetchSubjects();
  }, [isAuthenticated]);

  const fetchWalletBalance = async () => {
    try {
      const data = await creditService.getBalance();
      setWalletBalance(data.creditBalance);
    } catch (err) {
      console.error('Failed to load wallet balance:', err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchWalletBalance();
    }
  }, [isAuthenticated, activeTab]);

  // Handle VNPAY callback status in URL query parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('payment');
    if (paymentStatus === 'success') {
      setActiveTab('wallet');
      window.history.replaceState(null, '', '/wallet');
      fetchWalletBalance();
      alert('🎉 Nạp tiền qua VNPAY thành công! Tín chỉ đã được cộng vào tài khoản của bạn.');
    } else if (paymentStatus === 'failed') {
      setActiveTab('wallet');
      window.history.replaceState(null, '', '/wallet');
      alert('❌ Thanh toán qua VNPAY thất bại hoặc bị hủy bỏ.');
    }
  }, [isAuthenticated]);

  // Fetch Tutors when filters or activeTab change
  useEffect(() => {
    if (!isAuthenticated) return;
    if (activeTab === 'tutors' || activeTab === 'home') {
      fetchTutors();
    }
  }, [isAuthenticated, activeTab, searchTerm, selectedSubjectId, minRating, pageNumber]);

  const fetchTutors = async () => {
    try {
      if (tutors.length === 0) setLoading(true);
      const res = await tutorService.searchTutors({
        searchTerm: searchTerm || undefined,
        subjectId: selectedSubjectId || undefined,
        minRating: minRating > 0 ? minRating : undefined,
        sortBy: 'rating_desc',
        pageNumber,
        pageSize: 6,
      });

      setTutors(res.items || []);
      setTotalPages(Math.ceil((res.totalCount || 0) / 6));
      setTotalCount(res.totalCount || 0);
    } catch {
      // Safe fallback
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setSearchTermInput('');
    setSearchTerm('');
    setSelectedSubjectId('');
    setMinRating(0);
    setPageNumber(1);
  };

  const fetchBookings = async () => {
    try {
      if (bookings.length === 0) setBookingsLoading(true);
      const res = await bookingService.getMyBookings(bookingsPage, 10);
      setBookings(res.items || []);
      setBookingsTotalCount(res.totalCount || 0);
      setBookingsTotalPages(Math.ceil((res.totalCount || 0) / 10));
    } catch {
      // Safe fallback
    } finally {
      setBookingsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && activeTab === 'bookings') {
      fetchBookings();
    }
  }, [isAuthenticated, activeTab, bookingsPage]);

  const handleBookTutor = (tutor: TutorSearchResult) => {
    setBookingTutor(tutor);
    setIsBookingOpen(true);
  };

  const handleBookingSuccess = () => {
    setIsBookingOpen(false);
    setBookingTutor(null);
    setBookingNotice('Đặt lịch học thành công! Vui lòng kiểm tra Lịch học của bạn.');
    setTimeout(() => setBookingNotice(null), 5000);
    setBookingsPage(1);
    handleTabChange('bookings');
    fetchWalletBalance();
  };

  const handleCancelBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelBookingId || !cancelReason) return;
    try {
      setSubmittingAction(true);
      await bookingService.cancelBooking(cancelBookingId, cancelReason);
      setCancelBookingId(null);
      setCancelReason('');
      setBookingNotice('Đã hủy lịch học thành công.');
      setTimeout(() => setBookingNotice(null), 5000);
      fetchBookings();
      fetchWalletBalance();
    } catch (err: any) {
      alert(err.response?.data?.messages?.[0] || err.response?.data?.message || 'Không thể hủy lịch học. Vui lòng thử lại.');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmBookingId || !meetingLink) return;
    try {
      setSubmittingAction(true);
      await bookingService.confirmBooking(confirmBookingId, meetingLink);
      setConfirmBookingId(null);
      setMeetingLink('');
      setBookingNotice('Đã xác nhận lớp học thành công.');
      setTimeout(() => setBookingNotice(null), 5000);
      fetchBookings();
      fetchWalletBalance();
    } catch (err: any) {
      alert(err.response?.data?.messages?.[0] || err.response?.data?.message || 'Không thể xác nhận lịch học. Vui lòng thử lại.');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleUpdateMeetingLink = async (bookingId: string, link: string) => {
    if (!link) return;
    try {
      await bookingService.updateMeetingLink(bookingId, link);
      setBookingNotice('Cập nhật link lớp học thành công.');
      setTimeout(() => setBookingNotice(null), 5000);
      fetchBookings();
    } catch (err: any) {
      alert(err.response?.data?.messages?.[0] || err.response?.data?.message || 'Không thể cập nhật link. Vui lòng thử lại.');
    }
  };

  const handleCompleteBooking = async (bookingId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn hoàn thành buổi học này và nhận tín chỉ?')) return;
    try {
      await bookingService.completeBooking(bookingId);
      setBookingNotice('Đã hoàn thành buổi học.');
      setTimeout(() => setBookingNotice(null), 5000);
      fetchBookings();
      fetchWalletBalance();
    } catch (err: any) {
      alert(err.response?.data?.messages?.[0] || err.response?.data?.message || 'Có lỗi xảy ra.');
    }
  };

  // Bulk confirm all pending bookings in a group class
  const handleBulkConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewGroupedBooking || !bulkMeetingLink) return;
    const pendingItems = viewGroupedBooking.items.filter((i: any) => i.status === 0);
    if (pendingItems.length === 0) return;

    setBulkLoading(true);
    try {
      for (const item of pendingItems) {
        await bookingService.confirmBooking(item.id, bulkMeetingLink);
      }
      setBookingNotice(`⚡ Đã xác nhận thành công cho toàn bộ ${pendingItems.length} học viên!`);
      setTimeout(() => setBookingNotice(null), 5000);
      setIsBulkConfirmOpen(false);
      setBulkMeetingLink('');
      await fetchBookings();
    } catch (err: any) {
      alert(err.response?.data?.messages?.[0] || err.response?.data?.message || 'Có lỗi khi xác nhận hàng loạt.');
    } finally {
      setBulkLoading(false);
    }
  };

  // Bulk complete all confirmed bookings in a group class
  const handleBulkComplete = async () => {
    if (!viewGroupedBooking) return;
    const confirmedItems = viewGroupedBooking.items.filter((i: any) => i.status === 1);
    if (confirmedItems.length === 0) return;

    if (!window.confirm(`Bạn có chắc chắn muốn hoàn thành buổi học cho toàn bộ ${confirmedItems.length} học viên và nhận tín chỉ?`)) return;

    setBulkLoading(true);
    try {
      for (const item of confirmedItems) {
        await bookingService.completeBooking(item.id);
      }
      setBookingNotice(`🎓 Đã hoàn thành buổi dạy cho toàn bộ ${confirmedItems.length} học viên thành công!`);
      setTimeout(() => setBookingNotice(null), 5000);
      await fetchBookings();
      await fetchWalletBalance();
    } catch (err: any) {
      alert(err.response?.data?.messages?.[0] || err.response?.data?.message || 'Có lỗi khi hoàn thành hàng loạt.');
    } finally {
      setBulkLoading(false);
    }
  };

  // Bulk update meeting link for all confirmed students in a group class
  const handleBulkUpdateMeetingLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewGroupedBooking || !bulkNewMeetingLink) return;
    const confirmedItems = viewGroupedBooking.items.filter((i: any) => i.status === 1);
    if (confirmedItems.length === 0) return;

    setBulkLoading(true);
    try {
      for (const item of confirmedItems) {
        await bookingService.updateMeetingLink(item.id, bulkNewMeetingLink);
      }
      setBookingNotice(`🔗 Đã cập nhật link phòng học mới thành công cho toàn bộ ${confirmedItems.length} học viên!`);
      setTimeout(() => setBookingNotice(null), 5000);
      setIsBulkUpdateLinkOpen(false);
      setBulkNewMeetingLink('');
      await fetchBookings();
    } catch (err: any) {
      alert(err.response?.data?.messages?.[0] || err.response?.data?.message || 'Có lỗi khi đổi link hàng loạt.');
    } finally {
      setBulkLoading(false);
    }
  };

  // Bulk cancel all active bookings in a group class
  const handleBulkCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewGroupedBooking || !bulkCancelReason) return;
    const activeItems = viewGroupedBooking.items.filter((i: any) => i.status === 0 || i.status === 1);
    if (activeItems.length === 0) return;

    setBulkLoading(true);
    try {
      for (const item of activeItems) {
        await bookingService.cancelBooking(item.id, bulkCancelReason);
      }
      setBookingNotice(`❌ Đã hủy toàn bộ ca học cho ${activeItems.length} học viên và hoàn tiền thành công!`);
      setTimeout(() => setBookingNotice(null), 5000);
      setIsBulkCancelOpen(false);
      setBulkCancelReason('');
      setViewGroupedBooking(null);
      await fetchBookings();
      await fetchWalletBalance();
    } catch (err: any) {
      alert(err.response?.data?.messages?.[0] || err.response?.data?.message || 'Có lỗi khi hủy hàng loạt.');
    } finally {
      setBulkLoading(false);
    }
  };

  // IF NOT AUTHENTICATED: Show Dedicated Standalone Auth Page (Login & Register)
  if (!isAuthenticated) {
    return <AuthPage />;
  }

  // IF AUTHENTICATED: Render Main Application & Dashboard Page
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        backgroundImage: 'linear-gradient(135deg, rgba(15, 23, 42, 0.88), rgba(15, 23, 42, 0.82)), url("/dashboard-bg.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat',
        color: '#f8fafc',
      }}
    >
      {/* Vertical Sidebar Matching Target UI */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        userRole={user?.role}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area Container */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          minHeight: '100vh',
          overflowX: 'hidden',
          backgroundColor: 'transparent',
        }}
      >
        {/* Top Header Navigation */}
        <Header
          user={user}
          walletBalance={walletBalance}
          notifications={notifications}
          unreadCount={unreadCount}
          activeTabTitle={getActiveTabTitle()}
          onMenuToggle={() => setIsSidebarOpen((prev) => !prev)}
          onOpenWallet={() => handleTabChange('wallet')}
          onRefreshNotifications={fetchNotifications}
          onMarkNotificationRead={handleMarkNotificationRead}
          onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
          onNavigateTab={handleTabChange}
          onOpenProfileEdit={() => handleOpenProfileEdit(true)}
          onOpenChangePassword={() => setIsChangePasswordOpen(true)}
          onLogout={handleLogout}
        />

      {/* Booking Notice Toast Alert */}
      {bookingNotice && (
        <div
          style={{
            margin: '0 24px 16px',
            padding: '12px 20px',
            backgroundColor: 'rgba(56, 189, 248, 0.15)',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            color: '#38bdf8',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>🎉 {bookingNotice}</span>
          <button onClick={() => setBookingNotice(null)} style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '16px 24px 48px', maxWidth: '1240px', margin: '0 auto', width: '100%' }}>
        {/* Tab 1: Home Page */}
        {isTabMounted('home') && (
          <div style={{ display: activeTab === 'home' ? 'block' : 'none' }}>
            {isAdmin ? (
              <AdminDashboard onNavigateTab={handleTabChange} />
            ) : (
              <div>
                {isTutorRole && tutorProfileState && (
                  <div style={{ marginBottom: '32px' }}>
                    {tutorProfileState.approvalStatus === 0 && (
                      <div
                        className="glass-panel"
                        style={{
                          padding: '24px',
                          borderRadius: '20px',
                          border: '1px solid rgba(251, 191, 36, 0.25)',
                          backgroundColor: 'rgba(251, 191, 36, 0.06)',
                          color: '#fef08a',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '12px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px', fontWeight: 800, color: '#fbbf24' }}>
                          ⚠️ Yêu cầu hoàn thiện thông tin Gia sư
                        </div>
                        <p style={{ margin: 0, fontSize: '14px', color: '#cbd5e1', lineHeight: '1.6' }}>
                          Để bắt đầu giảng dạy và nhận học viên trên hệ thống, bạn bắt buộc phải hoàn thành các bước thiết lập sau để Admin duyệt hồ sơ:
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: '4px 0' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: tutorProfileState.bio && tutorProfileState.qualifications ? '#10b981' : '#fbbf24', fontWeight: 600 }}>
                            {tutorProfileState.bio && tutorProfileState.qualifications ? '✅' : '❌'} Bước 1: Cập nhật Bio giới thiệu & Bằng cấp chuyên môn (Hiện tại: {tutorProfileState.bio && tutorProfileState.qualifications ? 'Đã hoàn tất' : 'Chưa hoàn tất'})
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: hasAvailability ? '#10b981' : '#fbbf24', fontWeight: 600 }}>
                            {hasAvailability ? '✅' : '❌'} Bước 2: Thiết lập lịch rảnh giảng dạy trong tab Lịch Học (Hiện tại: {hasAvailability ? 'Đã hoàn tất' : 'Chưa hoàn tất'})
                          </div>
                        </div>
                        {(!tutorProfileState.bio || !tutorProfileState.qualifications || !hasAvailability) ? (
                          <div style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
                            💡 Đơn đăng ký của bạn sẽ được tự động gửi tới Admin ngay sau khi cả hai bước trên hiển thị tích xanh.
                          </div>
                        ) : (
                          <div style={{ fontSize: '14px', color: '#38bdf8', fontWeight: 700, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
                            ⏳ Hồ sơ và lịch rảnh đã hoàn tất! Đang chờ Admin của TutorMatching xem xét phê duyệt.
                          </div>
                        )}
                      </div>
                    )}

                    {tutorProfileState.approvalStatus === 1 && (
                      <div
                        className="glass-panel"
                        style={{
                          padding: '20px 24px',
                          borderRadius: '16px',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                          backgroundColor: 'rgba(16, 185, 129, 0.06)',
                          color: '#d1fae5',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '16px'
                        }}
                      >
                        <span style={{ fontSize: '32px' }}>✅</span>
                        <div>
                          <strong style={{ display: 'block', fontSize: '16px', color: '#10b981', marginBottom: '4px' }}>Hồ sơ của bạn đã được phê duyệt thành công!</strong>
                          <span style={{ fontSize: '14px', color: '#cbd5e1' }}>Chúc mừng! Bạn đã đủ điều kiện giảng dạy và có thể nhận học viên đặt lớp trên hệ thống.</span>
                        </div>
                      </div>
                    )}

                    {tutorProfileState.approvalStatus === 2 && (
                      <div
                        className="glass-panel"
                        style={{
                          padding: '20px 24px',
                          borderRadius: '16px',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          backgroundColor: 'rgba(239, 68, 68, 0.06)',
                          color: '#fee2e2',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '16px'
                        }}
                      >
                        <span style={{ fontSize: '32px' }}>❌</span>
                        <div>
                          <strong style={{ display: 'block', fontSize: '16px', color: '#f87171', marginBottom: '4px' }}>Đơn đăng ký gia sư bị từ chối phê duyệt!</strong>
                          <span style={{ fontSize: '14px', color: '#cbd5e1' }}>Rất tiếc, hồ sơ của bạn chưa đạt chuẩn giảng dạy. Bạn không thể nhận học sinh dạy lúc này. Hãy cập nhật lại thông tin Bio/Bằng cấp để tự động gửi duyệt lại.</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <div style={{ textAlign: 'center', marginTop: '20px', marginBottom: '48px' }}>
                  <h2 style={{ fontSize: '46px', fontWeight: '800', lineHeight: 1.2, marginBottom: '16px' }}>
                    Tìm Gia Sư Hoàn Hảo CHO <br />
                    <span className="gradient-text">HÀNH TRÌNH HỌC TẬP CỦA BẠN</span>
                  </h2>
                  <p style={{ color: '#94a3b8', fontSize: '17px', maxWidth: '680px', margin: '0 auto 32px' }}>
                    Kết nối trực tiếp với gia sư chất lượng cao, lọc môn học thông minh, theo dõi đánh giá minh bạch và đặt lịch học theo tín chỉ với Backend ASP.NET Core.
                  </p>
    
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '48px' }}>
                    <button className="btn-primary" style={{ padding: '14px 32px', fontSize: '16px' }} onClick={() => handleTabChange('tutors')}>
                      🔍 Khám Phá {totalCount > 0 ? `${totalCount} Gia Sư` : 'Danh Sách Gia Sư'}
                    </button>
                    {isTutorRole && (
                      <button
                        onClick={() => handleOpenProfileEdit(true)}
                        style={{
                          background: 'rgba(56, 189, 248, 0.15)',
                          border: '1px solid #38bdf8',
                          color: '#38bdf8',
                          padding: '14px 28px',
                          fontSize: '16px',
                          borderRadius: '10px',
                          cursor: 'pointer',
                          fontWeight: 600,
                        }}
                      >
                        ⚙️ Cập Nhật Hồ Sơ Gia Sư Của Tôi
                      </button>
                    )}
                  </div>
                </div>
    
                {/* Featured Tutors Section on Home */}
                <div style={{ marginBottom: '40px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '22px', fontWeight: '700', color: '#fff' }}>⭐ Gia Sư Nổi Bật Được Đánh Giá Cao</h3>
                    <button onClick={() => handleTabChange('tutors')} style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', fontWeight: 600 }}>Xem tất cả →</button>
                  </div>
    
                  {loading ? (
                    <div style={{ color: '#94a3b8', textAlign: 'center', padding: '40px' }}>Đang tải danh sách gia sư từ CSDL...</div>
                  ) : tutors.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
                      {tutors.slice(0, 3).map((tutor) => (
                        <TutorCard key={tutor.tutorId} tutor={tutor} onSelect={setSelectedTutor} onBook={handleBookTutor} />
                      ))}
                    </div>
                  ) : (
                    <div style={{ color: '#94a3b8', textAlign: 'center', padding: '40px' }}>Chưa có gia sư nào tạo tài khoản trong hệ thống CSDL.</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Phase 2 Tutor Search & Catalog */}
        {isTabMounted('tutors') && (
          <div style={{ display: activeTab === 'tutors' ? 'block' : 'none' }}>
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '8px' }}>
                🔍 Tìm Kiếm & Khám Phá Gia Sư
              </h2>
              <p style={{ color: '#94a3b8', fontSize: '15px' }}>
                Lọc gia sư theo môn học, mức đánh giá, học phí tín chỉ và kinh nghiệm giảng dạy.
              </p>
            </div>

            {/* Search Filter Bar Component */}
            <TutorSearchFilter
              searchTerm={searchTermInput}
              onSearchChange={(val) => { setSearchTermInput(val); }}
              selectedSubjectId={selectedSubjectId}
              onSubjectChange={(val) => { setSelectedSubjectId(val); setPageNumber(1); }}
              minRating={minRating}
              onMinRatingChange={(val) => { setMinRating(val); setPageNumber(1); }}
              subjects={subjects}
              onReset={handleResetFilters}
            />

            {/* Tutors Grid */}
            {tutors.length === 0 && loading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="glass-panel" style={{ padding: '24px', height: '260px', opacity: 0.5 }}>
                    <div style={{ fontSize: '14px', color: '#94a3b8' }}>Đang tải dữ liệu gia sư từ API...</div>
                  </div>
                ))}
              </div>
            ) : tutors.length > 0 ? (
              <div style={{ 
                opacity: loading ? 0.6 : 1, 
                pointerEvents: loading ? 'none' : 'auto',
                transition: 'opacity 0.2s ease-in-out',
                position: 'relative'
              }}>
                {loading && (
                  <div className="pulse" style={{
                    position: 'absolute',
                    top: '-30px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 10,
                    backgroundColor: 'rgba(56, 189, 248, 0.2)',
                    color: '#38bdf8',
                    padding: '6px 16px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 600,
                    backdropFilter: 'blur(4px)',
                    border: '1px solid rgba(56, 189, 248, 0.4)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    whiteSpace: 'nowrap'
                  }}>
                    ⏳ Đang cập nhật kết quả...
                  </div>
                )}
                <div style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '16px' }}>
                  Tìm thấy <strong style={{ color: '#38bdf8' }}>{totalCount}</strong> gia sư phù hợp
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
                  {tutors.map((tutor) => (
                    <TutorCard key={tutor.tutorId} tutor={tutor} onSelect={setSelectedTutor} onBook={handleBookTutor} />
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '40px' }}>
                    <button
                      disabled={pageNumber === 1}
                      onClick={() => setPageNumber(prev => Math.max(prev - 1, 1))}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '8px',
                        border: '1px solid rgba(255,255,255,0.15)',
                        backgroundColor: 'rgba(15,23,42,0.6)',
                        color: pageNumber === 1 ? '#64748b' : '#fff',
                        cursor: pageNumber === 1 ? 'not-allowed' : 'pointer',
                      }}
                    >
                      ← Trang trước
                    </button>
                    <span style={{ display: 'flex', alignItems: 'center', padding: '0 12px', fontSize: '14px', color: '#94a3b8' }}>
                      Trang {pageNumber} / {totalPages}
                    </span>
                    <button
                      disabled={pageNumber === totalPages}
                      onClick={() => setPageNumber(prev => Math.min(prev + 1, totalPages))}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '8px',
                        border: '1px solid rgba(255,255,255,0.15)',
                        backgroundColor: 'rgba(15,23,42,0.6)',
                        color: pageNumber === totalPages ? '#64748b' : '#fff',
                        cursor: pageNumber === totalPages ? 'not-allowed' : 'pointer',
                      }}
                    >
                      Trang sau →
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div
                className="glass-panel"
                style={{
                  padding: '48px',
                  textAlign: 'center',
                  color: '#94a3b8',
                  borderRadius: '16px',
                }}
              >
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔍</div>
                <h3 style={{ fontSize: '18px', color: '#fff', marginBottom: '8px' }}>Không Tìm Thấy Gia Sư Nào Trong CSDL</h3>
                <p style={{ fontSize: '14px', maxWidth: '400px', margin: '0 auto 20px' }}>
                  Không có gia sư nào phù hợp với bộ lọc hiện tại. Bạn vui lòng thử tìm kiếm với từ khóa khác hoặc tạo tài khoản gia sư mới.
                </p>
                <button onClick={handleResetFilters} className="btn-primary" style={{ padding: '10px 20px', fontSize: '14px' }}>
                  🔄 Xóa Bộ Lọc
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Bookings & Availability Management */}
        {isTabMounted('bookings') && (
          <div style={{ display: activeTab === 'bookings' ? 'block' : 'none' }}>
            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '4px' }}>
                  🗓️ {isAdmin ? 'Quản Lý Lịch Học Toàn Hệ Thống' : 'Quản Lý Lịch Học & Giảng Dạy'}
                </h2>
                <p style={{ color: '#94a3b8', fontSize: '15px' }}>
                  {isAdmin
                    ? 'Theo dõi, tra cứu trạng thái và lịch sử các ca học của gia sư và học viên trên nền tảng.'
                    : isTutorRole
                    ? 'Quản lý lịch dạy học và cấu hình khung giờ rảnh của bạn.'
                    : 'Xem danh sách lớp học và trạng thái lịch học của bạn.'}
                </p>
              </div>

              {isTutorRole && (
                <div style={{ display: 'flex', gap: '8px', backgroundColor: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '10px' }}>
                  <button
                    onClick={() => setTutorSubTab('list')}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: tutorSubTab === 'list' ? '#38bdf8' : 'transparent',
                      color: tutorSubTab === 'list' ? '#0f172a' : '#94a3b8',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '13px',
                      transition: 'all 0.2s',
                    }}
                  >
                    📋 Lịch Dạy Đã Đăng Ký
                  </button>
                  <button
                    onClick={() => setTutorSubTab('availability')}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: tutorSubTab === 'availability' ? '#38bdf8' : 'transparent',
                      color: tutorSubTab === 'availability' ? '#0f172a' : '#94a3b8',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '13px',
                      transition: 'all 0.2s',
                    }}
                  >
                    ⚙️ Cấu Hình Lịch Rảnh
                  </button>
                </div>
              )}
            </div>

            {isTutorRole && tutorSubTab === 'availability' ? (
              <AvailabilityManager onUpdate={fetchTutorProfileStatus} />
            ) : (
              <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
                {/* Status Filter Tabs */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                  {[
                    { id: 'all', label: 'Tất Cả Lịch Học', count: bookings.length },
                    { id: 'upcoming', label: 'Sắp Diễn Ra', count: bookings.filter(b => b.status === 0 || b.status === 1).length },
                    { id: 'completed', label: 'Đã Hoàn Thành', count: bookings.filter(b => b.status === 2).length },
                    { id: 'cancelled', label: 'Đã Hủy', count: bookings.filter(b => b.status === 3).length },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setBookingStatusFilter(tab.id as any)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '10px',
                        border: '1px solid',
                        borderColor: bookingStatusFilter === tab.id ? '#38bdf8' : 'rgba(255,255,255,0.1)',
                        backgroundColor: bookingStatusFilter === tab.id ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255,255,255,0.03)',
                        color: bookingStatusFilter === tab.id ? '#38bdf8' : '#94a3b8',
                        fontWeight: bookingStatusFilter === tab.id ? 700 : 500,
                        fontSize: '13px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <span>{tab.label}</span>
                      <span
                        style={{
                          padding: '2px 7px',
                          borderRadius: '20px',
                          fontSize: '11px',
                          backgroundColor: bookingStatusFilter === tab.id ? '#38bdf8' : 'rgba(255,255,255,0.1)',
                          color: bookingStatusFilter === tab.id ? '#0f172a' : '#cbd5e1',
                          fontWeight: 700,
                        }}
                      >
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </div>

                {bookingsLoading ? (
                  <div style={{ color: '#94a3b8', textAlign: 'center', padding: '48px' }}>Đang tải lịch học của bạn...</div>
                ) : bookings.length === 0 ? (
                  <div style={{ color: '#94a3b8', textAlign: 'center', padding: '48px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>🗓️</div>
                    <h3 style={{ color: '#fff', fontSize: '18px', marginBottom: '8px' }}>Chưa Có Buổi Học Nào</h3>
                    <p style={{ fontSize: '14px', maxWidth: '380px', margin: '0 auto' }}>
                      {isAdmin
                        ? 'Hiện tại chưa có ca học nào được tạo trong hệ thống.'
                        : isTutorRole
                        ? 'Hiện tại chưa có học sinh nào đặt lịch học với bạn.'
                        : 'Bạn chưa đặt lịch học với gia sư nào. Hãy chuyển sang tab Tìm Gia Sư để bắt đầu học!'}
                    </p>
                  </div>
                ) : (
                  <div>
                    {/* Bookings Table / List */}
                    {(() => {
                      const filteredList = bookings.filter((b) => {
                        if (bookingStatusFilter === 'upcoming') return b.status === 0 || b.status === 1;
                        if (bookingStatusFilter === 'completed') return b.status === 2;
                        if (bookingStatusFilter === 'cancelled') return b.status === 3;
                        return true;
                      });

                      if (filteredList.length === 0) {
                        return (
                          <div style={{ color: '#94a3b8', textAlign: 'center', padding: '40px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                            <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔍</div>
                            <p style={{ margin: 0, fontSize: '14px' }}>Không có lịch học nào trong mục này.</p>
                          </div>
                        );
                      }

                      return (
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                                <th style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap' }}>MÔN HỌC</th>
                                {isAdmin ? (
                                  <>
                                    <th style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap' }}>HỌC VIÊN</th>
                                    <th style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap' }}>GIA SƯ</th>
                                  </>
                                ) : (
                                  <th style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                    {isTutorRole ? 'HỌC VIÊN' : 'GIA SƯ'}
                                  </th>
                                )}
                                <th style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap' }}>THỜI GIAN</th>
                                <th style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap' }}>CHI PHÍ</th>
                                <th style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap' }}>TRẠNG THÁI</th>
                                <th style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                  {isAdmin ? 'ĐÁNH GIÁ & LIÊN KẾT' : 'LIÊN KẾT / THAO TÁC'}
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {groupBookings(filteredList, isTutorRole).map((grp) => {
                                const start = new Date(grp.scheduledStartAt);
                                const end = new Date(grp.scheduledEndAt);
                                const formattedDate = start.toLocaleDateString('vi-VN');
                                const formattedTime = `${start.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
                                const isStarted = new Date() >= start;
                                const isGroup = grp.items.length > 1;

                                // Use first booking item for single bookings
                                const singleItem: BookingDto = grp.items[0];

                                // Status badge config
                                let statusText = 'Chờ duyệt';
                                let statusStyle = { color: '#fbbf24', backgroundColor: 'rgba(251, 191, 36, 0.15)' };
                                if (grp.status === 1) {
                                  statusText = 'Đã xác nhận';
                                  statusStyle = { color: '#38bdf8', backgroundColor: 'rgba(56, 189, 248, 0.15)' };
                                } else if (grp.status === 2) {
                                  statusText = 'Hoàn thành';
                                  statusStyle = { color: '#34d399', backgroundColor: 'rgba(52, 211, 153, 0.15)' };
                                } else if (grp.status === 3) {
                                  statusText = 'Đã hủy';
                                  statusStyle = { color: '#f87171', backgroundColor: 'rgba(248, 113, 113, 0.15)' };
                                } else if (grp.status === 4) {
                                  statusText = 'Thay đổi lịch';
                                  statusStyle = { color: '#a855f7', backgroundColor: 'rgba(168, 85, 247, 0.15)' };
                                }

                                return (
                                  <tr key={grp.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '14px' }}>
                                    {/* MÔN HỌC - Clean & Consistent */}
                                    <td style={{ padding: '16px', fontWeight: 600, color: '#fff', maxWidth: '200px' }}>
                                      <div>{grp.subjectName}</div>
                                    </td>

                                    {/* HỌC VIÊN & GIA SƯ columns */}
                                    {isAdmin ? (
                                      <>
                                        <td style={{ padding: '16px', color: '#cbd5e1' }}>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span>👤</span>
                                            <span>{singleItem.studentName || 'Học viên'}</span>
                                          </div>
                                        </td>
                                        <td style={{ padding: '16px', color: '#cbd5e1' }}>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span>👨‍🏫</span>
                                            <span>{singleItem.tutorName || 'Gia sư'}</span>
                                          </div>
                                        </td>
                                      </>
                                    ) : (
                                      <td style={{ padding: '16px' }}>
                                        {isTutorRole ? (
                                          isGroup ? (
                                            <button
                                              onClick={() => setViewGroupedBooking(grp)}
                                              style={{
                                                background: 'rgba(168,85,247,0.15)',
                                                border: '1px solid rgba(168,85,247,0.35)',
                                                color: '#c084fc',
                                                borderRadius: '8px',
                                                padding: '5px 12px',
                                                fontSize: '13px',
                                                fontWeight: 700,
                                                cursor: 'pointer',
                                                whiteSpace: 'nowrap',
                                              }}
                                            >
                                              👥 {grp.items.length} học viên
                                            </button>
                                          ) : (
                                            singleItem.studentName
                                          )
                                        ) : (
                                          singleItem.tutorName
                                        )}
                                      </td>
                                    )}

                                    <td style={{ padding: '16px' }}>
                                      <div>📅 {formattedDate}</div>
                                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>⏰ {formattedTime}</div>
                                    </td>
                                    <td style={{ padding: '16px', fontWeight: 700, color: '#a855f7' }}>💎 {grp.creditAmount.toFixed(2)}</td>
                                    <td style={{ padding: '16px' }}>
                                      <span style={{ display: 'inline-block', whiteSpace: 'nowrap', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600, ...statusStyle }}>
                                        {statusText}
                                      </span>
                                      {grp.status === 3 && singleItem.cancellationReason && (
                                        <div
                                          style={{
                                            marginTop: '6px',
                                            fontSize: '11px',
                                            color: '#fca5a5',
                                            maxWidth: '220px',
                                            lineHeight: '1.4',
                                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                            padding: '4px 8px',
                                            borderRadius: '6px',
                                            border: '1px solid rgba(239, 68, 68, 0.2)',
                                            wordBreak: 'break-word',
                                          }}
                                          title={singleItem.cancellationReason}
                                        >
                                          💬 <em>Lý do: "{singleItem.cancellationReason}"</em>
                                        </div>
                                      )}
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>

                                        {/* Meeting Link Button */}
                                        {grp.meetingLink && grp.status === 1 && (
                                          <a
                                            href={grp.meetingLink.startsWith('http') ? grp.meetingLink : `https://${grp.meetingLink}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                              padding: '6px 12px',
                                              backgroundColor: '#38bdf8',
                                              color: '#0f172a',
                                              borderRadius: '6px',
                                              fontSize: '12px',
                                              fontWeight: 600,
                                              textDecoration: 'none',
                                              display: 'inline-flex',
                                              alignItems: 'center',
                                              gap: '4px',
                                            }}
                                          >
                                            🌐 Vào Lớp Học
                                          </a>
                                        )}

                                        {/* ADMIN ACTION: View Reviews Modal (NO Write Review button!) */}
                                        {isAdmin && grp.status === 2 && (
                                          (singleItem.isStudentReviewed || singleItem.isTutorReviewed) ? (
                                            <button
                                              onClick={() => setViewReviewDetails(singleItem)}
                                              style={{
                                                padding: '6px 12px',
                                                backgroundColor: 'rgba(56, 189, 248, 0.12)',
                                                border: '1px solid rgba(56, 189, 248, 0.3)',
                                                color: '#38bdf8',
                                                borderRadius: '6px',
                                                fontSize: '12px',
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                              }}
                                            >
                                              ⭐ Xem Đánh Giá ({[singleItem.isStudentReviewed, singleItem.isTutorReviewed].filter(Boolean).length}/2)
                                            </button>
                                          ) : (
                                            <span style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>Chưa có đánh giá</span>
                                          )
                                        )}

                                        {/* Tutor: group class management button */}
                                        {isTutorRole && isGroup && (
                                          <button
                                            onClick={() => setViewGroupedBooking(grp)}
                                            style={{
                                              padding: '6px 14px',
                                              backgroundColor: '#a855f7',
                                              border: 'none',
                                              color: '#fff',
                                              borderRadius: '6px',
                                              fontSize: '12px',
                                              fontWeight: 700,
                                              cursor: 'pointer',
                                            }}
                                          >
                                            👥 Quản Lý Lớp
                                          </button>
                                        )}

                                        {/* Single booking actions for Student & Tutor */}
                                        {!isGroup && !isAdmin && (
                                          <>
                                            {/* Student Cancel */}
                                             {isStudentRole && (singleItem.status === 0 || singleItem.status === 1) && (
                                               (new Date(singleItem.scheduledStartAt) <= new Date()) ? (
                                                 <span style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic', padding: '4px 8px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', display: 'inline-flex', alignItems: 'center', gap: '4px' }} title="Buổi học đã diễn ra hoặc đang diễn ra, học viên không thể hủy lịch">🔒 Đang/đã diễn ra (Không thể hủy)</span>
                                               ) : (
                                                 <button onClick={() => setCancelBookingId(singleItem.id)} style={{ padding: '6px 12px', backgroundColor: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>❌ Hủy Lịch</button>
                                               )
                                             )}

                                            {/* Tutor: Pending Actions */}
                                            {isTutorRole && singleItem.status === 0 && (
                                              <>
                                                <button
                                                  onClick={() => setConfirmBookingId(singleItem.id)}
                                                  style={{
                                                    padding: '6px 12px',
                                                    backgroundColor: '#10b981',
                                                    border: 'none',
                                                    color: '#fff',
                                                    borderRadius: '6px',
                                                    fontSize: '12px',
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                  }}
                                                >
                                                  ✔️ Xác Nhận
                                                </button>
                                                <button
                                                  onClick={() => setCancelBookingId(singleItem.id)}
                                                  style={{
                                                    padding: '6px 12px',
                                                    backgroundColor: 'rgba(239,68,68,0.15)',
                                                    border: '1px solid rgba(239,68,68,0.3)',
                                                    color: '#f87171',
                                                    borderRadius: '6px',
                                                    fontSize: '12px',
                                                    cursor: 'pointer',
                                                  }}
                                                >
                                                  ❌ Từ Chối
                                                </button>
                                              </>
                                            )}

                                            {/* Tutor: Confirmed Actions */}
                                            {isTutorRole && singleItem.status === 1 && (
                                              <>
                                                <button
                                                  disabled={!isStarted}
                                                  onClick={() => handleCompleteBooking(singleItem.id)}
                                                  style={{
                                                    padding: '6px 12px',
                                                    backgroundColor: isStarted ? '#a855f7' : 'rgba(168, 85, 247, 0.4)',
                                                    border: 'none',
                                                    color: isStarted ? '#fff' : '#cbd5e1',
                                                    borderRadius: '6px',
                                                    fontSize: '12px',
                                                    fontWeight: 600,
                                                    cursor: isStarted ? 'pointer' : 'not-allowed',
                                                  }}
                                                  title={!isStarted ? "Không thể hoàn thành khi buổi học chưa diễn ra" : undefined}
                                                >
                                                  🎓 Hoàn Thành
                                                </button>
                                                <button
                                                  onClick={() => {
                                                    const newLink = prompt('Nhập link meeting mới:', grp.meetingLink || '');
                                                    if (newLink !== null) handleUpdateMeetingLink(singleItem.id, newLink);
                                                  }}
                                                  style={{
                                                    padding: '6px 12px',
                                                    backgroundColor: 'transparent',
                                                    border: '1px solid rgba(255,255,255,0.2)',
                                                    color: '#cbd5e1',
                                                    borderRadius: '6px',
                                                    fontSize: '12px',
                                                    cursor: 'pointer',
                                                  }}
                                                >
                                                  🔗 Đổi Link
                                                </button>
                                                <button
                                                  onClick={() => setCancelBookingId(singleItem.id)}
                                                  style={{
                                                    padding: '6px 12px',
                                                    backgroundColor: 'rgba(239,68,68,0.15)',
                                                    border: '1px solid rgba(239,68,68,0.3)',
                                                    color: '#f87171',
                                                    borderRadius: '6px',
                                                    fontSize: '12px',
                                                    cursor: 'pointer',
                                                  }}
                                                >
                                                  ❌ Hủy Lịch
                                                </button>
                                              </>
                                            )}

                                             {/* Student: Completed Actions (Review & Complaint) */}
                                             {isStudentRole && singleItem.status === 2 && (
                                               <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                 {singleItem.isStudentReviewed ? (
                                                   <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                     <span style={{ fontSize: '13px', color: '#34d399', fontWeight: 600 }}>✓ Đã đánh giá</span>
                                                     <button
                                                       onClick={() => setViewReviewDetails(singleItem)}
                                                       style={{
                                                         padding: '4px 8px',
                                                         backgroundColor: 'rgba(255,255,255,0.05)',
                                                         border: '1px solid rgba(255,255,255,0.1)',
                                                         color: '#94a3b8',
                                                         borderRadius: '6px',
                                                         fontSize: '11px',
                                                         cursor: 'pointer',
                                                       }}
                                                     >
                                                       💬 Xem
                                                     </button>
                                                   </div>
                                                 ) : (
                                                   <button
                                                     onClick={() => {
                                                       setReviewBookingId(singleItem.id);
                                                       setReviewTutorName(singleItem.tutorName);
                                                       setReviewSubjectName(singleItem.subjectName);
                                                     }}
                                                     style={{
                                                       padding: '6px 12px',
                                                       backgroundColor: 'rgba(52, 211, 153, 0.15)',
                                                       border: '1px solid rgba(52, 211, 153, 0.3)',
                                                       color: '#34d399',
                                                       borderRadius: '6px',
                                                       fontSize: '12px',
                                                       cursor: 'pointer',
                                                       fontWeight: 600,
                                                     }}
                                                   >
                                                     ✍️ Viết Đánh Giá
                                                   </button>
                                                 )}

                                                 {/* Student Complaint Button / Badge */}
                                                 {singleItem.cancellationReason?.startsWith('[KHIẾU NẠI]') ? (
                                                   <span
                                                     style={{
                                                       fontSize: '12px',
                                                       color: '#fbbf24',
                                                       fontStyle: 'italic',
                                                       padding: '4px 8px',
                                                       backgroundColor: 'rgba(245, 158, 11, 0.1)',
                                                       borderRadius: '6px',
                                                       border: '1px solid rgba(245, 158, 11, 0.3)',
                                                       display: 'inline-flex',
                                                       alignItems: 'center',
                                                       gap: '4px'
                                                     }}
                                                     title={`Lý do: ${singleItem.cancellationReason.replace('[KHIẾU NẠI]: ', '')}`}
                                                   >
                                                     🚩 Đã khiếu nại (Đang chờ Admin)
                                                   </span>
                                                 ) : (
                                                   <button
                                                     onClick={() => {
                                                       setComplaintBookingId(singleItem.id);
                                                       setComplaintTutorName(singleItem.tutorName);
                                                       setComplaintSubjectName(singleItem.subjectName);
                                                     }}
                                                     style={{
                                                       padding: '6px 12px',
                                                       backgroundColor: 'rgba(245, 158, 11, 0.15)',
                                                       border: '1px solid rgba(245, 158, 11, 0.4)',
                                                       color: '#fbbf24',
                                                       borderRadius: '6px',
                                                       fontSize: '12px',
                                                       cursor: 'pointer',
                                                       fontWeight: 600,
                                                     }}
                                                   >
                                                     🚩 Khiếu Nại Gia Sư
                                                   </button>
                                                 )}
                                               </div>
                                             )}

                                            {/* Tutor: Completed Actions */}
                                            {isTutorRole && singleItem.status === 2 && (
                                              !isStarted ? (
                                                <span style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic' }}>⏰ Chưa đến giờ học</span>
                                              ) : (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                  {singleItem.isTutorReviewed ? (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                      <span style={{ fontSize: '13px', color: '#c084fc', fontWeight: 600 }}>✓ Đã đánh giá</span>
                                                      <button
                                                        onClick={() => setViewReviewDetails(singleItem)}
                                                        style={{
                                                          padding: '4px 8px',
                                                          backgroundColor: 'rgba(255,255,255,0.05)',
                                                          border: '1px solid rgba(255,255,255,0.1)',
                                                          color: '#94a3b8',
                                                          borderRadius: '6px',
                                                          fontSize: '11px',
                                                          cursor: 'pointer',
                                                        }}
                                                      >
                                                        💬 Xem
                                                      </button>
                                                    </div>
                                                  ) : (
                                                    <button
                                                      onClick={() => {
                                                        setReviewBookingId(singleItem.id);
                                                        setReviewTutorName(singleItem.studentName);
                                                        setReviewSubjectName(singleItem.subjectName);
                                                      }}
                                                      style={{
                                                        padding: '6px 12px',
                                                        backgroundColor: 'rgba(168, 85, 247, 0.15)',
                                                        border: '1px solid rgba(168, 85, 247, 0.3)',
                                                        color: '#c084fc',
                                                        borderRadius: '6px',
                                                        fontSize: '12px',
                                                        cursor: 'pointer',
                                                        fontWeight: 600,
                                                      }}
                                                    >
                                                      ✍️ Đánh Giá Học Viên
                                                    </button>
                                                  )}
                                                  <button
                                                    onClick={() => {
                                                      setSessionRecordBookingId(singleItem.id);
                                                      setSessionStudentName(singleItem.studentName);
                                                      setSessionSubjectName(singleItem.subjectName);
                                                    }}
                                                    style={{
                                                      padding: '6px 12px',
                                                      backgroundColor: 'rgba(56, 189, 248, 0.15)',
                                                      border: '1px solid rgba(56, 189, 248, 0.3)',
                                                      color: '#38bdf8',
                                                      borderRadius: '6px',
                                                      fontSize: '12px',
                                                      cursor: 'pointer',
                                                      fontWeight: 600,
                                                    }}
                                                  >
                                                    📝 Báo Cáo Buổi Học
                                                  </button>
                                                </div>
                                              )
                                            )}
                                          </>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      );
                    })()}

                    {/* Bookings Pagination */}
                    {bookingsTotalPages > 1 && (
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px' }}>
                        <button
                          disabled={bookingsPage === 1}
                          onClick={() => setBookingsPage(prev => Math.max(prev - 1, 1))}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: '1px solid rgba(255,255,255,0.15)',
                            backgroundColor: 'rgba(15,23,42,0.6)',
                            color: bookingsPage === 1 ? '#64748b' : '#fff',
                            cursor: bookingsPage === 1 ? 'not-allowed' : 'pointer',
                            fontSize: '13px',
                          }}
                        >
                          Trước
                        </button>
                        <span style={{ display: 'flex', alignItems: 'center', padding: '0 8px', fontSize: '13px', color: '#94a3b8' }}>
                          Trang {bookingsPage} / {bookingsTotalPages}
                        </span>
                        <button
                          disabled={bookingsPage === bookingsTotalPages}
                          onClick={() => setBookingsPage(prev => Math.min(prev + 1, bookingsTotalPages))}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: '1px solid rgba(255,255,255,0.15)',
                            backgroundColor: 'rgba(15,23,42,0.6)',
                            color: bookingsPage === bookingsTotalPages ? '#64748b' : '#fff',
                            cursor: bookingsPage === bookingsTotalPages ? 'not-allowed' : 'pointer',
                            fontSize: '13px',
                          }}
                        >
                          Sau
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Wallet Dashboard */}
        {isTabMounted('wallet') && (
          <div style={{ display: activeTab === 'wallet' ? 'block' : 'none' }}>
            <WalletDashboard balance={walletBalance} onBalanceChanged={setWalletBalance} />
          </div>
        )}

        {/* Tab 5: Learning Progress Dashboard */}
        {!isAdmin && isTabMounted('progress') && (
          <div style={{ display: activeTab === 'progress' ? 'block' : 'none' }}>
            <LearningProgressDashboard />
          </div>
        )}

        {/* Tab 6: Admin Reviews Dashboard */}
        {isAdmin && isTabMounted('admin-reviews') && (
          <div style={{ display: activeTab === 'admin-reviews' ? 'block' : 'none' }}>
            <AdminReviewsDashboard />
          </div>
        )}

        {/* Tab 8: Admin User Management */}
        {isAdmin && isTabMounted('admin-users') && (
          <div style={{ display: activeTab === 'admin-users' ? 'block' : 'none' }}>
            <AdminUserManagement initialSubTab={adminUserSubTab} />
          </div>
        )}

        {/* Tab 8.2: Admin Subject Management */}
        {isAdmin && isTabMounted('admin-subjects') && (
          <div style={{ display: activeTab === 'admin-subjects' ? 'block' : 'none' }}>
            <AdminSubjectManagement />
          </div>
        )}

        {/* Tab 8.5: Admin Tutor Approval */}
        {isAdmin && isTabMounted('admin-tutors') && (
          <div style={{ display: activeTab === 'admin-tutors' ? 'block' : 'none' }}>
            <AdminTutorApproval />
          </div>
        )}

        {/* Tab 8.6: Admin Revenue Dashboard */}
        {isAdmin && isTabMounted('admin-revenue') && (
          <div style={{ display: activeTab === 'admin-revenue' ? 'block' : 'none' }}>
            <AdminRevenueDashboard />
          </div>
        )}

        {/* Tab 9: Center Notifications */}
        {(isTabMounted('center-notifications') || isTabMounted('admin-notifications')) && (
          <div style={{ display: activeTab === 'center-notifications' || activeTab === 'admin-notifications' ? 'block' : 'none' }}>
            <CenterNotifications
              onNotificationsUpdated={fetchNotifications}
              onNavigate={(tab) => handleTabChange(tab as TabType)}
              isAdmin={isAdmin}
            />
          </div>
        )}
      </main>

      {/* Tutor Profile Detail Modal */}
      <TutorDetailModal tutor={selectedTutor} onClose={() => setSelectedTutor(null)} onBook={handleBookTutor} />

      {/* Tutor Profile Edit Modal */}
      <TutorProfileEditModal
        isOpen={isProfileEditOpen}
        onClose={() => handleOpenProfileEdit(false)}
        onProfileSaved={() => {
          fetchTutors();
          fetchTutorProfileStatus();
        }}
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />

      {/* Booking Modal (Phase 3) */}
      <BookingModal
        tutor={bookingTutor}
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        onBookingSuccess={handleBookingSuccess}
      />

      {/* Student Complaint Modal */}
      {complaintBookingId && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15,23,42,0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1600,
            padding: '16px',
          }}
          onClick={() => setComplaintBookingId(null)}
        >
          <div
            className="glass-panel"
            style={{ width: '100%', maxWidth: '480px', padding: '28px', borderRadius: '16px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <span style={{ fontSize: '28px' }}>🚩</span>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#fbbf24' }}>Gửi Khiếu Nại Gia Sư</h3>
                <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0, marginTop: '2px' }}>Gia sư: <strong style={{ color: '#fff' }}>{complaintTutorName}</strong> | Môn: <strong style={{ color: '#fff' }}>{complaintSubjectName}</strong></p>
              </div>
            </div>

            {complaintSuccessMsg ? (
              <div style={{ padding: '16px', backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#34d399', borderRadius: '8px', fontSize: '14px', textAlign: 'center', margin: '16px 0' }}>
                ✓ {complaintSuccessMsg}
              </div>
            ) : (
              <form onSubmit={handleSubmitComplaint}>
                <label style={{ display: 'block', fontSize: '13px', color: '#cbd5e1', marginBottom: '6px', fontWeight: 600 }}>
                  Nội dung khiếu nại (Admin sẽ xem xét & cảnh cáo gia sư): <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  value={complaintReason}
                  onChange={(e) => setComplaintReason(e.target.value)}
                  maxLength={500}
                  required
                  rows={4}
                  placeholder="Mô tả chi tiết lý do khiếu nại (ví dụ: gia sư thái độ không tôn trọng, đi muộn, tự ý kết thúc buổi học sớm, giảng bài không đúng chất lượng...)"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    backgroundColor: '#0f172a',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#fff',
                    outline: 'none',
                    fontSize: '14px',
                    resize: 'none',
                    marginBottom: '12px',
                  }}
                />

                {/* Quick suggestion chips */}
                <div style={{ marginBottom: '16px' }}>
                  <span style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>💡 Gợi ý lý do nhanh:</span>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {[
                      'Gia sư đi muộn / nghỉ không báo trước',
                      'Thái độ phục vụ không phù hợp',
                      'Giảng dạy không đúng như cam kết',
                      'Tự ý kết thúc buổi học sớm'
                    ].map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => setComplaintReason(chip)}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.15)',
                          color: '#cbd5e1',
                          borderRadius: '6px',
                          fontSize: '11px',
                          cursor: 'pointer',
                        }}
                      >
                        + {chip}
                      </button>
                    ))}
                  </div>
                </div>

                <span style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '16px', lineHeight: '1.4' }}>
                  🔒 Thông báo khiếu nại sẽ được chuyển trực tiếp tới Ban Quản Trị hệ thống (Admin). Admin sẽ gửi thông báo cảnh cáo tới gia sư và xem xét xử lý.
                </span>

                {complaintErrorMsg && (
                  <div style={{ padding: '8px 12px', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#f87171', borderRadius: '6px', fontSize: '13px', marginBottom: '12px' }}>
                    ⚠️ {complaintErrorMsg}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setComplaintBookingId(null)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.2)',
                      backgroundColor: 'transparent',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      fontSize: '13px',
                    }}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingComplaint}
                    style={{
                      padding: '8px 20px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: '#f59e0b',
                      color: '#000',
                      fontWeight: 700,
                      cursor: isSubmittingComplaint ? 'not-allowed' : 'pointer',
                      fontSize: '13px',
                    }}
                  >
                    {isSubmittingComplaint ? 'Đang gửi...' : '🚀 Gửi Khiếu Nại lên Admin'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Cancel Booking Reason Prompt Modal */}
      {cancelBookingId && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15,23,42,0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1500,
            padding: '16px',
          }}
          onClick={() => setCancelBookingId(null)}
        >
          <div
            className="glass-panel"
            style={{ width: '100%', maxWidth: '400px', padding: '24px', borderRadius: '16px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>❌ Hủy Lịch Học</h3>
            <form onSubmit={handleCancelBooking}>
              <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '8px' }}>
                Nhập lý do hủy lịch học (bắt buộc):
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                required
                rows={3}
                placeholder="Ví dụ: Bận đột xuất..."
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  backgroundColor: '#0f172a',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff',
                  outline: 'none',
                  fontSize: '14px',
                  resize: 'none',
                  marginBottom: '16px',
                }}
              />
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setCancelBookingId(null)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.2)',
                    backgroundColor: 'transparent',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={submittingAction}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#f87171',
                    color: '#0f172a',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                >
                  {submittingAction ? 'Đang xử lý...' : 'Xác Nhận Hủy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Booking meetingLink Prompt Modal */}
      {confirmBookingId && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15,23,42,0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1500,
            padding: '16px',
          }}
          onClick={() => setConfirmBookingId(null)}
        >
          <div
            className="glass-panel"
            style={{ width: '100%', maxWidth: '440px', padding: '24px', borderRadius: '16px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>✔️ Xác Nhận Buổi Dạy</h3>
            <form onSubmit={handleConfirmBooking}>
              <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '8px' }}>
                Nhập link lớp học (Google Meet, Zoom, Skype, v.v.):
              </label>
              <input
                type="text"
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                required
                placeholder="meet.google.com/abc-xyz-123"
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  backgroundColor: '#0f172a',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff',
                  outline: 'none',
                  fontSize: '14px',
                  marginBottom: '16px',
                }}
              />
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setConfirmBookingId(null)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.2)',
                    backgroundColor: 'transparent',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={submittingAction}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#10b981',
                    color: '#fff',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                >
                  {submittingAction ? 'Đang xử lý...' : 'Xác Nhận Dạy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Modal (Phase 5) */}
      <ReviewModal
        isOpen={reviewBookingId !== null}
        onClose={() => setReviewBookingId(null)}
        bookingId={reviewBookingId || ''}
        tutorName={reviewTutorName}
        subjectName={reviewSubjectName}
        onReviewSuccess={fetchBookings}
      />

      {/* Session Record Modal (Phase 5) */}
      <SessionRecordModal
        isOpen={sessionRecordBookingId !== null}
        onClose={() => setSessionRecordBookingId(null)}
        bookingId={sessionRecordBookingId || ''}
        studentName={sessionStudentName}
        subjectName={sessionSubjectName}
        onSuccess={fetchBookings}
      />

      {/* Grouped Booking Student Manager Modal */}
      {viewGroupedBooking && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15,23,42,0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1300,
            padding: '16px',
          }}
          onClick={() => setViewGroupedBooking(null)}
        >
          <div
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '800px',
              maxHeight: '85vh',
              overflowY: 'auto',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.95))',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ padding: '24px 24px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                  👥 Quản Lý Lớp Học Nhóm
                </h3>
                <div style={{ fontSize: '15px', color: '#38bdf8', fontWeight: 600, marginTop: '4px' }}>
                  {viewGroupedBooking.subjectName}
                </div>
                <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px', display: 'flex', gap: '12px' }}>
                  <span>📅 {new Date(viewGroupedBooking.scheduledStartAt).toLocaleDateString('vi-VN')}</span>
                  <span>⏰ {new Date(viewGroupedBooking.scheduledStartAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - {new Date(viewGroupedBooking.scheduledEndAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
              <button
                onClick={() => setViewGroupedBooking(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: '4px',
                  lineHeight: 1
                }}
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ fontSize: '14px', color: '#cbd5e1', fontWeight: 600 }}>
                  Danh sách học viên ({viewGroupedBooking.items.length})
                </span>
                <span style={{ fontSize: '13px', color: '#a855f7', fontWeight: 700 }}>
                  Tổng doanh thu lớp: 💎 {viewGroupedBooking.creditAmount}
                </span>
              </div>

              {/* Bulk Actions Bar */}
              {(() => {
                const pendingCount = viewGroupedBooking.items.filter((i: any) => i.status === 0).length;
                const confirmedCount = viewGroupedBooking.items.filter((i: any) => i.status === 1).length;
                const activeCount = pendingCount + confirmedCount;
                const isClassStarted = new Date() >= new Date(viewGroupedBooking.scheduledStartAt);

                if (viewGroupedBooking.items.length <= 1 || activeCount === 0) return null;

                return (
                  <div
                    style={{
                      padding: '14px 18px',
                      backgroundColor: 'rgba(56, 189, 248, 0.08)',
                      border: '1px solid rgba(56, 189, 248, 0.25)',
                      borderRadius: '12px',
                      marginBottom: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: '#38bdf8' }}>
                      <span>⚡ Thao tác hàng loạt cả lớp:</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {pendingCount > 0 && (
                        <button
                          onClick={() => {
                            setBulkMeetingLink(viewGroupedBooking.meetingLink || '');
                            setIsBulkConfirmOpen(true);
                          }}
                          disabled={bulkLoading}
                          style={{
                            padding: '6px 14px',
                            backgroundColor: '#10b981',
                            border: 'none',
                            color: '#fff',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: bulkLoading ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                          }}
                        >
                          {bulkLoading ? '⏳ Đang xử lý...' : `✔️ Xác Nhận Tất Cả (${pendingCount})`}
                        </button>
                      )}

                      {confirmedCount > 0 && (
                        <>
                          <button
                            onClick={handleBulkComplete}
                            disabled={bulkLoading || !isClassStarted}
                            style={{
                              padding: '6px 14px',
                              background: isClassStarted ? 'linear-gradient(135deg, #a855f7, #6366f1)' : 'rgba(168, 85, 247, 0.3)',
                              border: 'none',
                              color: isClassStarted ? '#fff' : '#cbd5e1',
                              borderRadius: '8px',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: bulkLoading || !isClassStarted ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              boxShadow: isClassStarted ? '0 2px 8px rgba(168, 85, 247, 0.3)' : 'none'
                            }}
                            title={!isClassStarted ? "Không thể hoàn thành khi ca học chưa bắt đầu" : undefined}
                          >
                            {bulkLoading ? '⏳ Đang xử lý...' : `🎓 Hoàn Thành Tất Cả (${confirmedCount})`}
                          </button>

                          <button
                            onClick={() => {
                              setBulkNewMeetingLink(viewGroupedBooking.meetingLink || '');
                              setIsBulkUpdateLinkOpen(true);
                            }}
                            disabled={bulkLoading}
                            style={{
                              padding: '6px 14px',
                              backgroundColor: 'rgba(56, 189, 248, 0.15)',
                              border: '1px solid rgba(56, 189, 248, 0.4)',
                              color: '#38bdf8',
                              borderRadius: '8px',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: bulkLoading ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            🔗 Đổi Link Cả Lớp
                          </button>
                        </>
                      )}

                      {activeCount > 0 && (
                        <button
                          onClick={() => setIsBulkCancelOpen(true)}
                          disabled={bulkLoading}
                          style={{
                            padding: '6px 14px',
                            backgroundColor: 'rgba(239, 68, 68, 0.15)',
                            border: '1px solid rgba(239, 68, 68, 0.4)',
                            color: '#f87171',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: bulkLoading ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          ❌ Hủy Cả Lớp
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {viewGroupedBooking.items.map((item: any) => {
                  const itemStart = new Date(item.scheduledStartAt);
                  const itemIsStarted = new Date() >= itemStart;

                  let itemStatusText = 'Chờ duyệt';
                  let itemStatusStyle = { color: '#fbbf24', backgroundColor: 'rgba(251, 191, 36, 0.15)' };
                  if (item.status === 1) {
                    itemStatusText = 'Đã xác nhận';
                    itemStatusStyle = { color: '#38bdf8', backgroundColor: 'rgba(56, 189, 248, 0.15)' };
                  } else if (item.status === 2) {
                    itemStatusText = 'Hoàn thành';
                    itemStatusStyle = { color: '#34d399', backgroundColor: 'rgba(52, 211, 153, 0.15)' };
                  } else if (item.status === 3) {
                    itemStatusText = 'Đã hủy';
                    itemStatusStyle = { color: '#f87171', backgroundColor: 'rgba(248, 113, 113, 0.15)' };
                  } else if (item.status === 4) {
                    itemStatusText = 'Đổi lịch';
                    itemStatusStyle = { color: '#a855f7', backgroundColor: 'rgba(168, 85, 247, 0.15)' };
                  }

                  return (
                    <div
                      key={item.id}
                      style={{
                        padding: '16px',
                        borderRadius: '12px',
                        backgroundColor: 'rgba(30, 41, 59, 0.4)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                      }}
                    >
                      {/* Student info and details */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              backgroundColor: 'rgba(56, 189, 248, 0.15)',
                              color: '#38bdf8',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '16px'
                            }}
                          >
                            {item.studentName ? item.studentName.charAt(0).toUpperCase() : 'S'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#fff', fontSize: '15px' }}>{item.studentName}</div>
                            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <span>Học phí: <strong style={{ color: '#a855f7' }}>💎 {item.creditAmount}</strong></span>
                              <span>•</span>
                              <span style={{ padding: '2px 8px', borderRadius: '8px', fontSize: '10px', fontWeight: 600, ...itemStatusStyle }}>
                                {itemStatusText}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Meeting link status info */}
                        {item.meetingLink && (
                          <div style={{ fontSize: '12px', color: '#38bdf8' }}>
                            🔗 Link: <a href={item.meetingLink.startsWith('http') ? item.meetingLink : `https://${item.meetingLink}`} target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8', textDecoration: 'underline' }}>{item.meetingLink}</a>
                          </div>
                        )}
                      </div>

                      {/* Student Review display (if completed) */}
                      {item.status === 2 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {item.isStudentReviewed && (
                            <div style={{ padding: '8px 12px', borderRadius: '8px', backgroundColor: 'rgba(56, 189, 248, 0.05)', border: '1px solid rgba(56, 189, 248, 0.15)', fontSize: '11px' }}>
                              <span style={{ fontWeight: 600, color: '#38bdf8' }}>🎓 Học viên đánh giá:</span>{' '}
                              <span style={{ color: '#fbbf24' }}>{'★'.repeat(item.studentRating || 5)}</span>
                              <div style={{ color: '#cbd5e1', fontStyle: 'italic', marginTop: '2px' }}>"{item.studentComment || 'Không có nhận xét viết tay'}"</div>
                            </div>
                          )}
                          {item.isTutorReviewed && (
                            <div style={{ padding: '8px 12px', borderRadius: '8px', backgroundColor: 'rgba(168, 85, 247, 0.05)', border: '1px solid rgba(168, 85, 247, 0.1)', fontSize: '11px' }}>
                              <span style={{ fontWeight: 600, color: '#c084fc' }}>👨‍🏫 Bạn đã đánh giá:</span>{' '}
                              <span style={{ color: '#fbbf24' }}>{'★'.repeat(item.tutorRating || 5)}</span>
                              <div style={{ color: '#cbd5e1', fontStyle: 'italic', marginTop: '2px' }}>"{item.tutorComment || 'Không có nhận xét viết tay'}"</div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Student individual Action Buttons */}
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '10px', justifyContent: 'flex-end' }}>
                        {item.status === 0 && (
                          <>
                            <button
                              onClick={() => setConfirmBookingId(item.id)}
                              style={{
                                padding: '5px 12px',
                                backgroundColor: '#10b981',
                                border: 'none',
                                color: '#fff',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              ✔️ Xác Nhận
                            </button>
                            <button
                              onClick={() => setCancelBookingId(item.id)}
                              style={{
                                padding: '5px 12px',
                                backgroundColor: 'rgba(239,68,68,0.15)',
                                border: '1px solid rgba(239,68,68,0.3)',
                                color: '#f87171',
                                borderRadius: '6px',
                                fontSize: '12px',
                                cursor: 'pointer',
                              }}
                            >
                              ❌ Từ Chối
                            </button>
                          </>
                        )}

                        {item.status === 1 && (
                          <>
                            <button
                              disabled={!itemIsStarted}
                              onClick={() => handleCompleteBooking(item.id)}
                              style={{
                                padding: '5px 12px',
                                backgroundColor: itemIsStarted ? '#a855f7' : 'rgba(168, 85, 247, 0.4)',
                                border: 'none',
                                color: itemIsStarted ? '#fff' : '#cbd5e1',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: itemIsStarted ? 'pointer' : 'not-allowed',
                              }}
                              title={!itemIsStarted ? "Không thể hoàn thành khi buổi học chưa diễn ra" : undefined}
                            >
                              🎓 Hoàn Thành
                            </button>
                            <button
                              onClick={() => {
                                const newLink = prompt('Nhập link meeting mới:', item.meetingLink || '');
                                if (newLink !== null) handleUpdateMeetingLink(item.id, newLink);
                              }}
                              style={{
                                padding: '5px 12px',
                                backgroundColor: 'transparent',
                                border: '1px solid rgba(255,255,255,0.2)',
                                color: '#cbd5e1',
                                borderRadius: '6px',
                                fontSize: '12px',
                                cursor: 'pointer',
                              }}
                            >
                              🔗 Đổi Link
                            </button>
                            <button
                              onClick={() => setCancelBookingId(item.id)}
                              style={{
                                padding: '5px 12px',
                                backgroundColor: 'rgba(239,68,68,0.15)',
                                border: '1px solid rgba(239,68,68,0.3)',
                                color: '#f87171',
                                borderRadius: '6px',
                                fontSize: '12px',
                                cursor: 'pointer',
                              }}
                            >
                              ❌ Hủy Lịch
                            </button>
                          </>
                        )}

                        {item.status === 2 && (
                          <>
                            {!itemIsStarted ? (
                              <span style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>⏰ Chưa đến giờ học</span>
                            ) : (
                              <>
                                {!item.isTutorReviewed && (
                                  <button
                                    onClick={() => {
                                      setReviewBookingId(item.id);
                                      setReviewTutorName(item.studentName);
                                      setReviewSubjectName(item.subjectName);
                                    }}
                                    style={{
                                      padding: '5px 12px',
                                      backgroundColor: 'rgba(168, 85, 247, 0.15)',
                                      border: '1px solid rgba(168, 85, 247, 0.3)',
                                      color: '#c084fc',
                                      borderRadius: '6px',
                                      fontSize: '12px',
                                      cursor: 'pointer',
                                      fontWeight: 600,
                                    }}
                                  >
                                    ✍️ Đánh Giá
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    setSessionRecordBookingId(item.id);
                                    setSessionStudentName(item.studentName);
                                    setSessionSubjectName(item.subjectName);
                                  }}
                                  style={{
                                    padding: '5px 12px',
                                    backgroundColor: 'rgba(56, 189, 248, 0.15)',
                                    border: '1px solid rgba(56, 189, 248, 0.3)',
                                    color: '#38bdf8',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                  }}
                                >
                                  📝 Báo Cáo Buổi Học
                                </button>
                              </>
                            )}
                          </>
                        )}
                        {item.status === 3 && (
                          <span style={{ fontSize: '12px', color: '#f87171' }}>Lịch học đã hủy</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'flex-end', backgroundColor: 'rgba(15,23,42,0.2)' }}>
              <button
                onClick={() => setViewGroupedBooking(null)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.15)',
                  backgroundColor: 'transparent',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 600
                }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BULK CONFIRM MODAL */}
      {isBulkConfirmOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2500,
            padding: '16px',
          }}
          onClick={() => !bulkLoading && setIsBulkConfirmOpen(false)}
        >
          <div
            style={{
              backgroundColor: '#1e293b',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '20px',
              padding: '28px',
              width: '100%',
              maxWidth: '480px',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: '0 0 12px 0' }}>
              ⚡ Xác Nhận Hàng Loạt Cho Cả Lớp
            </h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '16px' }}>
              Nhập một link Google Meet / Zoom chung để gửi đến toàn bộ các học viên đang chờ duyệt trong ca học này.
            </p>
            <form onSubmit={handleBulkConfirm}>
              <input
                type="text"
                placeholder="VD: https://meet.google.com/abc-xyz-123"
                value={bulkMeetingLink}
                onChange={(e) => setBulkMeetingLink(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  backgroundColor: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '14px',
                  marginBottom: '20px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  disabled={bulkLoading}
                  onClick={() => setIsBulkConfirmOpen(false)}
                  style={{
                    padding: '10px 18px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#94a3b8',
                    borderRadius: '10px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={bulkLoading}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#10b981',
                    border: 'none',
                    color: '#fff',
                    borderRadius: '10px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: bulkLoading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {bulkLoading ? '⏳ Đang xác nhận...' : '✔️ Xác Nhận Tất Cả'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BULK UPDATE MEETING LINK MODAL */}
      {isBulkUpdateLinkOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2500,
            padding: '16px',
          }}
          onClick={() => !bulkLoading && setIsBulkUpdateLinkOpen(false)}
        >
          <div
            style={{
              backgroundColor: '#1e293b',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '20px',
              padding: '28px',
              width: '100%',
              maxWidth: '480px',
              boxShadow: '0 25px 50px -12px rgba(56, 189, 248, 0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#38bdf8', margin: '0 0 12px 0' }}>
              🔗 Đổi Link Phòng Học Cho Cả Lớp
            </h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '16px' }}>
              Nhập link Google Meet / Zoom mới để cập nhật đồng loạt cho toàn bộ học viên trong ca học này.
            </p>
            <form onSubmit={handleBulkUpdateMeetingLink}>
              <input
                type="text"
                placeholder="VD: https://meet.google.com/xyz-uvw-999"
                value={bulkNewMeetingLink}
                onChange={(e) => setBulkNewMeetingLink(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  backgroundColor: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '14px',
                  marginBottom: '20px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  disabled={bulkLoading}
                  onClick={() => setIsBulkUpdateLinkOpen(false)}
                  style={{
                    padding: '10px 18px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#94a3b8',
                    borderRadius: '10px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={bulkLoading}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#0284c7',
                    border: 'none',
                    color: '#fff',
                    borderRadius: '10px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: bulkLoading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {bulkLoading ? '⏳ Đang lưu...' : '💾 Cập Nhật Link Cả Lớp'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BULK CANCEL MODAL */}
      {isBulkCancelOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2500,
            padding: '16px',
          }}
          onClick={() => !bulkLoading && setIsBulkCancelOpen(false)}
        >
          <div
            style={{
              backgroundColor: '#1e293b',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '20px',
              padding: '28px',
              width: '100%',
              maxWidth: '480px',
              boxShadow: '0 25px 50px -12px rgba(239, 68, 68, 0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#f87171', margin: '0 0 12px 0' }}>
              ❌ Hủy Toàn Bộ Ca Học
            </h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '16px' }}>
              Nhập lý do hủy ca học. Hệ thống sẽ tự động hoàn trả 100% tín chỉ cho tất cả các học viên trong ca học này.
            </p>
            <form onSubmit={handleBulkCancel}>
              <textarea
                rows={3}
                placeholder="VD: Gia sư bận đột xuất, xin phép đổi ca khác..."
                value={bulkCancelReason}
                onChange={(e) => setBulkCancelReason(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  backgroundColor: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '14px',
                  marginBottom: '20px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  resize: 'none',
                }}
              />
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  disabled={bulkLoading}
                  onClick={() => setIsBulkCancelOpen(false)}
                  style={{
                    padding: '10px 18px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#94a3b8',
                    borderRadius: '10px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={bulkLoading}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#ef4444',
                    border: 'none',
                    color: '#fff',
                    borderRadius: '10px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: bulkLoading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {bulkLoading ? '⏳ Đang hủy...' : 'Xác Nhận Hủy Cả Lớp'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Container (Phase 6 Real-time alerts) */}
      <ToastContainer toasts={toasts} onRemove={handleRemoveToast} />

      {/* REVIEW DETAILS MODAL (For viewing submitted reviews) */}
      {viewReviewDetails && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2600,
            padding: '16px',
          }}
          onClick={() => setViewReviewDetails(null)}
        >
          <div
            style={{
              backgroundColor: '#1e293b',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '24px',
              padding: '32px',
              width: '100%',
              maxWidth: '520px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: '#38bdf8' }}>
                ⭐ Chi Tiết Đánh Giá Buổi Học
              </h3>
              <button
                onClick={() => setViewReviewDetails(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '12px 16px', borderRadius: '12px', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.05)', fontSize: '13px' }}>
              <div style={{ color: '#94a3b8', marginBottom: '4px' }}>Môn học: <strong style={{ color: '#fff' }}>{viewReviewDetails.subjectName}</strong></div>
              <div style={{ color: '#94a3b8', marginBottom: '4px' }}>Học viên: <span style={{ color: '#38bdf8' }}>{viewReviewDetails.studentName || 'Học viên'}</span></div>
              <div style={{ color: '#94a3b8' }}>Gia sư: <span style={{ color: '#c084fc' }}>{viewReviewDetails.tutorName || 'Gia sư'}</span></div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Student Review */}
              <div style={{ padding: '16px', borderRadius: '14px', backgroundColor: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 700, color: '#38bdf8', fontSize: '14px' }}>🎓 Đánh giá từ Học viên</span>
                  {viewReviewDetails.isStudentReviewed ? (
                    <span style={{ color: '#fbbf24', fontSize: '16px' }}>{'★'.repeat(viewReviewDetails.studentRating || 5)}</span>
                  ) : (
                    <span style={{ color: '#94a3b8', fontSize: '12px', fontStyle: 'italic' }}>Chưa gửi đánh giá</span>
                  )}
                </div>
                {viewReviewDetails.isStudentReviewed && (
                  <div style={{ color: '#cbd5e1', fontSize: '13px', fontStyle: 'italic', lineHeight: '1.5', marginTop: '4px' }}>
                    "{viewReviewDetails.studentComment || 'Không có nhận xét viết tay'}"
                  </div>
                )}
              </div>

              {/* Tutor Review */}
              <div style={{ padding: '16px', borderRadius: '14px', backgroundColor: 'rgba(168, 85, 247, 0.08)', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 700, color: '#c084fc', fontSize: '14px' }}>👨‍🏫 Đánh giá từ Gia sư</span>
                  {viewReviewDetails.isTutorReviewed ? (
                    <span style={{ color: '#fbbf24', fontSize: '16px' }}>{'★'.repeat(viewReviewDetails.tutorRating || 5)}</span>
                  ) : (
                    <span style={{ color: '#94a3b8', fontSize: '12px', fontStyle: 'italic' }}>Chưa gửi đánh giá</span>
                  )}
                </div>
                {viewReviewDetails.isTutorReviewed && (
                  <div style={{ color: '#cbd5e1', fontSize: '13px', fontStyle: 'italic', lineHeight: '1.5', marginTop: '4px' }}>
                    "{viewReviewDetails.tutorComment || 'Không có nhận xét viết tay'}"
                  </div>
                )}
              </div>
            </div>

            <div style={{ marginTop: '24px', textAlign: 'right' }}>
              <button
                onClick={() => setViewReviewDetails(null)}
                style={{
                  padding: '10px 24px',
                  backgroundColor: '#38bdf8',
                  border: 'none',
                  color: '#0f172a',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tutor Profile Edit Modal */}
      <TutorProfileEditModal
        isOpen={isProfileEditOpen}
        onClose={() => handleOpenProfileEdit(false)}
        onProfileSaved={() => {
          fetchTutors();
          fetchWalletBalance();
        }}
      />

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
        © 2026 TutorMatching App | Connected to TutorPlatform.API
      </footer>
      </div>
    </div>
  );
}
