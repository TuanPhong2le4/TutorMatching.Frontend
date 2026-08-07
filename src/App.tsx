import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { AuthPage } from './pages/AuthPage';
import { tutorService } from './services/tutorService';
import { TutorSearchResult, Subject } from './types/tutor';
import { TutorCard } from './components/TutorCard';
import { TutorDetailModal } from './components/TutorDetailModal';
import { TutorSearchFilter } from './components/TutorSearchFilter';
import { TutorProfileEditModal } from './components/TutorProfileEditModal';
import { BookingModal } from './components/BookingModal';
import { AvailabilityManager } from './components/AvailabilityManager';
import { bookingService, BookingDto } from './services/bookingService';
import { WalletDashboard } from './components/WalletDashboard';
import { creditService } from './services/creditService';
import { ReviewModal } from './components/ReviewModal';
import { SessionRecordModal } from './components/SessionRecordModal';
import { LearningProgressDashboard } from './components/LearningProgressDashboard';
import { AdminReviewsDashboard } from './components/AdminReviewsDashboard';
import { AdminUserManagement } from './components/AdminUserManagement';
import { CenterNotifications } from './components/CenterNotifications';
import { AdminDashboard } from './components/AdminDashboard';
import { profileService } from './services/profileService';
import { availabilityService } from './services/availabilityService';
import { AdminTutorApproval } from './components/AdminTutorApproval';

// Phase 6 imports
import { HubConnectionBuilder } from '@microsoft/signalr';
import { notificationService } from './services/notificationService';
import { NotificationDto } from './types/notification';
import { ToastContainer, ToastItem } from './components/ToastContainer';
import { NotificationDropdown } from './components/NotificationDropdown';

export default function App() {
  const { user, isAuthenticated, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'home' | 'tutors' | 'bookings' | 'wallet' | 'progress' | 'admin-reviews' | 'admin-users' | 'admin-tutors' | 'center-notifications'>('home');

  // Role-based active tab guards during render to prevent stale/unauthorized tab mounts
  const roleNum = Number(user?.role);
  const isAdmin = roleNum === 0 || user?.role === 'Admin';
  if (isAuthenticated) {
    if (isAdmin && (activeTab === 'progress' || activeTab === 'center-notifications')) {
      setActiveTab('home');
    }
    if (!isAdmin && (activeTab === 'admin-reviews' || activeTab === 'admin-users' || activeTab === 'admin-tutors')) {
      setActiveTab('home');
    }
  }
  const [isProfileEditOpen, setIsProfileEditOpen] = useState<boolean>(false);
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

  const handleTabChange = (tab: 'home' | 'tutors' | 'bookings' | 'wallet' | 'progress' | 'admin-reviews' | 'admin-users' | 'admin-tutors' | 'center-notifications') => {
    const roleNum = Number(user?.role);
    const isAdmin = roleNum === 0 || user?.role === 'Admin';

    // Role guards for tab switching
    if (tab === 'admin-reviews' && !isAdmin) return;
    if (tab === 'admin-users' && !isAdmin) return;
    if (tab === 'admin-tutors' && !isAdmin) return;
    if (tab === 'progress' && isAdmin) return;
    if (tab === 'center-notifications' && isAdmin) return;

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
        } else if (path === '/center-notifications') {
          if (isAdmin) {
            setActiveTab('home');
            window.history.replaceState(null, '', '/home');
          } else {
            setActiveTab('center-notifications');
          }
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
        } else if (path === '/home') {
          setActiveTab('home');
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

    const token = localStorage.getItem('token');
    if (!token) return;

    // Connect to /hubs/notifications hub, passing token in query string
    const connection = new HubConnectionBuilder()
      .withUrl('/hubs/notifications', {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect()
      .build();

    connection
      .start()
      .then(() => {
        console.log('SignalR connected to NotificationHub successfully.');
      })
      .catch((err) => {
        console.error('SignalR NotificationHub connection failed:', err);
      });

    // Listen to real-time incoming notification events
    connection.on('ReceiveNotification', (notification: NotificationDto) => {
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
      if (notification.type === 'BookingCreated' || notification.type === 'BookingCancelled') {
        fetchBookings();
      }
      if (notification.type === 'CreditChanged') {
        fetchWalletBalance();
      }
    });

    return () => {
      connection.stop().then(() => console.log('SignalR connection stopped.'));
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
      alert('🎉 Nạp tiền qua VNPAY thành công! Tín chỉ đã được cộng vào tài khoản của bạn.');
      window.history.replaceState({}, document.title, window.location.pathname);
      fetchWalletBalance();
      setActiveTab('wallet');
    } else if (paymentStatus === 'failed') {
      alert('❌ Thanh toán qua VNPAY thất bại hoặc bị hủy bỏ.');
      window.history.replaceState({}, document.title, window.location.pathname);
      setActiveTab('wallet');
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
      setLoading(true);
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
    } catch (err) {
      console.error('Failed to fetch tutors from API:', err);
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
      setBookingsLoading(true);
      const res = await bookingService.getMyBookings(bookingsPage, 10);
      setBookings(res.items || []);
      setBookingsTotalCount(res.totalCount || 0);
      setBookingsTotalPages(Math.ceil((res.totalCount || 0) / 10));
    } catch (err) {
      console.error('Failed to load bookings:', err);
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
      alert(err.response?.data?.message || 'Không thể hủy lịch học. Vui lòng thử lại.');
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
      alert(err.response?.data?.message || 'Không thể xác nhận lịch học. Vui lòng thử lại.');
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
      alert(err.response?.data?.message || 'Không thể cập nhật link. Vui lòng thử lại.');
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
      alert(err.response?.data?.message || 'Có lỗi xảy ra.');
    }
  };

  // IF NOT AUTHENTICATED: Show Dedicated Standalone Auth Page (Login & Register)
  if (!isAuthenticated) {
    return <AuthPage />;
  }

  // IF AUTHENTICATED: Render Main Application & Dashboard Page
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Header Navigation */}
      <header
        className="glass-panel"
        style={{
          margin: '16px 24px',
          padding: '16px 32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => handleTabChange('home')}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #38bdf8, #a855f7)', display: 'grid', placeItems: 'center', fontWeight: 'bold', fontSize: '20px' }}>
            T
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: '700' }} className="gradient-text">TutorMatching</h1>
        </div>

        <nav style={{ display: 'flex', gap: '24px' }}>
          <button 
            onClick={() => handleTabChange('home')}
            style={{ background: 'none', border: 'none', color: activeTab === 'home' ? '#38bdf8' : '#94a3b8', cursor: 'pointer', fontWeight: 600, fontSize: '15px' }}>
            Trang Chủ
          </button>
          <button 
            onClick={() => handleTabChange('tutors')}
            style={{ background: 'none', border: 'none', color: activeTab === 'tutors' ? '#38bdf8' : '#94a3b8', cursor: 'pointer', fontWeight: 600, fontSize: '15px' }}>
            🔍 Tìm Gia Sư
          </button>
          <button 
            onClick={() => handleTabChange('bookings')}
            style={{ background: 'none', border: 'none', color: activeTab === 'bookings' ? '#38bdf8' : '#94a3b8', cursor: 'pointer', fontWeight: 600, fontSize: '15px' }}>
            🗓️ Lịch Học
          </button>
          <button 
            onClick={() => handleTabChange('wallet')}
            style={{ background: 'none', border: 'none', color: activeTab === 'wallet' ? '#38bdf8' : '#94a3b8', cursor: 'pointer', fontWeight: 600, fontSize: '15px' }}>
            {Number(user?.role) === 0 || user?.role === 'Admin' ? '💎 Quản Lý Nạp Tiền' : '💎 Ví Tín Dụng'}
          </button>
          {(Number(user?.role) === 0 || user?.role === 'Admin') && (
            <>
              <button 
                onClick={() => handleTabChange('admin-reviews')}
                style={{ background: 'none', border: 'none', color: activeTab === 'admin-reviews' ? '#38bdf8' : '#94a3b8', cursor: 'pointer', fontWeight: 600, fontSize: '15px' }}>
                👑 Quản Lý Đánh Giá
              </button>
              <button 
                onClick={() => handleTabChange('admin-users')}
                style={{ background: 'none', border: 'none', color: activeTab === 'admin-users' ? '#38bdf8' : '#94a3b8', cursor: 'pointer', fontWeight: 600, fontSize: '15px' }}>
                👥 Quản Lý Người Dùng
              </button>
              <button 
                onClick={() => handleTabChange('admin-tutors')}
                style={{ background: 'none', border: 'none', color: activeTab === 'admin-tutors' ? '#38bdf8' : '#94a3b8', cursor: 'pointer', fontWeight: 600, fontSize: '15px' }}>
                📝 Duyệt Hồ Sơ Gia Sư
              </button>
            </>
          )}
          {(Number(user?.role) !== 0 && user?.role !== 'Admin') && (
            <>
              <button 
                onClick={() => handleTabChange('progress')}
                style={{ background: 'none', border: 'none', color: activeTab === 'progress' ? '#38bdf8' : '#94a3b8', cursor: 'pointer', fontWeight: 600, fontSize: '15px' }}>
                🎯 Tiến Độ Học
              </button>
              <button 
                onClick={() => handleTabChange('center-notifications')}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: activeTab === 'center-notifications' ? '#38bdf8' : '#94a3b8', 
                  cursor: 'pointer', 
                  fontWeight: 600, 
                  fontSize: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                📢 Thông báo Trung tâm
                {notifications.filter(n => (n.type === 'System' || n.type === 'TutorApproved' || n.type === 'TutorRejected') && !n.isRead).length > 0 && (
                  <span style={{
                    backgroundColor: '#ef4444',
                    color: '#fff',
                    borderRadius: '50%',
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2.5px 7px',
                    lineHeight: 1,
                    display: 'inline-block',
                    boxShadow: '0 0 8px rgba(239, 68, 68, 0.5)'
                  }}>
                    {notifications.filter(n => (n.type === 'System' || n.type === 'TutorApproved' || n.type === 'TutorRejected') && !n.isRead).length}
                  </span>
                )}
              </button>
            </>
          )}
        </nav>

        {/* User Profile & Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {isTutorRole && (
            <button
              onClick={() => handleOpenProfileEdit(true)}
              style={{
                background: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid #38bdf8',
                color: '#38bdf8',
                padding: '8px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              ⚙️ Cập Nhật Hồ Sơ Gia Sư
            </button>
          )}

          {/* Wallet Balance Pill */}
          {(Number(user?.role) !== 0 && user?.role !== 'Admin') && (
            <div
              onClick={() => handleTabChange('wallet')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'rgba(168, 85, 247, 0.15)',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                color: '#c084fc',
                padding: '6px 12px',
                borderRadius: '20px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 700,
                transition: 'all 0.2s',
              }}
              title="Xem ví tín dụng"
            >
              <span>💎</span>
              <span>{walletBalance !== null ? walletBalance.toFixed(1) : '...'} tc</span>
            </div>
          )}

          {/* Phase 6 Notification Bell Dropdown */}
          <NotificationDropdown
            notifications={notifications}
            unreadCount={unreadCount}
            onRefresh={fetchNotifications}
            onMarkRead={handleMarkNotificationRead}
            onMarkAllRead={handleMarkAllNotificationsRead}
            onNavigate={(tab) => handleTabChange(tab as any)}
          />

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontWeight: 600, fontSize: '14px', color: '#f8fafc' }}>{user?.fullName}</span>
            <span style={{ fontSize: '12px', color: '#38bdf8' }}>
              {Number(user?.role) === 2 || user?.role === 'Student' ? '🎓 Học Viên' : isTutorRole ? '👨‍🏫 Gia Sư' : '👑 Admin'}
            </span>
          </div>

          <button
            onClick={logout}
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            Đăng Xuất
          </button>
        </div>
      </header>

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
        {activeTab === 'home' && (
          <div>
            {isAdmin ? (
              <AdminDashboard />
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
        {activeTab === 'tutors' && (
          <div>
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
        {activeTab === 'bookings' && (
          <div>
            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '4px' }}>
                  🗓️ Quản Lý Lịch Học & Giảng Dạy
                </h2>
                <p style={{ color: '#94a3b8', fontSize: '15px' }}>
                  {isTutorRole ? 'Quản lý lịch dạy học và cấu hình khung giờ rảnh của bạn.' : 'Xem danh sách lớp học và trạng thái lịch học của bạn.'}
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
                {bookingsLoading ? (
                  <div style={{ color: '#94a3b8', textAlign: 'center', padding: '48px' }}>Đang tải lịch học của bạn...</div>
                ) : bookings.length === 0 ? (
                  <div style={{ color: '#94a3b8', textAlign: 'center', padding: '48px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>🗓️</div>
                    <h3 style={{ color: '#fff', fontSize: '18px', marginBottom: '8px' }}>Chưa Có Buổi Học Nào</h3>
                    <p style={{ fontSize: '14px', maxWidth: '380px', margin: '0 auto' }}>
                      {isTutorRole ? 'Hiện tại chưa có học sinh nào đặt lịch học với bạn.' : 'Bạn chưa đặt lịch học với gia sư nào. Hãy chuyển sang tab Tìm Gia Sư để bắt đầu học!'}
                    </p>
                  </div>
                ) : (
                  <div>
                    {/* Bookings Table / List */}
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                            <th style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap' }}>MÔN HỌC</th>
                            <th style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap' }}>{isTutorRole ? 'HỌC VIÊN' : 'GIA SƯ'}</th>
                            <th style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap' }}>THỜI GIAN</th>
                            <th style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap' }}>CHI PHÍ</th>
                            <th style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap' }}>TRẠNG THÁI</th>
                            <th style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap' }}>LIÊN KẾT / THAO TÁC</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bookings.map((b) => {
                            const start = new Date(b.scheduledStartAt);
                            const end = new Date(b.scheduledEndAt);
                            const formattedDate = start.toLocaleDateString('vi-VN');
                            const formattedTime = `${start.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
                            const isStarted = new Date() >= start;

                            // Status badge config
                            let statusText = 'Chờ duyệt';
                            let statusStyle = { color: '#fbbf24', backgroundColor: 'rgba(251, 191, 36, 0.15)' };
                            if (b.status === 1) {
                              statusText = 'Đã xác nhận';
                              statusStyle = { color: '#38bdf8', backgroundColor: 'rgba(56, 189, 248, 0.15)' };
                            } else if (b.status === 2) {
                              statusText = 'Hoàn thành';
                              statusStyle = { color: '#34d399', backgroundColor: 'rgba(52, 211, 153, 0.15)' };
                            } else if (b.status === 3) {
                              statusText = 'Đã hủy';
                              statusStyle = { color: '#f87171', backgroundColor: 'rgba(248, 113, 113, 0.15)' };
                            } else if (b.status === 4) {
                              statusText = 'Thay đổi lịch';
                              statusStyle = { color: '#a855f7', backgroundColor: 'rgba(168, 85, 247, 0.15)' };
                            }

                            return (
                              <tr key={b.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '14px' }}>
                                <td style={{ padding: '16px', fontWeight: 600, color: '#fff' }}>
                                  <div>{b.subjectName}</div>
                                  {b.status === 2 && (
                                    <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px', fontWeight: 'normal' }}>
                                      {/* Student Review of Tutor */}
                                      {b.isStudentReviewed && (
                                        <div style={{ padding: '6px 10px', borderRadius: '8px', backgroundColor: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.15)', fontSize: '11px', maxWidth: '320px' }}>
                                          <span style={{ fontWeight: 600, color: '#38bdf8' }}>🎓 Học viên đánh giá:</span>{' '}
                                          <span style={{ color: '#fbbf24' }}>{'★'.repeat(b.studentRating || 5)}</span>
                                          <div style={{ color: '#cbd5e1', fontStyle: 'italic', marginTop: '2px' }}>"{b.studentComment || 'Không có nhận xét viết tay'}"</div>
                                        </div>
                                      )}
                                      
                                      {/* Tutor Review of Student */}
                                      {b.isTutorReviewed && (
                                        <div style={{ padding: '6px 10px', borderRadius: '8px', backgroundColor: 'rgba(168, 85, 247, 0.08)', border: '1px solid rgba(168, 85, 247, 0.15)', fontSize: '11px', maxWidth: '320px' }}>
                                          <span style={{ fontWeight: 600, color: '#c084fc' }}>👨‍🏫 Gia sư đánh giá:</span>{' '}
                                          <span style={{ color: '#fbbf24' }}>{'★'.repeat(b.tutorRating || 5)}</span>
                                          <div style={{ color: '#cbd5e1', fontStyle: 'italic', marginTop: '2px' }}>"{b.tutorComment || 'Không có nhận xét viết tay'}"</div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </td>
                                <td style={{ padding: '16px' }}>{isTutorRole ? b.studentName : b.tutorName}</td>
                                <td style={{ padding: '16px' }}>
                                  <div>📅 {formattedDate}</div>
                                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>⏰ {formattedTime}</div>
                                </td>
                                <td style={{ padding: '16px', fontWeight: 700, color: '#a855f7' }}>💎 {b.creditAmount}</td>
                                <td style={{ padding: '16px' }}>
                                  <span style={{ display: 'inline-block', whiteSpace: 'nowrap', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600, ...statusStyle }}>
                                    {statusText}
                                  </span>
                                </td>
                                <td style={{ padding: '16px' }}>
                                  {/* Action Buttons based on Role & Status */}
                                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                                    {b.meetingLink && b.status === 1 && (
                                      <a
                                        href={b.meetingLink.startsWith('http') ? b.meetingLink : `https://${b.meetingLink}`}
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
                                        }}
                                      >
                                        🌐 Vào Lớp Học
                                      </a>
                                    )}

                                    {/* Student Cancel Option */}
                                    {!isTutorRole && (b.status === 0 || b.status === 1) && (
                                      <button
                                        onClick={() => setCancelBookingId(b.id)}
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
                                    )}

                                    {/* Tutor Actions */}
                                    {isTutorRole && b.status === 0 && (
                                      <>
                                        <button
                                          onClick={() => setConfirmBookingId(b.id)}
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
                                          onClick={() => setCancelBookingId(b.id)}
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

                                    {isTutorRole && b.status === 1 && (
                                      <>
                                        <button
                                          disabled={!isStarted}
                                          onClick={() => handleCompleteBooking(b.id)}
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
                                            const newLink = prompt('Nhập link meeting mới:', b.meetingLink || '');
                                            if (newLink !== null) handleUpdateMeetingLink(b.id, newLink);
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
                                          onClick={() => setCancelBookingId(b.id)}
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

                                    {/* Actions for completed bookings */}
                                    {!isTutorRole && b.status === 2 && (
                                      !isStarted ? (
                                        <span style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic' }}>⏰ Chưa đến giờ học</span>
                                      ) : b.isStudentReviewed ? (
                                        <span style={{ fontSize: '13px', color: '#34d399', fontWeight: 600 }}>✓ Đã đánh giá</span>
                                      ) : (
                                        <button
                                          onClick={() => {
                                            setReviewBookingId(b.id);
                                            setReviewTutorName(b.tutorName);
                                            setReviewSubjectName(b.subjectName);
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
                                      )
                                    )}

                                    {isTutorRole && b.status === 2 && (
                                      !isStarted ? (
                                        <span style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic' }}>⏰ Chưa đến giờ học</span>
                                      ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                          {b.isTutorReviewed ? (
                                            <span style={{ fontSize: '13px', color: '#c084fc', fontWeight: 600 }}>✓ Đã đánh giá học viên</span>
                                          ) : (
                                            <button
                                              onClick={() => {
                                                setReviewBookingId(b.id);
                                                setReviewTutorName(b.studentName);
                                                setReviewSubjectName(b.subjectName);
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
                                              setSessionRecordBookingId(b.id);
                                              setSessionStudentName(b.studentName);
                                              setSessionSubjectName(b.subjectName);
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
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

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
        {activeTab === 'wallet' && (
          <WalletDashboard balance={walletBalance} onBalanceChanged={setWalletBalance} />
        )}

        {/* Tab 5: Learning Progress Dashboard */}
        {activeTab === 'progress' && (
          <LearningProgressDashboard />
        )}

        {/* Tab 6: Admin Reviews Dashboard */}
        {activeTab === 'admin-reviews' && (
          <AdminReviewsDashboard />
        )}

        {/* Tab 8: Admin User Management */}
        {activeTab === 'admin-users' && (
          <AdminUserManagement />
        )}

        {/* Tab 8.5: Admin Tutor Approval */}
        {activeTab === 'admin-tutors' && (
          <AdminTutorApproval />
        )}

        {/* Tab 9: Center Notifications */}
        {activeTab === 'center-notifications' && (
          <CenterNotifications onNotificationsUpdated={fetchNotifications} />
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

      {/* Booking Modal (Phase 3) */}
      <BookingModal
        tutor={bookingTutor}
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        onBookingSuccess={handleBookingSuccess}
      />

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
            zIndex: 1300,
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
            zIndex: 1300,
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

      {/* Toast Container (Phase 6 Real-time alerts) */}
      <ToastContainer toasts={toasts} onRemove={handleRemoveToast} />

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.1)', padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
        © 2026 TutorMatching App | Connected to TutorPlatform.API
      </footer>
    </div>
  );
}
