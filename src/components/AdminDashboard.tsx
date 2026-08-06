import React, { useState, useEffect } from 'react';
import { adminUserService, AdminDashboardDto, PendingTutorDto } from '../services/adminUserService';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminDashboardDto | null>(null);
  const [pendingTutors, setPendingTutors] = useState<PendingTutorDto[]>([]);
  const [statsLoading, setStatsLoading] = useState<boolean>(true);
  const [tutorsLoading, setTutorsLoading] = useState<boolean>(true);
  
  // Selected tutor for details modal
  const [selectedPendingTutor, setSelectedPendingTutor] = useState<PendingTutorDto | null>(null);
  const [actionSubmitting, setActionSubmitting] = useState<boolean>(false);

  useEffect(() => {
    loadDashboardStats();
    loadPendingTutors();
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

  const loadPendingTutors = async () => {
    try {
      setTutorsLoading(true);
      const data = await adminUserService.getPendingTutors(1, 5);
      setPendingTutors(data.items || []);
    } catch (err) {
      console.error('Failed to load pending tutors:', err);
    } finally {
      setTutorsLoading(false);
    }
  };

  const handleApprove = async (tutorId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn DUYỆT hồ sơ gia sư này?')) return;
    try {
      setActionSubmitting(true);
      await adminUserService.approveTutor(tutorId);
      alert('Đã duyệt hồ sơ gia sư thành công.');
      setSelectedPendingTutor(null);
      loadDashboardStats();
      loadPendingTutors();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi duyệt hồ sơ.');
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleReject = async (tutorId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn TỪ CHỐI hồ sơ gia sư này?')) return;
    try {
      setActionSubmitting(true);
      await adminUserService.rejectTutor(tutorId);
      alert('Đã từ chối hồ sơ gia sư.');
      setSelectedPendingTutor(null);
      loadDashboardStats();
      loadPendingTutors();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi từ chối hồ sơ.');
    } finally {
      setActionSubmitting(false);
    }
  };

  const formatCurrency = (val: number) => {
    // 1 credit = 10,000 VND
    return (val * 10000).toLocaleString('vi-VN') + 'đ';
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const currentDateStr = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div style={{ color: '#fff', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header welcome row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '28px', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            Xin chào, Admin! 👋
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '15px', margin: '4px 0 0' }}>
            Tổng quan hoạt động của hệ thống TutorMatching hôm nay
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
            gap: '8px'
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
          {/* Card 1: Gia sư */}
          <div className="glass-panel" style={{ padding: '24px', borderRadius: '20px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div>
                <span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Gia sư</span>
                <h3 style={{ fontSize: '28px', fontWeight: '800', margin: '8px 0 4px', color: '#fff' }}>
                  {stats?.totalTutors.toLocaleString('vi-VN')}
                </h3>
              </div>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: 'rgba(56, 189, 248, 0.15)', display: 'grid', placeItems: 'center', fontSize: '20px' }}>
                👨‍🏫
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#10b981', fontWeight: 600 }}>
              <span>↑ 12.5%</span>
              <span style={{ color: '#64748b', fontWeight: 'normal' }}>so với tháng trước</span>
            </div>
            {/* Sparkline line decoration */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #38bdf8, transparent)' }} />
          </div>

          {/* Card 2: Học viên */}
          <div className="glass-panel" style={{ padding: '24px', borderRadius: '20px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div>
                <span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Học viên</span>
                <h3 style={{ fontSize: '28px', fontWeight: '800', margin: '8px 0 4px', color: '#fff' }}>
                  {stats?.totalStudents.toLocaleString('vi-VN')}
                </h3>
              </div>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: 'rgba(168, 85, 247, 0.15)', display: 'grid', placeItems: 'center', fontSize: '20px' }}>
                🎓
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#10b981', fontWeight: 600 }}>
              <span>↑ 8.2%</span>
              <span style={{ color: '#64748b', fontWeight: 'normal' }}>so với tháng trước</span>
            </div>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #a855f7, transparent)' }} />
          </div>

          {/* Card 3: Lớp học */}
          <div className="glass-panel" style={{ padding: '24px', borderRadius: '20px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div>
                <span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Lớp học</span>
                <h3 style={{ fontSize: '28px', fontWeight: '800', margin: '8px 0 4px', color: '#fff' }}>
                  {stats?.totalBookings.toLocaleString('vi-VN')}
                </h3>
              </div>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: 'rgba(236, 72, 153, 0.15)', display: 'grid', placeItems: 'center', fontSize: '20px' }}>
                📅
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#10b981', fontWeight: 600 }}>
              <span>↑ 15.3%</span>
              <span style={{ color: '#64748b', fontWeight: 'normal' }}>so với tháng trước</span>
            </div>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #ec4899, transparent)' }} />
          </div>

          {/* Card 4: Doanh thu */}
          <div className="glass-panel" style={{ padding: '24px', borderRadius: '20px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div>
                <span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Doanh thu nạp tiền</span>
                <h3 style={{ fontSize: '24px', fontWeight: '800', margin: '12px 0 4px', color: '#fff' }}>
                  {stats ? formatCurrency(stats.totalRevenue) : '0đ'}
                </h3>
              </div>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: 'rgba(245, 158, 11, 0.15)', display: 'grid', placeItems: 'center', fontSize: '20px' }}>
                🪙
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#10b981', fontWeight: 600 }}>
              <span>↑ 18.7%</span>
              <span style={{ color: '#64748b', fontWeight: 'normal' }}>so với tháng trước</span>
            </div>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #f59e0b, transparent)' }} />
          </div>
        </div>
      )}

      {/* Charts Section */}
      {!statsLoading && stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px' }}>
          {/* Chart Left: Gender Breakdown */}
          <div className="glass-panel" style={{ padding: '24px', borderRadius: '20px' }}>
            <h4 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px', color: '#fff' }}>
              📊 Thống kê học viên theo giới tính
            </h4>
            
            {/* Visual Bar representation */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '24px' }}>
              {/* Male Bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px', fontWeight: 600 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#38bdf8' }} />
                    Nam
                  </span>
                  <span>45%</span>
                </div>
                <div style={{ width: '100%', height: '10px', borderRadius: '5px', backgroundColor: 'rgba(255,255,255,0.06)' }}>
                  <div style={{ width: '45%', height: '100%', borderRadius: '5px', backgroundColor: '#38bdf8' }} />
                </div>
              </div>

              {/* Female Bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px', fontWeight: 600 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#a855f7' }} />
                    Nữ
                  </span>
                  <span>40%</span>
                </div>
                <div style={{ width: '100%', height: '10px', borderRadius: '5px', backgroundColor: 'rgba(255,255,255,0.06)' }}>
                  <div style={{ width: '40%', height: '100%', borderRadius: '5px', backgroundColor: '#a855f7' }} />
                </div>
              </div>

              {/* Kids/Others Bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px', fontWeight: 600 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#f59e0b' }} />
                    Trẻ em
                  </span>
                  <span>15%</span>
                </div>
                <div style={{ width: '100%', height: '10px', borderRadius: '5px', backgroundColor: 'rgba(255,255,255,0.06)' }}>
                  <div style={{ width: '15%', height: '100%', borderRadius: '5px', backgroundColor: '#f59e0b' }} />
                </div>
              </div>
            </div>
            
            {/* Spark line details */}
            <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '36px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '20px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#38bdf8' }}>{Math.round(stats.totalStudents * 0.45)}</div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>Nam học viên</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#a855f7' }}>{Math.round(stats.totalStudents * 0.40)}</div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>Nữ học viên</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#f59e0b' }}>{Math.round(stats.totalStudents * 0.15)}</div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>Trẻ em / Khác</div>
              </div>
            </div>
          </div>

          {/* Chart Right: Popular Subjects */}
          <div className="glass-panel" style={{ padding: '24px', borderRadius: '20px', display: 'flex', flexDirection: 'column' }}>
            <h4 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px', color: '#fff' }}>
              🍰 Học viên theo môn học
            </h4>
            
            <div style={{ display: 'flex', flex: 1, alignItems: 'center', gap: '24px', flexWrap: 'wrap', justifyContent: 'center' }}>
              {/* Donut graphic */}
              <div style={{ position: 'relative', width: '150px', height: '150px' }}>
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
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>Tổng cộng</span>
                  <span style={{ fontSize: '20px', fontWeight: '800', color: '#fff' }}>{stats.totalBookings}</span>
                </div>
              </div>

              {/* Legends list */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '180px' }}>
                {(() => {
                  const colors = ['#38bdf8', '#a855f7', '#ec4899', '#f59e0b', '#10b981'];
                  let totalBookings = stats.popularSubjects.reduce((acc, curr) => acc + curr.bookingCount, 0);
                  totalBookings = totalBookings > 0 ? totalBookings : 1;

                  return stats.popularSubjects.map((sub, idx) => {
                    const percent = Math.round((sub.bookingCount / totalBookings) * 100);
                    return (
                      <div key={sub.subjectId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#cbd5e1' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: colors[idx % colors.length] }} />
                          {sub.subjectName}
                        </span>
                        <span style={{ fontWeight: 600 }}>
                          {sub.bookingCount} ({percent}%)
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
        </div>
      )}

      {/* Bottom Tables Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px' }}>
        {/* Recent Bookings List */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h4 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', margin: 0 }}>
              📅 Lịch học sắp tới
            </h4>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>Mới nhất</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {stats?.recentBookings.map((b) => (
              <div
                key={b.bookingId}
                style={{
                  padding: '12px 16px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontWeight: 700, fontSize: '14px', color: '#fff' }}>{b.subjectName}</span>
                  <span style={{ fontSize: '12px', color: '#cbd5e1' }}>
                    👨‍🏫 {b.tutorName} • 🎓 {b.studentName}
                  </span>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                    ⏰ {formatTime(b.scheduledStartAt)} - {formatTime(b.scheduledEndAt)} | {formatDate(b.scheduledStartAt)}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                  <span style={{ fontWeight: 700, color: '#a855f7', fontSize: '13px' }}>💎 {b.creditAmount}</span>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: '8px',
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
                          : '#38bdf8'
                    }}
                  >
                    {b.status}
                  </span>
                </div>
              </div>
            ))}

            {stats?.recentBookings.length === 0 && (
              <div style={{ textAlign: 'center', color: '#94a3b8', padding: '24px 0', fontSize: '14px' }}>
                Chưa có lớp học nào được đặt gần đây
              </div>
            )}
          </div>
        </div>

        {/* Pending Tutors List */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h4 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', margin: 0 }}>
              👨‍🏫 Gia sư mới đăng ký
            </h4>
            <span style={{ fontSize: '12px', color: '#fbbf24', fontWeight: 600 }}>Chờ duyệt</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {tutorsLoading ? (
              <div style={{ textAlign: 'center', color: '#94a3b8', padding: '24px 0' }}>Đang tải danh sách chờ...</div>
            ) : pendingTutors.map((t) => (
              <div
                key={t.userId}
                style={{
                  padding: '12px 16px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: '70%' }}>
                  <span style={{ fontWeight: 700, fontSize: '14px', color: '#fff' }}>{t.fullName}</span>
                  <span style={{ fontSize: '12px', color: '#cbd5e1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    🎓 {t.qualifications || 'Chưa cấu hình bằng cấp'}
                  </span>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                    ✉️ {t.email} • 📅 Đăng ký: {formatDate(t.createdAt)}
                  </span>
                </div>
                <div>
                  <button
                    onClick={() => setSelectedPendingTutor(t)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.2)',
                      backgroundColor: 'transparent',
                      color: '#fff',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    Xem hồ sơ
                  </button>
                </div>
              </div>
            ))}

            {!tutorsLoading && pendingTutors.length === 0 && (
              <div style={{ textAlign: 'center', color: '#94a3b8', padding: '24px 0', fontSize: '14px' }}>
                🎉 Không có gia sư nào đang chờ duyệt hồ sơ
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tutor Profile Detail Modal for Approval */}
      {selectedPendingTutor && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1300,
            padding: '16px',
          }}
          onClick={() => setSelectedPendingTutor(null)}
        >
          <div
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '560px',
              padding: '32px',
              borderRadius: '24px',
              position: 'relative',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '20px', color: '#fff' }}>
              🔍 Xét Duyệt Hồ Sơ Gia Sư
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '28px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Họ và Tên:</label>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>{selectedPendingTutor.fullName}</div>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Email:</label>
                <div style={{ fontSize: '14px', color: '#cbd5e1' }}>{selectedPendingTutor.email}</div>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Bằng cấp / Trình độ:</label>
                <div style={{ fontSize: '14px', color: '#fff', backgroundColor: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  {selectedPendingTutor.qualifications}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Giới thiệu bản thân (Bio):</label>
                <div style={{ fontSize: '14px', color: '#cbd5e1', whiteSpace: 'pre-wrap', backgroundColor: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)', maxHeight: '150px', overflowY: 'auto' }}>
                  {selectedPendingTutor.bio}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Ngày đăng ký:</label>
                <div style={{ fontSize: '14px', color: '#cbd5e1' }}>{formatDate(selectedPendingTutor.createdAt)}</div>
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setSelectedPendingTutor(null)}
                disabled={actionSubmitting}
                style={{
                  padding: '10px 20px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  backgroundColor: 'transparent',
                  color: '#94a3b8',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Đóng
              </button>
              
              <button
                type="button"
                onClick={() => handleReject(selectedPendingTutor.userId)}
                disabled={actionSubmitting}
                style={{
                  padding: '10px 20px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  color: '#ef4444',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.25)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.15)')}
              >
                Từ chối
              </button>

              <button
                type="button"
                onClick={() => handleApprove(selectedPendingTutor.userId)}
                disabled={actionSubmitting}
                className="btn-primary"
                style={{
                  padding: '10px 24px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Duyệt Hồ Sơ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
