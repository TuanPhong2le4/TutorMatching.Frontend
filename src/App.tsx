import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { AuthModal } from './components/AuthModal';
import { tutorService } from './services/tutorService';
import { TutorSearchResult, Subject } from './types/tutor';
import { TutorCard } from './components/TutorCard';
import { TutorDetailModal } from './components/TutorDetailModal';
import { TutorSearchFilter } from './components/TutorSearchFilter';

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'tutors' | 'bookings'>('home');
  const { user, isAuthenticated, openAuthModal, logout } = useAuth();

  // Phase 2 Tutors Search & Filter States
  const [tutors, setTutors] = useState<TutorSearchResult[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedTutor, setSelectedTutor] = useState<TutorSearchResult | null>(null);

  // Filter States
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [minRating, setMinRating] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Booking notification toast state
  const [bookingNotice, setBookingNotice] = useState<string | null>(null);

  // Load Subjects on mount
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const data = await tutorService.getAllSubjects();
        setSubjects(data || []);
      } catch (err) {
        console.error('Failed to load subjects:', err);
      }
    };
    fetchSubjects();
  }, []);

  // Fetch Tutors when filters or activeTab change
  useEffect(() => {
    if (activeTab === 'tutors' || activeTab === 'home') {
      fetchTutors();
    }
  }, [activeTab, searchTerm, selectedSubjectId, minRating, pageNumber]);

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

  const handleBookTutor = (tutor: TutorSearchResult) => {
    if (!isAuthenticated) {
      openAuthModal('login');
    } else {
      setBookingNotice(`Đã chọn Gia Sư: ${tutor.fullName}. Chức năng Đặt Lịch Học (Phase 3) đã sẵn sàng!`);
      setTimeout(() => setBookingNotice(null), 5000);
    }
  };

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
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {isAuthenticated && user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <span style={{ fontWeight: 600, fontSize: '14px', color: '#f8fafc' }}>{user.fullName}</span>
                <span style={{ fontSize: '12px', color: '#38bdf8' }}>
                  {Number(user.role) === 2 || user.role === 'Student' ? '🎓 Học Viên' : Number(user.role) === 1 || user.role === 'Tutor' ? '👨‍🏫 Gia Sư' : '👑 Admin'}
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
          ) : (
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => openAuthModal('login')}
                style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 500 }}
              >
                Đăng Nhập
              </button>
              <button
                onClick={() => openAuthModal('register')}
                className="btn-primary"
              >
                Đăng Ký
              </button>
            </div>
          )}
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
                {!isAuthenticated && (
                  <button
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '14px 32px', fontSize: '16px', borderRadius: '10px', cursor: 'pointer', fontWeight: 600 }}
                    onClick={() => openAuthModal('register')}
                  >
                    Đăng Ký Tài Khoản
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
                <div style={{ color: '#94a3b8', textAlign: 'center', padding: '40px' }}>Đang tải danh sách gia sư...</div>
              ) : tutors.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
                  {tutors.slice(0, 3).map((tutor) => (
                    <TutorCard key={tutor.tutorId} tutor={tutor} onSelect={setSelectedTutor} onBook={handleBookTutor} />
                  ))}
                </div>
              ) : (
                <div style={{ color: '#94a3b8', textAlign: 'center', padding: '40px' }}>Chưa có gia sư nào trong hệ thống.</div>
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
                <h3 style={{ fontSize: '18px', color: '#fff', marginBottom: '8px' }}>Không Tìm Thấy Gia Sư Nào</h3>
                <p style={{ fontSize: '14px', maxWidth: '400px', margin: '0 auto 20px' }}>
                  Rất tiếc, không có gia sư nào phù hợp với bộ lọc hiện tại. Bạn vui lòng thử tìm kiếm với từ khóa khác hoặc bỏ chọn bộ lọc.
                </p>
                <button onClick={handleResetFilters} className="btn-primary" style={{ padding: '10px 20px', fontSize: '14px' }}>
                  🔄 Xóa Bộ Lọc
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Bookings Placeholder */}
        {activeTab === 'bookings' && (
          <div className="glass-panel" style={{ padding: '32px', borderRadius: '16px' }}>
            <h2 style={{ fontSize: '24px', marginBottom: '16px' }}>🗓️ Quản Lý Lịch Học & Đặt Chỗ</h2>
            {isAuthenticated ? (
              <p style={{ color: '#4ade80' }}>Bạn đã đăng nhập với tài khoản <strong>{user?.fullName}</strong>. Chức năng Quản lý Lịch học & Đặt chỗ (Phase 3) đã sẵn sàng để phát triển tiếp theo!</p>
            ) : (
              <div>
                <p style={{ color: '#f87171', marginBottom: '16px' }}>Bạn cần đăng nhập để xem và quản lý lịch học.</p>
                <button className="btn-primary" onClick={() => openAuthModal('login')}>
                  Đăng Nhập Ngay
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modals */}
      <AuthModal />
      <TutorDetailModal tutor={selectedTutor} onClose={() => setSelectedTutor(null)} onBook={handleBookTutor} />

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.1)', padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
        © 2026 TutorMatching - Phase 2 Frontend App | Connected to TutorPlatform.API
      </footer>
    </div>
  );
}
