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

export default function App() {
  const { user, isAuthenticated, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'home' | 'tutors' | 'bookings' | 'wallet' | 'progress'>('home');

  // Phase 4 Wallet State
  const [walletBalance, setWalletBalance] = useState<number | null>(null);

  // Phase 2 Tutors Search & Filter States
  const [tutors, setTutors] = useState<TutorSearchResult[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedTutor, setSelectedTutor] = useState<TutorSearchResult | null>(null);
  const [isProfileEditOpen, setIsProfileEditOpen] = useState<boolean>(false);

  // Filter States
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [minRating, setMinRating] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

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
        pageNumber,
        pageSize: 6,
      });

      setTutors(res.items || []);
      setTotalPages(res.totalPages || 1);
      setTotalCount(res.totalCount || 0);
    } catch (err) {
      console.error('Failed to fetch tutors from API:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
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
    setActiveTab('bookings');
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => setActiveTab('home')}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #38bdf8, #a855f7)', display: 'grid', placeItems: 'center', fontWeight: 'bold', fontSize: '20px' }}>
            T
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: '700' }} className="gradient-text">TutorMatching</h1>
        </div>

        <nav style={{ display: 'flex', gap: '24px' }}>
          <button 
            onClick={() => setActiveTab('home')}
            style={{ background: 'none', border: 'none', color: activeTab === 'home' ? '#38bdf8' : '#94a3b8', cursor: 'pointer', fontWeight: 600, fontSize: '15px' }}>
            Trang Chủ
          </button>
          <button 
            onClick={() => setActiveTab('tutors')}
            style={{ background: 'none', border: 'none', color: activeTab === 'tutors' ? '#38bdf8' : '#94a3b8', cursor: 'pointer', fontWeight: 600, fontSize: '15px' }}>
            🔍 Tìm Gia Sư
          </button>
          <button 
            onClick={() => setActiveTab('bookings')}
            style={{ background: 'none', border: 'none', color: activeTab === 'bookings' ? '#38bdf8' : '#94a3b8', cursor: 'pointer', fontWeight: 600, fontSize: '15px' }}>
            🗓️ Lịch Học
          </button>
          <button 
            onClick={() => setActiveTab('wallet')}
            style={{ background: 'none', border: 'none', color: activeTab === 'wallet' ? '#38bdf8' : '#94a3b8', cursor: 'pointer', fontWeight: 600, fontSize: '15px' }}>
            {Number(user?.role) === 0 || user?.role === 'Admin' ? '💎 Duyệt Nạp Tiền' : '💎 Ví Tín Dụng'}
          </button>
          {(Number(user?.role) !== 0 && user?.role !== 'Admin') && (
            <button 
              onClick={() => setActiveTab('progress')}
              style={{ background: 'none', border: 'none', color: activeTab === 'progress' ? '#38bdf8' : '#94a3b8', cursor: 'pointer', fontWeight: 600, fontSize: '15px' }}>
              🎯 Tiến Độ Học
            </button>
          )}
        </nav>

        {/* User Profile & Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {isTutorRole && (
            <button
              onClick={() => setIsProfileEditOpen(true)}
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
              onClick={() => setActiveTab('wallet')}
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
            <div style={{ textAlign: 'center', marginTop: '20px', marginBottom: '48px' }}>
              <h2 style={{ fontSize: '46px', fontWeight: '800', lineHeight: 1.2, marginBottom: '16px' }}>
                Tìm Gia Sư Hoàn Hảo CHO <br />
                <span className="gradient-text">HÀNH TRÌNH HỌC TẬP CỦA BẠN</span>
              </h2>
              <p style={{ color: '#94a3b8', fontSize: '17px', maxWidth: '680px', margin: '0 auto 32px' }}>
                Kết nối trực tiếp với gia sư chất lượng cao, lọc môn học thông minh, theo dõi đánh giá minh bạch và đặt lịch học theo tín chỉ với Backend ASP.NET Core.
              </p>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '48px' }}>
                <button className="btn-primary" style={{ padding: '14px 32px', fontSize: '16px' }} onClick={() => setActiveTab('tutors')}>
                  🔍 Khám Phá {totalCount > 0 ? `${totalCount} Gia Sư` : 'Danh Sách Gia Sư'}
                </button>
                {isTutorRole && (
                  <button
                    onClick={() => setIsProfileEditOpen(true)}
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
                <button onClick={() => setActiveTab('tutors')} style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', fontWeight: 600 }}>Xem tất cả →</button>
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
              searchTerm={searchTerm}
              onSearchChange={(val) => { setSearchTerm(val); setPageNumber(1); }}
              selectedSubjectId={selectedSubjectId}
              onSubjectChange={(val) => { setSelectedSubjectId(val); setPageNumber(1); }}
              minRating={minRating}
              onMinRatingChange={(val) => { setMinRating(val); setPageNumber(1); }}
              subjects={subjects}
              onReset={handleResetFilters}
            />

            {/* Tutors Grid */}
            {loading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="glass-panel" style={{ padding: '24px', height: '260px', opacity: 0.5 }}>
                    <div style={{ fontSize: '14px', color: '#94a3b8' }}>Đang tải dữ liệu gia sư từ API...</div>
                  </div>
                ))}
              </div>
            ) : tutors.length > 0 ? (
              <div>
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
              <AvailabilityManager />
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
                            <th style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '13px', fontWeight: 600 }}>MÔN HỌC</th>
                            <th style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '13px', fontWeight: 600 }}>{isTutorRole ? 'HỌC VIÊN' : 'GIA SƯ'}</th>
                            <th style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '13px', fontWeight: 600 }}>THỜI GIAN</th>
                            <th style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '13px', fontWeight: 600 }}>CHI PHÍ</th>
                            <th style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '13px', fontWeight: 600 }}>TRẠNG THÁI</th>
                            <th style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '13px', fontWeight: 600 }}>LIÊN KẾT / THAO TÁC</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bookings.map((b) => {
                            const start = new Date(b.scheduledStartAt);
                            const end = new Date(b.scheduledEndAt);
                            const formattedDate = start.toLocaleDateString('vi-VN');
                            const formattedTime = `${start.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;

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
                                <td style={{ padding: '16px', fontWeight: 600, color: '#fff' }}>{b.subjectName}</td>
                                <td style={{ padding: '16px' }}>{isTutorRole ? b.studentName : b.tutorName}</td>
                                <td style={{ padding: '16px' }}>
                                  <div>📅 {formattedDate}</div>
                                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>⏰ {formattedTime}</div>
                                </td>
                                <td style={{ padding: '16px', fontWeight: 700, color: '#a855f7' }}>💎 {b.creditAmount}</td>
                                <td style={{ padding: '16px' }}>
                                  <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600, ...statusStyle }}>
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
                                          onClick={() => handleCompleteBooking(b.id)}
                                          style={{
                                            padding: '6px 12px',
                                            backgroundColor: '#a855f7',
                                            border: 'none',
                                            color: '#fff',
                                            borderRadius: '6px',
                                            fontSize: '12px',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                          }}
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
                                    )}

                                    {isTutorRole && b.status === 2 && (
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
      </main>

      {/* Tutor Profile Detail Modal */}
      <TutorDetailModal tutor={selectedTutor} onClose={() => setSelectedTutor(null)} onBook={handleBookTutor} />

      {/* Tutor Profile Edit Modal */}
      <TutorProfileEditModal
        isOpen={isProfileEditOpen}
        onClose={() => setIsProfileEditOpen(false)}
        onProfileSaved={fetchTutors}
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

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.1)', padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
        © 2026 TutorMatching App | Connected to TutorPlatform.API
      </footer>
    </div>
  );
}
