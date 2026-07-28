import React, { useState, useEffect } from 'react';
import { TutorSearchResult } from '../types/tutor';
import { bookingService } from '../services/bookingService';
import { availabilityService, AvailabilityDto } from '../services/availabilityService';
import { creditService } from '../services/creditService';

interface BookingModalProps {
  tutor: TutorSearchResult | null;
  isOpen: boolean;
  onClose: () => void;
  onBookingSuccess: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({ tutor, isOpen, onClose, onBookingSuccess }) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [bookingDate, setBookingDate] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('10:00');
  const [notes, setNotes] = useState<string>('');

  const [availabilities, setAvailabilities] = useState<AvailabilityDto[]>([]);
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [bookingState, setBookingState] = useState<'idle' | 'booking' | 'success'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && tutor) {
      setSelectedSubjectId(tutor.subjects[0]?.subjectId || '');
      setBookingDate('');
      setStartTime('09:00');
      setEndTime('10:00');
      setNotes('');
      setErrorMsg(null);
      setBookingState('idle');

      // Fetch availability
      availabilityService.getAvailabilities(tutor.tutorId)
        .then(data => setAvailabilities(data || []))
        .catch(err => console.error('Failed to load availabilities', err));

      // Fetch student balance
      creditService.getBalance()
        .then(data => setBalance(data.creditBalance))
        .catch(err => console.error('Failed to load balance', err));
    }
  }, [isOpen, tutor]);

  if (!isOpen || !tutor) return null;

  const selectedSubject = tutor.subjects.find(s => s.subjectId === selectedSubjectId);
  const hourlyRate = selectedSubject?.hourlyCredits || 0;

  // Calculate estimated cost
  const getDurationHours = (): number => {
    if (!startTime || !endTime) return 0;
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    const diffMinutes = (eh * 60 + em) - (sh * 60 + sm);
    return Math.max(0, diffMinutes / 60);
  };

  const duration = getDurationHours();
  const estimatedCost = duration * hourlyRate;

  // Check if student selected date is inside tutor's availability slots
  const checkTimeInAvailability = (): { isValid: boolean; reason?: string } => {
    if (!bookingDate) return { isValid: false, reason: 'Vui lòng chọn ngày học.' };
    if (duration <= 0) return { isValid: false, reason: 'Giờ kết thúc phải sau giờ bắt đầu.' };

    const selectedDate = new Date(bookingDate);
    const dayOfWeek = selectedDate.getDay(); // 0 = Sunday, 1 = Monday, etc.

    const reqTimeStart = startTime + ':00';
    const reqTimeEnd = endTime + ':00';

    let foundMatch = false;

    for (const av of availabilities) {
      if (av.isRecurring && av.dayOfWeek !== null && av.dayOfWeek === dayOfWeek) {
        if (reqTimeStart >= av.startTime && reqTimeEnd <= av.endTime) {
          foundMatch = true;
          break;
        }
      } else if (!av.isRecurring && av.specificDate) {
        const specDate = new Date(av.specificDate).toISOString().split('T')[0];
        if (specDate === bookingDate) {
          if (reqTimeStart >= av.startTime && reqTimeEnd <= av.endTime) {
            foundMatch = true;
            break;
          }
        }
      }
    }

    if (!foundMatch) {
      return { isValid: false, reason: 'Gia sư không có lịch rảnh trong khung giờ này.' };
    }

    if (balance !== null && balance < estimatedCost) {
      return { isValid: false, reason: 'Số dư tín dụng của bạn không đủ.' };
    }

    return { isValid: true };
  };

  const { isValid, reason } = checkTimeInAvailability();

  const handleBooking = async () => {
    if (!isValid) return;
    try {
      setBookingState('booking');
      setErrorMsg(null);

      // Create DateTime strings for scheduled times
      const startDateTime = `${bookingDate}T${startTime}:00.000Z`;
      const endDateTime = `${bookingDate}T${endTime}:00.000Z`;

      await bookingService.createBooking({
        tutorId: tutor.tutorId,
        subjectId: selectedSubjectId,
        scheduledStartAt: startDateTime,
        scheduledEndAt: endDateTime,
        notes: notes || undefined
      });

      setBookingState('success');
      setTimeout(() => {
        onBookingSuccess();
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Có lỗi xảy ra khi đặt lịch học. Vui lòng thử lại.');
      setBookingState('idle');
    }
  };

  return (
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
        zIndex: 1200,
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '560px',
          maxHeight: '95vh',
          overflowY: 'auto',
          padding: '28px',
          borderRadius: '24px',
          position: 'relative',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          🗓️ Đặt Lịch Học Với {tutor.fullName}
        </h2>

        {bookingState === 'success' ? (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{ fontSize: '54px', marginBottom: '12px' }}>🎉</div>
            <h3 style={{ color: '#4ade80', fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>Đặt Lịch Thành Công!</h3>
            <p style={{ color: '#94a3b8', fontSize: '14px' }}>Hệ thống đã khấu trừ tín dụng tạm giữ và gửi yêu cầu tới Gia sư.</p>
          </div>
        ) : (
          <div>
            {/* Subject Dropdown */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', fontWeight: 600, marginBottom: '6px' }}>Môn học giảng dạy:</label>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  backgroundColor: '#0f172a',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff',
                  fontSize: '14px',
                  outline: 'none',
                }}
              >
                {tutor.subjects.map((sub) => (
                  <option key={sub.subjectId} value={sub.subjectId}>
                    {sub.subjectName} ({sub.hourlyCredits} tín chỉ/giờ)
                  </option>
                ))}
              </select>
            </div>

            {/* Date input */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', fontWeight: 600, marginBottom: '6px' }}>Chọn Ngày:</label>
              <input
                type="date"
                value={bookingDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setBookingDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  backgroundColor: '#0f172a',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>

            {/* Time slot picker inputs */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', fontWeight: 600, marginBottom: '6px' }}>Từ:</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '10px',
                    backgroundColor: '#0f172a',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', fontWeight: 600, marginBottom: '6px' }}>Đến:</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '10px',
                    backgroundColor: '#0f172a',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            {/* Tutor Availability Info Panel */}
            <div style={{ marginBottom: '16px', backgroundColor: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, marginBottom: '4px' }}>📅 Lịch Rảnh Của Gia Sư:</div>
              {availabilities.length === 0 ? (
                <div style={{ fontSize: '12px', color: '#f87171' }}>Gia sư này chưa đăng ký khung giờ rảnh nào.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '100px', overflowY: 'auto' }}>
                  {availabilities.map((av) => (
                    <div key={av.id} style={{ fontSize: '11px', color: '#cbd5e1' }}>
                      {av.isRecurring ? (
                        <span>• Thứ {av.dayOfWeek === 0 ? 'Chủ Nhật' : av.dayOfWeek === 6 ? 'Bảy' : (av.dayOfWeek! + 1)}: {av.startTime.substring(0, 5)} - {av.endTime.substring(0, 5)} (Lặp lại hàng tuần)</span>
                      ) : (
                        <span>• Ngày {av.specificDate ? new Date(av.specificDate).toLocaleDateString('vi-VN') : ''}: {av.startTime.substring(0, 5)} - {av.endTime.substring(0, 5)}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Notes textarea */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', fontWeight: 600, marginBottom: '6px' }}>Nội dung học (không bắt buộc):</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ví dụ: Cần gia sư hỗ trợ phần giải tích tích phân cơ bản..."
                rows={2}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  backgroundColor: '#0f172a',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff',
                  fontSize: '14px',
                  outline: 'none',
                  resize: 'none',
                }}
              />
            </div>

            {/* Error or validation reason */}
            {!isValid && bookingDate && (
              <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', padding: '12px', borderRadius: '10px', fontSize: '13px', marginBottom: '16px' }}>
                ⚠️ {reason}
              </div>
            )}

            {errorMsg && (
              <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', padding: '12px', borderRadius: '10px', fontSize: '13px', marginBottom: '16px' }}>
                ⚠️ {errorMsg}
              </div>
            )}

            {/* Cost & Balance details */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(56, 189, 248, 0.08)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(56, 189, 248, 0.2)', marginBottom: '24px' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>TỔNG CHI PHÍ TẠM TÍNH:</div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#38bdf8' }}>💎 {estimatedCost.toFixed(1)} tín chỉ</div>
                <div style={{ fontSize: '11px', color: '#cbd5e1' }}>({duration.toFixed(1)} giờ x {hourlyRate} tc)</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>VÍ TÍN DỤNG CỦA BẠN:</div>
                <div style={{ fontSize: '16px', fontWeight: '700', color: balance !== null && balance >= estimatedCost ? '#4ade80' : '#f87171' }}>
                  💎 {balance !== null ? balance.toFixed(1) : '--'}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={onClose}
                disabled={bookingState === 'booking'}
                style={{
                  padding: '12px 20px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  backgroundColor: 'transparent',
                  color: '#94a3b8',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleBooking}
                disabled={!isValid || bookingState === 'booking'}
                className="btn-primary"
                style={{
                  padding: '12px 24px',
                  fontSize: '14px',
                  opacity: (!isValid || bookingState === 'booking') ? 0.5 : 1,
                  cursor: (!isValid || bookingState === 'booking') ? 'not-allowed' : 'pointer',
                }}
              >
                {bookingState === 'booking' ? '⏳ Đang đặt lịch...' : '🗓️ Xác Nhận Đặt Lịch'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
