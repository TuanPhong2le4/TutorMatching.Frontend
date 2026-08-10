import React, { useState, useEffect } from 'react';
import { adminUserService, AdminDashboardDto } from '../services/adminUserService';

export interface AdminDashboardProps {
  onNavigateTab?: (
    tab:
      | 'home'
      | 'tutors'
      | 'bookings'
      | 'wallet'
      | 'progress'
      | 'admin-reviews'
      | 'admin-users'
      | 'admin-tutors'
      | 'admin-revenue'
      | 'admin-subjects'
      | 'center-notifications',
    subTab?: 'students' | 'tutors'
  ) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigateTab }) => {
  const [stats, setStats] = useState<AdminDashboardDto | null>(null);
  const [statsLoading, setStatsLoading] = useState<boolean>(true);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      setStatsLoading(true);
      const data = await adminUserService.getDashboard();
      setStats(data);
    } catch (err) {
      console.error('Failed to load admin dashboard stats:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  const formatCurrency = (val: number) => {
    // 1 credit = 1,000 VND
    return (val * 1000).toLocaleString('vi-VN') + 'đ';
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderTrend = (growth: number) => {
    if (growth > 0) {
      return <span style={{ color: '#10b981', fontWeight: 600 }}>↑ {growth}%</span>;
    } else if (growth < 0) {
      return <span style={{ color: '#f87171', fontWeight: 600 }}>↓ {Math.abs(growth)}%</span>;
    } else {
      return <span style={{ color: '#94a3b8', fontWeight: 600 }}>→ 0%</span>;
    }
  };

  const currentDateStr = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Dynamic card hover styling helper
  const getCardStyle = (cardId: string, accentColor: string = '#38bdf8') => {
    const isHovered = hoveredCard === cardId;
    return {
      backgroundColor: '#1e293b',
      border: `1px solid ${isHovered ? accentColor : 'rgba(255, 255, 255, 0.08)'}`,
      borderRadius: '20px',
      padding: '24px',
      position: 'relative' as const,
      overflow: 'hidden' as const,
      cursor: 'pointer',
      transform: isHovered ? 'translateY(-8px) scale(1.02)' : 'translateY(0) scale(1)',
      boxShadow: isHovered
        ? `0 20px 30px -10px rgba(0, 0, 0, 0.6), 0 0 25px ${accentColor}40`
        : '0 4px 12px rgba(0, 0, 0, 0.2)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    };
  };

  return (
    <div style={{ color: '#fff', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header welcome row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '28px', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            Xin chào, Admin! 👋
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '15px', margin: '4px 0 0' }}>
            Tổng quan hoạt động của hệ thống TutorMatching. Nhấp vào các thẻ để xem trang quản lý tương ứng.
          </p>
        </div>
        <div
          style={{
            padding: '10px 16px',
            borderRadius: '12px',
            backgroundColor: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            fontSize: '14px',
            fontWeight: 600,
            color: '#38bdf8',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          📅 Hôm nay: {currentDateStr}
        </div>
      </div>

      {/* Top Stats Row */}
      {statsLoading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Đang tải số liệu thống kê...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
          {/* Card 1: Gia sư -> Link to Quản Lý Gia Sư */}
          <div
            style={getCardStyle('card-tutors', '#38bdf8')}
            onMouseEnter={() => setHoveredCard('card-tutors')}
            onMouseLeave={() => setHoveredCard(null)}
            onClick={() => onNavigateTab?.('admin-users', 'tutors')}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div>
                <span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Gia sư
                </span>
                <h3 style={{ fontSize: '28px', fontWeight: '800', margin: '8px 0 4px', color: '#fff' }}>
                  {stats?.totalTutors.toLocaleString('vi-VN')}
                </h3>
              </div>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(56, 189, 248, 0.15)',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: '20px',
                }}
              >
                👨‍🏫
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#cbd5e1' }}>
              {stats && renderTrend(stats.tutorsGrowth)}
              <span style={{ color: '#64748b' }}>so với tháng trước</span>
            </div>

            {/* Micro interaction banner */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: '14px',
                paddingTop: '10px',
                borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                fontSize: '12px',
                color: hoveredCard === 'card-tutors' ? '#38bdf8' : '#64748b',
                fontWeight: 600,
                transition: 'color 0.2s ease',
              }}
            >
              <span>👨‍🏫 Quản lý Gia sư</span>
              <span>→</span>
            </div>

            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #38bdf8, transparent)' }} />
          </div>

          {/* Card 2: Học viên -> Link to Quản Lý Học Viên */}
          <div
            style={getCardStyle('card-students', '#a855f7')}
            onMouseEnter={() => setHoveredCard('card-students')}
            onMouseLeave={() => setHoveredCard(null)}
            onClick={() => onNavigateTab?.('admin-users', 'students')}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div>
                <span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Học viên
                </span>
                <h3 style={{ fontSize: '28px', fontWeight: '800', margin: '8px 0 4px', color: '#fff' }}>
                  {stats?.totalStudents.toLocaleString('vi-VN')}
                </h3>
              </div>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(168, 85, 247, 0.15)',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: '20px',
                }}
              >
                🎓
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#cbd5e1' }}>
              {stats && renderTrend(stats.studentsGrowth)}
              <span style={{ color: '#64748b' }}>so với tháng trước</span>
            </div>

            {/* Micro interaction banner */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: '14px',
                paddingTop: '10px',
                borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                fontSize: '12px',
                color: hoveredCard === 'card-students' ? '#a855f7' : '#64748b',
                fontWeight: 600,
                transition: 'color 0.2s ease',
              }}
            >
              <span>🎓 Quản lý Học viên</span>
              <span>→</span>
            </div>

            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #a855f7, transparent)' }} />
          </div>

          {/* Card 3: Lớp học -> Link to Lịch Học */}
          <div
            style={getCardStyle('card-bookings', '#ec4899')}
            onMouseEnter={() => setHoveredCard('card-bookings')}
            onMouseLeave={() => setHoveredCard(null)}
            onClick={() => onNavigateTab?.('bookings')}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div>
                <span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Lớp học
                </span>
                <h3 style={{ fontSize: '28px', fontWeight: '800', margin: '8px 0 4px', color: '#fff' }}>
                  {stats?.totalBookings.toLocaleString('vi-VN')}
                </h3>
              </div>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(236, 72, 153, 0.15)',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: '20px',
                }}
              >
                📅
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#cbd5e1' }}>
              {stats && renderTrend(stats.bookingsGrowth)}
              <span style={{ color: '#64748b' }}>so với tháng trước</span>
            </div>

            {/* Micro interaction banner */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: '14px',
                paddingTop: '10px',
                borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                fontSize: '12px',
                color: hoveredCard === 'card-bookings' ? '#ec4899' : '#64748b',
                fontWeight: 600,
                transition: 'color 0.2s ease',
              }}
            >
              <span>🗓️ Quản lý Lịch học</span>
              <span>→</span>
            </div>

            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #ec4899, transparent)' }} />
          </div>

          {/* Card 4: Doanh thu -> Link to Doanh Thu */}
          <div
            style={getCardStyle('card-revenue', '#f59e0b')}
            onMouseEnter={() => setHoveredCard('card-revenue')}
            onMouseLeave={() => setHoveredCard(null)}
            onClick={() => onNavigateTab?.('admin-revenue')}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div>
                <span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Doanh thu nạp tiền
                </span>
                <h3 style={{ fontSize: '24px', fontWeight: '800', margin: '12px 0 4px', color: '#fff' }}>
                  {stats ? formatCurrency(stats.totalRevenue) : '0đ'}
                </h3>
              </div>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(245, 158, 11, 0.15)',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: '20px',
                }}
              >
                🪙
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#cbd5e1' }}>
              {stats && renderTrend(stats.revenueGrowth)}
              <span style={{ color: '#64748b' }}>so với tháng trước</span>
            </div>

            {/* Micro interaction banner */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: '14px',
                paddingTop: '10px',
                borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                fontSize: '12px',
                color: hoveredCard === 'card-revenue' ? '#f59e0b' : '#64748b',
                fontWeight: 600,
                transition: 'color 0.2s ease',
              }}
            >
              <span>📈 Báo cáo Doanh thu</span>
              <span>→</span>
            </div>

            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #f59e0b, transparent)' }} />
          </div>
        </div>
      )}

      {/* Charts & Tables Container */}
      {!statsLoading && stats && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Chart Card: Popular Subjects -> Link to Quản Lý Môn Học */}
          <div
            style={getCardStyle('card-chart-subjects', '#10b981')}
            onMouseEnter={() => setHoveredCard('card-chart-subjects')}
            onMouseLeave={() => setHoveredCard(null)}
            onClick={() => onNavigateTab?.('admin-subjects')}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h4 style={{ fontSize: '18px', fontWeight: '700', margin: 0, color: '#fff' }}>
                🍰 Học viên theo môn học
              </h4>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: hoveredCard === 'card-chart-subjects' ? '#10b981' : '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'color 0.2s ease',
                }}
              >
                📚 Quản lý danh mục môn học →
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '48px', flexWrap: 'wrap', justifyContent: 'center' }}>
              {/* Donut graphic */}
              <div style={{ position: 'relative', width: '180px', height: '180px' }}>
                <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />

                  {/* Subject segments */}
                  {stats.popularSubjects.length > 0 ? (
                    (() => {
                      let totalBookings = stats.popularSubjects.reduce((acc, curr) => acc + curr.bookingCount, 0);
                      totalBookings = totalBookings > 0 ? totalBookings : 1;
                      let accumulatedPercentage = 0;
                      const colors = ['#38bdf8', '#a855f7', '#ec4899', '#f59e0b', '#10b981'];

                      return stats.popularSubjects.map((sub, idx) => {
                        const percent = (sub.bookingCount / totalBookings) * 100;
                        const dashArray = `${percent} ${100 - percent}`;
                        const dashOffset = 100 - accumulatedPercentage;
                        accumulatedPercentage += percent;

                        return (
                          <circle
                            key={sub.subjectId}
                            cx="18"
                            cy="18"
                            r="15.915"
                            fill="none"
                            stroke={colors[idx % colors.length]}
                            strokeWidth="3.2"
                            strokeDasharray={dashArray}
                            strokeDashoffset={dashOffset}
                          />
                        );
                      });
                    })()
                  ) : (
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#64748b" strokeWidth="3.2" strokeDasharray="100 0" />
                  )}
                </svg>
                {/* Total count center text */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>Tổng cộng</span>
                  <span style={{ fontSize: '24px', fontWeight: '800', color: '#fff' }}>{stats.totalBookings}</span>
                </div>
              </div>

              {/* Legends list */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '220px', maxWidth: '480px' }}>
                {(() => {
                  const colors = ['#38bdf8', '#a855f7', '#ec4899', '#f59e0b', '#10b981'];
                  let totalBookings = stats.popularSubjects.reduce((acc, curr) => acc + curr.bookingCount, 0);
                  totalBookings = totalBookings > 0 ? totalBookings : 1;

                  return stats.popularSubjects.map((sub, idx) => {
                    const percent = Math.round((sub.bookingCount / totalBookings) * 100);
                    return (
                      <div
                        key={sub.subjectId}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '14px',
                          borderBottom: '1px solid rgba(255,255,255,0.05)',
                          paddingBottom: '6px',
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#cbd5e1' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: colors[idx % colors.length] }} />
                          {sub.subjectName}
                        </span>
                        <span style={{ fontWeight: 600 }}>
                          {sub.bookingCount} lớp ({percent}%)
                        </span>
                      </div>
                    );
                  });
                })()}
                {stats.popularSubjects.length === 0 && (
                  <span style={{ color: '#94a3b8', fontSize: '13px', fontStyle: 'italic' }}>Chưa có dữ liệu lớp học</span>
                )}
              </div>
            </div>
          </div>

          {/* Recent Bookings List Card -> Link to Quản Lý Đánh Giá & Lớp Học */}
          <div
            style={getCardStyle('card-recent-bookings', '#38bdf8')}
            onMouseEnter={() => setHoveredCard('card-recent-bookings')}
            onMouseLeave={() => setHoveredCard(null)}
            onClick={() => onNavigateTab?.('bookings')}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h4 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', margin: 0 }}>
                📅 Lịch học sắp tới
              </h4>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: hoveredCard === 'card-recent-bookings' ? '#38bdf8' : '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'color 0.2s ease',
                }}
              >
                Xem chi tiết lịch học →
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {stats.recentBookings.map((b) => (
                <div
                  key={b.bookingId}
                  style={{
                    padding: '16px 20px',
                    borderRadius: '14px',
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '16px',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span style={{ fontWeight: 800, fontSize: '15px', color: '#fff' }}>{b.subjectName}</span>
                    <span style={{ fontSize: '13px', color: '#cbd5e1' }}>
                      👨‍🏫 Gia sư: <strong style={{ color: '#38bdf8' }}>{b.tutorName}</strong> • 🎓 Học viên: <strong style={{ color: '#a855f7' }}>{b.studentName}</strong>
                    </span>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                      ⏰ Thời gian: {formatTime(b.scheduledStartAt)} - {formatTime(b.scheduledEndAt)} | {formatDate(b.scheduledStartAt)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                    <span style={{ fontWeight: 800, color: '#a855f7', fontSize: '14px' }}>💎 {b.creditAmount} tc</span>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '4px 10px',
                        borderRadius: '10px',
                        backgroundColor:
                          b.status === 'Completed' || b.status === 'Hoàn thành'
                            ? 'rgba(16, 185, 129, 0.15)'
                            : b.status === 'Cancelled' || b.status === 'Đã hủy'
                            ? 'rgba(239, 68, 68, 0.15)'
                            : 'rgba(56, 189, 248, 0.15)',
                        color:
                          b.status === 'Completed' || b.status === 'Hoàn thành'
                            ? '#10b981'
                            : b.status === 'Cancelled' || b.status === 'Đã hủy'
                            ? '#f87171'
                            : '#38bdf8',
                      }}
                    >
                      {b.status}
                    </span>
                  </div>
                </div>
              ))}

              {stats.recentBookings.length === 0 && (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '32px 0', fontSize: '15px' }}>
                  Chưa có lớp học nào được đặt gần đây
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
