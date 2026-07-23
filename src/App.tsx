import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { AuthModal } from './components/AuthModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'tutors' | 'bookings'>('home');
  const { user, isAuthenticated, openAuthModal, logout } = useAuth();

  return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      <header className="glass-panel" style={{ margin: '16px 24px', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
            Tìm Gia Sư
          </button>
          <button 
            onClick={() => setActiveTab('bookings')}
            style={{ background: 'none', border: 'none', color: activeTab === 'bookings' ? '#38bdf8' : '#94a3b8', cursor: 'pointer', fontWeight: 600, fontSize: '15px' }}>
            Lịch Học
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

      <main style={{ flex: 1, padding: '32px 24px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        {activeTab === 'home' && (
          <div style={{ textAlign: 'center', marginTop: '40px' }}>
            <h2 style={{ fontSize: '48px', fontWeight: '800', lineHeight: 1.2, marginBottom: '16px' }}>
              Tìm Gia Sư Hoàn Hảo CHO <br />
              <span className="gradient-text">HÀNH TRÌNH HỌC TẬP CỦA BẠN</span>
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '18px', maxWidth: '640px', margin: '0 auto 32px' }}>
              Kết nối trực tiếp với gia sư chất lượng cao, đặt lịch linh hoạt, theo dõi tiến độ và đánh giá minh bạch với Backend ASP.NET Core RESTful API.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '64px' }}>
              <button className="btn-primary" style={{ padding: '14px 32px', fontSize: '16px' }} onClick={() => setActiveTab('tutors')}>
                Khám Phá Gia Sư
              </button>
              {!isAuthenticated && (
                <button
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '14px 32px', fontSize: '16px', borderRadius: '10px', cursor: 'pointer', fontWeight: 600 }}
                  onClick={() => openAuthModal('register')}
                >
                  Đăng Ký Gia Sư / Học Viên
                </button>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
              <div className="glass-panel" style={{ padding: '24px', textAlign: 'left' }}>
                <h3 style={{ fontSize: '14px', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>Xác Thực JWT</h3>
                <p style={{ fontSize: '20px', fontWeight: '700', color: '#38bdf8' }}>
                  {isAuthenticated ? '● Đã Đăng Nhập' : '○ Chưa Đăng Nhập'}
                </p>
                <span style={{ fontSize: '13px', color: '#4ade80' }}>● Tự động lưu Token vào LocalStorage</span>
              </div>
              <div className="glass-panel" style={{ padding: '24px', textAlign: 'left' }}>
                <h3 style={{ fontSize: '14px', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>Công Nghệ Frontend</h3>
                <p style={{ fontSize: '20px', fontWeight: '700', color: '#a855f7' }}>React 18 + Context API</p>
                <span style={{ fontSize: '13px', color: '#94a3b8' }}>Quản lý state Auth toàn cục</span>
              </div>
              <div className="glass-panel" style={{ padding: '24px', textAlign: 'left' }}>
                <h3 style={{ fontSize: '14px', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>Kết Nối API Backend</h3>
                <p style={{ fontSize: '20px', fontWeight: '700', color: '#6366f1' }}>POST /api/Auth/*</p>
                <span style={{ fontSize: '13px', color: '#94a3b8' }}>Axios Client với Interceptor</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tutors' && (
          <div>
            <h2 style={{ fontSize: '28px', marginBottom: '24px' }}>Danh Sách Gia Sư Nổi Bật</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
              {[
                { name: 'Nguyễn Văn A', subject: 'Toán Học (Đại Số & Hình Học)', rate: '250.000đ/giờ', rating: '4.9 ★' },
                { name: 'Trần Thị B', subject: 'Tiếng Anh (IELTS / Giao Tiếp)', rate: '300.000đ/giờ', rating: '5.0 ★' },
                { name: 'Lê Hoàng C', subject: 'Vật Lý & Hóa Học THPT', rate: '200.000đ/giờ', rating: '4.8 ★' },
              ].map((tutor, idx) => (
                <div key={idx} className="glass-panel" style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '600' }}>{tutor.name}</h3>
                    <span style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '4px 8px', borderRadius: '6px', fontSize: '13px', fontWeight: '600' }}>{tutor.rating}</span>
                  </div>
                  <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '16px' }}>{tutor.subject}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px' }}>
                    <span style={{ fontWeight: '700', fontSize: '16px', color: '#4ade80' }}>{tutor.rate}</span>
                    <button
                      className="btn-primary"
                      style={{ padding: '8px 16px', fontSize: '14px' }}
                      onClick={() => {
                        if (!isAuthenticated) {
                          openAuthModal('login');
                        } else {
                          alert('Chức năng đặt lịch đang được kết nối!');
                        }
                      }}
                    >
                      Đặt Lịch
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'bookings' && (
          <div className="glass-panel" style={{ padding: '32px' }}>
            <h2 style={{ fontSize: '24px', marginBottom: '16px' }}>Quản Lý Lịch Học & Đặt Chỗ</h2>
            {isAuthenticated ? (
              <p style={{ color: '#4ade80' }}>Bạn đã đăng nhập với tên <strong>{user?.fullName}</strong>. Dữ liệu lịch học sẽ được tải từ API `/api/Bookings`.</p>
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

      <AuthModal />

      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.1)', padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
        © 2026 TutorMatching - Frontend React App | Connected to TutorPlatform.API
      </footer>
    </div>
  );
}
