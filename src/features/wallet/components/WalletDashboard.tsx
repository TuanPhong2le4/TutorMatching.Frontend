import React, { useState, useEffect } from 'react';
import { useAuth } from '../../auth/context/AuthContext';
import { creditService, CreditTransactionDto, AdminDepositRequestDto } from '../services/creditService';
import { WalletDepositModal } from './WalletDepositModal';

interface WalletDashboardProps {
  balance: number | null;
  onBalanceChanged: (newBalance: number) => void;
}

export const WalletDashboard: React.FC<WalletDashboardProps> = ({ balance, onBalanceChanged }) => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<CreditTransactionDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isDepositOpen, setIsDepositOpen] = useState<boolean>(false);

  // Admin specific states
  const [adminRequests, setAdminRequests] = useState<AdminDepositRequestDto[]>([]);
  const [adminPage, setAdminPage] = useState<number>(1);
  const [adminTotalPages, setAdminTotalPages] = useState<number>(1);
  const [adminTotalCount, setAdminTotalCount] = useState<number>(0);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  // Date filter query states
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [dateError, setDateError] = useState<string | null>(null);

  // Applied date filter states for query execution
  const [appliedStartDate, setAppliedStartDate] = useState<string>('');
  const [appliedEndDate, setAppliedEndDate] = useState<string>('');

  const isStudent = Number(user?.role) === 2 || user?.role === 'Student';
  const isTutor = Number(user?.role) === 1 || user?.role === 'Tutor';
  const isAdmin = Number(user?.role) === 0 || user?.role === 'Admin';

  useEffect(() => {
    if (isAdmin) {
      fetchAdminRequests(appliedStartDate, appliedEndDate);
    } else {
      fetchTransactions();
    }
  }, [page, adminPage, isAdmin, appliedStartDate, appliedEndDate]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await creditService.getTransactions(page, 10);
      setTransactions(res.items || []);
      setTotalCount(res.totalCount || 0);
      setTotalPages(Math.ceil((res.totalCount || 0) / 10));
    } catch (err) {
      console.error('Failed to load transaction history:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminRequests = async (start = appliedStartDate, end = appliedEndDate) => {
    try {
      setLoading(true);
      const res = await creditService.getAdminDepositRequests(adminPage, 10, start || undefined, end || undefined);
      setAdminRequests(res.items || []);
      setAdminTotalCount(res.totalCount || 0);
      setAdminTotalPages(Math.ceil((res.totalCount || 0) / 10));
    } catch (err) {
      console.error('Failed to load admin deposit requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDepositSuccess = (newBalance: number) => {
    onBalanceChanged(newBalance);
    setPage(1);
    fetchTransactions();
  };

  const handleApproveRequest = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn PHÊ DUYỆT yêu cầu nạp tiền này?')) return;
    try {
      setProcessingId(id);
      await creditService.approveDepositRequest(id);
      alert('Đã duyệt yêu cầu nạp tiền thành công!');
      fetchAdminRequests();
      // If the admin's balance also changes or we just refresh global balance
      creditService.getBalance().then(data => onBalanceChanged(data.creditBalance)).catch(e => console.error(e));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi phê duyệt.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectRequest = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn TỪ CHỐI yêu cầu nạp tiền này?')) return;
    try {
      setProcessingId(id);
      await creditService.rejectDepositRequest(id);
      alert('Đã từ chối yêu cầu nạp tiền.');
      fetchAdminRequests();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi từ chối.');
    } finally {
      setProcessingId(null);
    }
  };

  // Convert transaction type to readable text & styled badge properties
  const getTransactionBadgeProps = (type: string | number) => {
    const typeStr = type.toString().toLowerCase();

    // Enum mapping: Credit=0, Debit=1, Transfer=2, Refund=3
    if (typeStr === '0' || typeStr === 'credit') {
      return {
        text: '➕ Nạp Tiền',
        style: { color: '#34d399', backgroundColor: 'rgba(52, 211, 153, 0.15)' },
        prefix: '+'
      };
    }
    if (typeStr === '1' || typeStr === 'debit') {
      return {
        text: '➖ Tạm Giữ',
        style: { color: '#f87171', backgroundColor: 'rgba(248, 113, 113, 0.15)' },
        prefix: '-'
      };
    }
    if (typeStr === '2' || typeStr === 'transfer') {
      return {
        text: '💸 Thanh Toán',
        style: { color: '#fbbf24', backgroundColor: 'rgba(251, 191, 36, 0.15)' },
        prefix: '-'
      };
    }
    if (typeStr === '3' || typeStr === 'refund') {
      return {
        text: '🔄 Hoàn Tiền',
        style: { color: '#38bdf8', backgroundColor: 'rgba(56, 189, 248, 0.15)' },
        prefix: '+'
      };
    }

    // Fallback default
    return {
      text: 'Giao Dịch',
      style: { color: '#94a3b8', backgroundColor: 'rgba(148, 163, 184, 0.15)' },
      prefix: ''
    };
  };

  // Helper to format ISO date to Vietnam Timezone (Asia/Ho_Chi_Minh GMT+7) in real time
  const formatVietnamDateTime = (dateString: string) => {
    if (!dateString) return '';
    const utcString = dateString.includes('Z') || dateString.includes('+') ? dateString : `${dateString}Z`;
    const date = new Date(utcString);
    return date.toLocaleString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour12: false,
    });
  };

  // Helper to auto-translate legacy/English transaction descriptions to pure Vietnamese
  const translateTxDescription = (desc: string) => {
    if (!desc) return '';
    if (desc === 'Refund for cancelled booking' || desc.startsWith('Refund for cancelled booking')) {
      return 'Hoàn lại tín chỉ do lịch học bị hủy';
    }
    if (desc.startsWith('Booking holding for')) {
      const rawDateStr = desc.replace('Booking holding for', '').trim();
      const parsedDate = new Date(rawDateStr);
      if (!isNaN(parsedDate.getTime())) {
        const formattedTime = parsedDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
        const formattedDay = parsedDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
        return `Tạm giữ tín chỉ cho buổi học ngày ${formattedDay} lúc ${formattedTime}`;
      }
      return `Tạm giữ tín chỉ cho buổi học (${rawDateStr})`;
    }
    return desc;
  };

  if (isAdmin) {
    return (
      <div>
        {/* Admin Dashboard header */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '4px' }}>
            🏦 Lịch Sử Giao Dịch Nạp Tiền
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '15px' }}>
            Theo dõi danh sách lịch sử các giao dịch nạp tiền tự động qua bên thứ 3 trong hệ thống.
          </p>
        </div>

        {/* Truy vấn giao dịch panel */}
        <div className="glass-panel" style={{ padding: '28px', borderRadius: '20px', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '20px', color: '#fff' }}>
            Truy vấn giao dịch
          </h3>

          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'stretch' }}>
            {/* Từ ngày card */}
            <div style={{
              flex: 1,
              minWidth: '240px',
              backgroundColor: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Từ ngày</span>
                <input
                  type="date"
                  value={startDate}
                  max={endDate || undefined}
                  onChange={(e) => {
                    const newStart = e.target.value;
                    setStartDate(newStart);
                    if (newStart) setDateError(null);
                    if (endDate && newStart && endDate < newStart) {
                      setEndDate(newStart);
                    }
                  }}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#fff',
                    fontSize: '15px',
                    fontWeight: 700,
                    outline: 'none',
                    width: '100%',
                    cursor: 'pointer',
                    colorScheme: 'dark'
                  }}
                />
              </div>
            </div>

            {/* Đến ngày card */}
            <div style={{
              flex: 1,
              minWidth: '240px',
              backgroundColor: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Đến ngày</span>
                <input
                  type="date"
                  value={endDate}
                  min={startDate || undefined}
                  onChange={(e) => {
                    const newEnd = e.target.value;
                    if (startDate && newEnd && newEnd < startDate) {
                      setEndDate(startDate);
                    } else {
                      setEndDate(newEnd);
                    }
                    if (newEnd) setDateError(null);
                  }}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#fff',
                    fontSize: '15px',
                    fontWeight: 700,
                    outline: 'none',
                    width: '100%',
                    cursor: 'pointer',
                    colorScheme: 'dark'
                  }}
                />
              </div>
            </div>
          </div>

          {dateError && (
            <div
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                color: '#f87171',
                padding: '12px 16px',
                borderRadius: '12px',
                marginTop: '16px',
                fontSize: '14px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{dateError}</span>
            </div>
          )}

          <button
            onClick={() => {
              if (!startDate && !endDate) {
                setDateError('Vui lòng chọn ngày bắt đầu và ngày kết thúc');
                return;
              }
              if (!startDate) {
                setDateError('Vui lòng chọn ngày bắt đầu');
                return;
              }
              if (!endDate) {
                setDateError('Vui lòng chọn ngày kết thúc');
                return;
              }

              setDateError(null);
              let validStart = startDate;
              let validEnd = endDate;
              if (validStart && validEnd && validEnd < validStart) {
                validEnd = validStart;
                setEndDate(validStart);
              }
              setAppliedStartDate(validStart);
              setAppliedEndDate(validEnd);
              setAdminPage(1);
            }}
            style={{
              width: '100%',
              backgroundColor: '#1d4ed8',
              color: '#fff',
              border: 'none',
              borderRadius: '14px',
              padding: '14px',
              fontSize: '16px',
              fontWeight: 700,
              cursor: 'pointer',
              marginTop: '20px',
              transition: 'all 0.2s',
              boxShadow: '0 4px 14px rgba(29, 78, 216, 0.3)',
              textAlign: 'center'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#1e40af';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#1d4ed8';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Truy vấn
          </button>

          <p style={{ margin: '14px 0 0 0', fontSize: '13px', color: '#64748b', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
            ℹ️ Hệ thống hỗ trợ truy vấn lịch sử giao dịch trong vòng 1 năm kể từ ngày hiện tại
          </p>
        </div>

        {/* Requests Table */}
        <div className="glass-panel" style={{ padding: '28px', borderRadius: '20px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '20px', color: '#fff' }}>
            📋 Danh Sách Giao Dịch Nạp Tiền ({adminTotalCount})
          </h3>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>Đang tải yêu cầu nạp tiền...</div>
          ) : adminRequests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>🏦</div>
              <h4 style={{ color: '#fff', fontSize: '16px', marginBottom: '6px' }}>Không Có Yêu Cầu Nào</h4>
              <p style={{ fontSize: '13px', maxWidth: '360px', margin: '0 auto' }}>
                Hiện tại không có yêu cầu nạp tiền nào cần được phê duyệt.
              </p>
            </div>
          ) : (
            <div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      <th style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '13px', fontWeight: 600 }}>TÀI KHOẢN YÊU CẦU</th>
                      <th style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '13px', fontWeight: 600 }}>VAI TRÒ</th>
                      <th style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '13px', fontWeight: 600 }}>SỐ TIỀN YÊU CẦU</th>
                      <th style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '13px', fontWeight: 600 }}>NGÀY GỬI</th>
                      <th style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '13px', fontWeight: 600 }}>TRẠNG THÁI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminRequests.map((r) => {
                      const formattedDate = formatVietnamDateTime(r.createdAt);

                      // Status style
                      let statusText = 'Đang xử lý (VNPAY)';
                      let statusStyle = { color: '#fbbf24', backgroundColor: 'rgba(251, 191, 36, 0.15)' };
                      if (r.status === 1) {
                        statusText = 'Thành công (Tự động)';
                        statusStyle = { color: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.15)' };
                      } else if (r.status === 2) {
                        statusText = 'Thất bại/Đã hủy';
                        statusStyle = { color: '#f87171', backgroundColor: 'rgba(248, 113, 113, 0.15)' };
                      }

                      return (
                        <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '14px' }}>
                          <td style={{ padding: '16px' }}>
                            <div style={{ fontWeight: 600, color: '#fff' }}>{r.requesterName}</div>
                            <div style={{ fontSize: '12px', color: '#94a3b8' }}>{r.requesterEmail}</div>
                          </td>
                          <td style={{ padding: '16px' }}>
                            <span style={{ fontSize: '13px', color: r.requesterRole === 'Student' ? '#38bdf8' : '#a855f7' }}>
                              {r.requesterRole === 'Student' ? '🎓 Học Viên' : '👨‍🏫 Gia Sư'}
                            </span>
                          </td>
                          <td style={{ padding: '16px', fontWeight: 700, color: '#38bdf8', fontSize: '15px' }}>
                            💎 {r.amount.toFixed(1)} tc
                          </td>
                          <td style={{ padding: '16px', color: '#cbd5e1' }}>{formattedDate}</td>
                          <td style={{ padding: '16px' }}>
                            <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600, ...statusStyle }}>
                              {statusText}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Admin Pagination */}
              {adminTotalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px' }}>
                  <button
                    disabled={adminPage === 1}
                    onClick={() => setAdminPage(prev => Math.max(prev - 1, 1))}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: '1px solid rgba(255,255,255,0.15)',
                      backgroundColor: 'rgba(15,23,42,0.6)',
                      color: adminPage === 1 ? '#64748b' : '#fff',
                      cursor: adminPage === 1 ? 'not-allowed' : 'pointer',
                      fontSize: '13px',
                    }}
                  >
                    Trước
                  </button>
                  <span style={{ display: 'flex', alignItems: 'center', padding: '0 8px', fontSize: '13px', color: '#94a3b8' }}>
                    Trang {adminPage} / {adminTotalPages}
                  </span>
                  <button
                    disabled={adminPage === adminTotalPages}
                    onClick={() => setAdminPage(prev => Math.min(prev + 1, adminTotalPages))}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: '1px solid rgba(255,255,255,0.15)',
                      backgroundColor: 'rgba(15,23,42,0.6)',
                      color: adminPage === adminTotalPages ? '#64748b' : '#fff',
                      cursor: adminPage === adminTotalPages ? 'not-allowed' : 'pointer',
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
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        {/* Wallet Balance Banner card */}
        <div
          className="glass-panel"
          style={{
            padding: '28px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(59, 130, 246, 0.15) 100%)',
            border: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 10px 30px -10px rgba(0,0,0,0.3)',
          }}
        >
          <div>
            <span style={{ fontSize: '14px', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
              💎 SỐ DƯ VÍ TÍN DỤNG
            </span>
            <span style={{ fontSize: '36px', fontWeight: '800', color: '#fff', letterSpacing: '-0.5px' }}>
              {balance !== null ? balance.toFixed(1) : '...'}
              <span style={{ fontSize: '18px', color: '#a855f7', marginLeft: '6px', fontWeight: '600' }}>tín chỉ</span>
            </span>
            <span style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginTop: '12px' }}>
              Tài khoản: <strong>{user?.fullName}</strong> ({isStudent ? 'Học Viên' : isTutor ? 'Gia Sư' : 'Admin'})
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px' }}>
            <div style={{ fontSize: '48px', opacity: 0.9 }}>💎</div>
            {(isStudent || isTutor) && (
              <button
                onClick={() => setIsDepositOpen(true)}
                className="btn-primary"
                style={{
                  padding: '10px 20px',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
                title="Gửi yêu cầu nạp tiền tới Admin"
              >
                💳 Gửi Yêu Cầu Nạp
              </button>
            )}
          </div>
        </div>

        {/* Informational help card */}
        <div
          className="glass-panel"
          style={{
            padding: '24px',
            borderRadius: '20px',
            border: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <h4 style={{ fontSize: '15px', color: '#fff', fontWeight: 700, marginBottom: '8px' }}>
            {isStudent ? '💡 Quy trình giao dịch tín dụng:' : '🎓 Nhận tín dụng giảng dạy:'}
          </h4>
          <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.6', margin: 0 }}>
            {isStudent ? (
              'Khi bạn đặt lịch học với gia sư, hệ thống sẽ tự động tạm giữ (Debit) số tín chỉ tương ứng. Khi buổi học được Gia sư xác nhận hoàn thành, số tín chỉ này sẽ chuyển thẳng tới tài khoản của Gia sư. Nếu lịch học bị hủy, số tín chỉ tạm giữ sẽ được hoàn lại (Refund) ví của bạn.'
            ) : (
              'Số tín chỉ của các buổi dạy học sẽ tự động được cộng vào ví của bạn (Transfer) ngay sau khi buổi học được xác nhận hoàn thành. Tín chỉ tích lũy có thể dùng để quy đổi hoặc giao dịch trong hệ thống.'
            )}
          </p>
        </div>
      </div>

      {/* Transaction History Log Section */}
      <div className="glass-panel" style={{ padding: '28px', borderRadius: '20px' }}>
        <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '20px', color: '#fff' }}>
          📜 Lịch Sử Giao Dịch
        </h3>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>Đang tải lịch sử giao dịch...</div>
        ) : transactions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>💸</div>
            <h4 style={{ color: '#fff', fontSize: '16px', marginBottom: '6px' }}>Chưa Có Giao Dịch Nào</h4>
            <p style={{ fontSize: '13px', maxWidth: '360px', margin: '0 auto' }}>
              Mọi lịch sử nạp tiền, hoàn tiền hoặc thanh toán khóa học sẽ hiển thị ở đây.
            </p>
          </div>
        ) : (
          <div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <th style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '13px', fontWeight: 600 }}>LOẠI GIAO DỊCH</th>
                    <th style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '13px', fontWeight: 600 }}>SỐ LƯỢNG</th>
                    <th style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '13px', fontWeight: 600 }}>NỘI DUNG CHI TIẾT</th>
                    <th style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '13px', fontWeight: 600 }}>SỐ DƯ SAU GIAO DỊCH</th>
                    <th style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '13px', fontWeight: 600 }}>THỜI GIAN</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => {
                    const badge = getTransactionBadgeProps(tx.type);
                    const formattedDate = formatVietnamDateTime(tx.createdAt);

                    return (
                      <tr key={tx.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '14px' }}>
                        <td style={{ padding: '16px' }}>
                          <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600, ...badge.style }}>
                            {badge.text}
                          </span>
                        </td>
                        <td style={{ padding: '16px', fontWeight: 700, color: badge.prefix === '+' ? '#34d399' : '#f87171' }}>
                          {badge.prefix} {tx.amount.toFixed(1)} tc
                        </td>
                        <td style={{ padding: '16px', color: '#cbd5e1' }}>{translateTxDescription(tx.description)}</td>
                        <td style={{ padding: '16px', fontWeight: 600, color: '#fff' }}>💎 {tx.balanceAfter.toFixed(1)} tc</td>
                        <td style={{ padding: '16px', color: '#94a3b8', fontSize: '12px' }}>{formattedDate}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px' }}>
                <button
                  disabled={page === 1}
                  onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid rgba(255,255,255,0.15)',
                    backgroundColor: 'rgba(15,23,42,0.6)',
                    color: page === 1 ? '#64748b' : '#fff',
                    cursor: page === 1 ? 'not-allowed' : 'pointer',
                    fontSize: '13px',
                  }}
                >
                  Trước
                </button>
                <span style={{ display: 'flex', alignItems: 'center', padding: '0 8px', fontSize: '13px', color: '#94a3b8' }}>
                  Trang {page} / {totalPages}
                </span>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid rgba(255,255,255,0.15)',
                    backgroundColor: 'rgba(15,23,42,0.6)',
                    color: page === totalPages ? '#64748b' : '#fff',
                    cursor: page === totalPages ? 'not-allowed' : 'pointer',
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

      {/* Deposit Modal */}
      <WalletDepositModal
        isOpen={isDepositOpen}
        onClose={() => setIsDepositOpen(false)}
        onDepositSuccess={handleDepositSuccess}
      />
    </div>
  );
};
