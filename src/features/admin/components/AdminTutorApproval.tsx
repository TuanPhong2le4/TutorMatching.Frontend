import React, { useState, useEffect } from 'react';
import { adminUserService, PendingTutorDto } from '../services/adminUserService';
import { availabilityService, AvailabilityDto } from '../../tutors/services/availabilityService';

const REJECT_REASON_MAX = 1000;

export const AdminTutorApproval: React.FC = () => {
  const [tutors, setTutors] = useState<PendingTutorDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTutor, setSelectedTutor] = useState<PendingTutorDto | null>(null);
  const [availabilities, setAvailabilities] = useState<AvailabilityDto[]>([]);
  const [availLoading, setAvailLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Rejection reason modal state
  const [rejectModalOpen, setRejectModalOpen] = useState<boolean>(false);
  const [rejectTutorId, setRejectTutorId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [rejectErrorMsg, setRejectErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    loadPendingTutors();
  }, []);

  const loadPendingTutors = async () => {
    try {
      setLoading(true);
      const res = await adminUserService.getPendingTutors(1, 100);
      setTutors(res.items || []);
    } catch {
      setTutors([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTutor = async (tutor: PendingTutorDto) => {
    setSelectedTutor(tutor);
    try {
      setAvailLoading(true);
      const list = await availabilityService.getAvailabilities(tutor.userId);
      setAvailabilities(list || []);
    } catch {
      setAvailabilities([]);
    } finally {
      setAvailLoading(false);
    }
  };

  const handleApprove = async (tutorId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn DUYỆT hồ sơ gia sư này? Gia sư sẽ được phép nhận học viên ngay lập tức.')) return;
    try {
      setSubmitting(true);
      await adminUserService.approveTutor(tutorId);
      alert('Đã duyệt hồ sơ gia sư thành công.');
      setSelectedTutor(null);
      loadPendingTutors();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi duyệt hồ sơ.');
    } finally {
      setSubmitting(false);
    }
  };

  const openRejectModal = (tutorId: string) => {
    setRejectTutorId(tutorId);
    setRejectReason('');
    setRejectErrorMsg(null);
    setRejectModalOpen(true);
  };

  const closeRejectModal = () => {
    setRejectModalOpen(false);
    setRejectTutorId(null);
    setRejectReason('');
    setRejectErrorMsg(null);
  };

  const handleRejectSubmit = async () => {
    if (!rejectTutorId) return;
    if (!rejectReason.trim()) {
      setRejectErrorMsg('Vui lòng nhập lý do từ chối hồ sơ.');
      return;
    }
    try {
      setSubmitting(true);
      setRejectErrorMsg(null);
      await adminUserService.rejectTutor(rejectTutorId, rejectReason.trim());
      alert('Đã từ chối hồ sơ gia sư này.');
      closeRejectModal();
      setSelectedTutor(null);
      loadPendingTutors();
    } catch (err: any) {
      setRejectErrorMsg(err.response?.data?.message || 'Có lỗi xảy ra khi từ chối hồ sơ.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectReasonKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (rejectReason.length >= REJECT_REASON_MAX) {
      const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'Tab'];
      if (!allowedKeys.includes(e.key) && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
      }
    }
  };

  const handleRejectReasonPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedText = e.clipboardData.getData('text');
    if (rejectReason.length + pastedText.length > REJECT_REASON_MAX) {
      e.preventDefault();
      const remaining = REJECT_REASON_MAX - rejectReason.length;
      if (remaining > 0) {
        const textarea = e.currentTarget;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newVal = rejectReason.substring(0, start) + pastedText.substring(0, remaining) + rejectReason.substring(end);
        setRejectReason(newVal.substring(0, REJECT_REASON_MAX));
      }
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getDayOfWeekLabel = (day?: number | null) => {
    if (day === null || day === undefined) return '';
    const labels = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    return labels[day] || '';
  };

  return (
    <div style={{ color: '#fff', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header Banner */}
      <div>
        <h2 style={{ fontSize: '28px', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          📝 Duyệt Đơn Đăng Ký Gia Sư
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '15px', margin: '4px 0 0' }}>
          Xem xét thông tin cá nhân, bằng cấp và lịch rảnh để phê duyệt tư cách giảng dạy của gia sư mới
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8', fontSize: '16px' }}>
          ⏳ Đang tải danh sách đơn đăng ký chờ duyệt...
        </div>
      ) : tutors.length === 0 ? (
        <div
          className="glass-panel"
          style={{
            padding: '48px',
            borderRadius: '20px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px'
          }}
        >
          <div style={{ fontSize: '48px' }}>🎉</div>
          <h3 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Hộp thư trống!</h3>
          <p style={{ color: '#94a3b8', fontSize: '14px', maxWidth: '400px', margin: 0 }}>
            Hiện tại không có gia sư nào đang chờ duyệt hồ sơ. Tất cả các đơn đăng ký đã được giải quyết.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '24px' }}>
          {tutors.map((t) => (
            <div
              key={t.userId}
              className="glass-panel"
              style={{
                padding: '24px',
                borderRadius: '20px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '16px',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: '#fff' }}>{t.fullName}</h3>
                  <span style={{ fontSize: '11px', color: '#fbbf24', backgroundColor: 'rgba(251, 191, 36, 0.12)', padding: '2px 8px', borderRadius: '8px', fontWeight: 600 }}>Chờ duyệt</span>
                </div>
                <div style={{ fontSize: '13px', color: '#cbd5e1' }}>
                  ✉️ {t.email}
                </div>
                <div style={{ fontSize: '13px', color: '#cbd5e1' }}>
                  📞 {t.phone || 'Chưa cung cấp SĐT'}
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                  📅 Ngày đăng ký: {formatDate(t.createdAt)}
                </div>
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px', marginTop: '4px' }}>
                  <strong style={{ fontSize: '13px', color: '#38bdf8', display: 'block', marginBottom: '4px' }}>🎓 Bằng cấp / Trình độ:</strong>
                  <p style={{ fontSize: '13px', color: '#cbd5e1', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.4' }}>
                    {t.qualifications || 'Chưa cung cấp'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleSelectTutor(t)}
                className="btn-primary"
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, #38bdf8, #2563eb)'
                }}
              >
                🔎 Xem Chi Tiết & Xét Duyệt
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Review & Detail Modal */}
      {selectedTutor && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
        >
          <div
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '640px',
              borderRadius: '24px',
              padding: '32px',
              border: '1px solid rgba(255,255,255,0.15)',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '22px', fontWeight: '800', margin: 0, color: '#fff' }}>🔎 Hồ sơ chi tiết gia sư</h3>
                <span style={{ fontSize: '13px', color: '#94a3b8' }}>Xem xét hồ sơ của <strong>{selectedTutor.fullName}</strong></span>
              </div>
              <button
                onClick={() => {
                  setSelectedTutor(null);
                  setAvailabilities([]);
                }}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: 'none',
                  color: '#fff',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: '18px',
                  display: 'grid',
                  placeItems: 'center'
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <strong style={{ display: 'block', fontSize: '14px', color: '#38bdf8', marginBottom: '6px' }}>✉️ Thông tin liên hệ:</strong>
                <p style={{ margin: 0, color: '#cbd5e1', fontSize: '14px' }}>
                  Họ và tên: <strong>{selectedTutor.fullName}</strong><br />
                  Địa chỉ Email: <strong>{selectedTutor.email}</strong><br />
                  Số điện thoại: <strong>{selectedTutor.phone || 'Chưa cung cấp'}</strong><br />
                  Ngày đăng ký: <strong>{formatDate(selectedTutor.createdAt)}</strong>
                </p>
              </div>

              <div>
                <strong style={{ display: 'block', fontSize: '14px', color: '#38bdf8', marginBottom: '6px' }}>🎓 Bằng cấp & Trình độ chuyên môn:</strong>
                <div style={{ padding: '14px 18px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', color: '#cbd5e1', fontSize: '14px', lineHeight: '1.5' }}>
                  {selectedTutor.qualifications}
                </div>
              </div>

              <div>
                <strong style={{ display: 'block', fontSize: '14px', color: '#38bdf8', marginBottom: '6px' }}>📝 Giới thiệu bản thân (Bio):</strong>
                <div style={{ padding: '14px 18px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', color: '#cbd5e1', fontSize: '14px', lineHeight: '1.5', whiteSpace: 'pre-line' }}>
                  {selectedTutor.bio}
                </div>
              </div>

              <div>
                <strong style={{ display: 'block', fontSize: '14px', color: '#a855f7', marginBottom: '6px' }}>🗓️ Lịch rảnh đã thiết lập:</strong>
                {availLoading ? (
                  <span style={{ fontSize: '13px', color: '#94a3b8' }}>⏳ Đang tải thông tin lịch rảnh...</span>
                ) : availabilities.length === 0 ? (
                  <span style={{ fontSize: '13px', color: '#f87171' }}>⚠️ Chưa thiết lập lịch rảnh</span>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {availabilities.map((av) => (
                      <div
                        key={av.id}
                        style={{
                          padding: '10px 14px',
                          borderRadius: '10px',
                          backgroundColor: 'rgba(168, 85, 247, 0.08)',
                          border: '1px solid rgba(168, 85, 247, 0.2)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '13px'
                        }}
                      >
                        <span>
                          {av.isRecurring ? '🔄 Lặp lại hàng tuần' : '📅 Một lần'}
                        </span>
                        <strong style={{ color: '#fff' }}>
                          {av.isRecurring
                            ? `${getDayOfWeekLabel(av.dayOfWeek)}`
                            : `${av.specificDate ? formatDate(av.specificDate) : ''}`}
                          {` : ${av.startTime.substring(0, 5)} - ${av.endTime.substring(0, 5)}`}
                        </strong>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '14px', marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '20px' }}>
              <button
                disabled={submitting}
                onClick={() => openRejectModal(selectedTutor.userId)}
                style={{
                  flex: 1,
                  padding: '14px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid #ef4444',
                  color: '#f87171',
                  fontWeight: 700,
                  fontSize: '14px',
                  cursor: submitting ? 'not-allowed' : 'pointer'
                }}
              >
                ❌ Từ chối hồ sơ
              </button>

              <button
                disabled={submitting}
                onClick={() => handleApprove(selectedTutor.userId)}
                style={{
                  flex: 1,
                  padding: '14px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  border: 'none',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '14px',
                  cursor: submitting ? 'not-allowed' : 'pointer'
                }}
              >
                ✅ Duyệt hồ sơ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Reason Modal */}
      {rejectModalOpen && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) closeRejectModal(); }}
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
            zIndex: 10000,
            padding: '20px'
          }}
        >
          <div
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '520px',
              borderRadius: '24px',
              padding: '32px',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              boxShadow: '0 25px 50px -12px rgba(239, 68, 68, 0.15)'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: '#f87171' }}>❌ Từ Chối Hồ Sơ Gia Sư</h3>
                <span style={{ fontSize: '13px', color: '#94a3b8' }}>Vui lòng nhập lý do từ chối</span>
              </div>
              <button
                onClick={closeRejectModal}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: 'none',
                  color: '#fff',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: '16px',
                  display: 'grid',
                  placeItems: 'center'
                }}
              >
                ✕
              </button>
            </div>

            {/* Reason Textarea */}
            <div>
              <label style={{ display: 'block', fontSize: '14px', color: '#cbd5e1', marginBottom: '8px', fontWeight: 600 }}>
                Lý do từ chối <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val.length <= REJECT_REASON_MAX) {
                    setRejectReason(val);
                    setRejectErrorMsg(null);
                  }
                }}
                onKeyDown={handleRejectReasonKeyDown}
                onPaste={handleRejectReasonPaste}
                placeholder="Nhập lý do từ chối hồ sơ gia sư..."
                rows={5}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  border: rejectReason.length >= REJECT_REASON_MAX
                    ? '1px solid #ef4444'
                    : '1px solid rgba(255,255,255,0.1)',
                  color: '#fff',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  resize: 'vertical',
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                  transition: 'border-color 0.2s ease',
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                {rejectReason.length >= REJECT_REASON_MAX ? (
                  <span style={{ fontSize: '12px', color: '#ef4444', fontWeight: 600 }}>
                    ⚠️ Đã đạt giới hạn ký tự cho phép
                  </span>
                ) : (
                  <span />
                )}
                <span style={{
                  fontSize: '12px',
                  color: rejectReason.length >= REJECT_REASON_MAX ? '#ef4444' : '#64748b',
                  fontWeight: 500,
                }}>
                  {rejectReason.length}/{REJECT_REASON_MAX}
                </span>
              </div>
            </div>

            {/* Error message */}
            {rejectErrorMsg && (
              <div style={{
                padding: '10px 14px',
                borderRadius: '10px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#f87171',
                fontSize: '13px',
                fontWeight: 500,
              }}>
                ⚠️ {rejectErrorMsg}
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={closeRejectModal}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#94a3b8',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleRejectSubmit}
                disabled={submitting || !rejectReason.trim()}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '12px',
                  backgroundColor: submitting || !rejectReason.trim() ? 'rgba(239, 68, 68, 0.08)' : 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid #ef4444',
                  color: submitting || !rejectReason.trim() ? '#94a3b8' : '#f87171',
                  fontWeight: 700,
                  fontSize: '14px',
                  cursor: submitting || !rejectReason.trim() ? 'not-allowed' : 'pointer',
                }}
              >
                {submitting ? '⏳ Đang xử lý...' : '❌ Xác nhận từ chối'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
