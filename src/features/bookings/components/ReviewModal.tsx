import React, { useState } from 'react';
import { reviewService } from '../../reviews/services/reviewService';
import { useAuth } from '../../auth/context/AuthContext';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  tutorName?: string;
  subjectName?: string;
  onReviewSuccess: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  bookingId,
  tutorName,
  subjectName,
  onReviewSuccess,
}) => {
  const { user } = useAuth();
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const isTutor = Number(user?.role) === 1 || user?.role === 'Tutor';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await reviewService.createReview(bookingId, rating, comment);
      alert('Gửi đánh giá thành công! Cảm ơn ý kiến đóng góp của bạn.');
      onReviewSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.messages?.[0] || err.response?.data?.message || err.response?.data?.title || 'Có lỗi xảy ra khi gửi đánh giá.';
      setError(msg);
    } finally {
      setSubmitting(false);
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
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1500,
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '460px',
          padding: '32px',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 20px 50px -15px rgba(0, 0, 0, 0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: '800', margin: 0 }} className="gradient-text">
            {isTutor ? '✍️ Đánh Giá Học Viên' : '✍️ Đánh Giá Gia Sư'}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              fontSize: '20px',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        {tutorName && (
          <div style={{ marginBottom: '20px', backgroundColor: 'rgba(255,255,255,0.03)', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ fontSize: '13px', color: '#94a3b8', display: 'block' }}>
              {isTutor ? 'Đánh giá Học viên:' : 'Buổi học với Gia sư:'}
            </span>
            <strong style={{ fontSize: '15px', color: '#fff' }}>{tutorName}</strong>
            {subjectName && (
              <span style={{ fontSize: '13px', color: '#38bdf8', marginLeft: '8px' }}>
                ({subjectName})
              </span>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{ marginBottom: '16px', color: '#f87171', fontSize: '13px', fontWeight: 600 }}>
              ⚠️ {error}
            </div>
          )}

          {/* Star selector */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '14px', color: '#94a3b8', marginBottom: '12px', fontWeight: 600 }}>
              {isTutor ? 'Chọn mức độ đánh giá học viên:' : 'Chọn mức độ hài lòng của bạn:'}
            </label>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
              {[1, 2, 3, 4, 5].map((star) => {
                const filled = hoveredRating !== null ? star <= hoveredRating : star <= rating;
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(null)}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '36px',
                      cursor: 'pointer',
                      transition: 'transform 0.1s',
                      transform: hoveredRating === star ? 'scale(1.2)' : 'none',
                      outline: 'none',
                    }}
                  >
                    {filled ? '⭐' : '☆'}
                  </button>
                );
              })}
            </div>
            <span style={{ display: 'block', fontSize: '13px', color: '#38bdf8', marginTop: '8px', fontWeight: 600 }}>
              {isTutor ? (
                <>
                  {rating === 1 && '😞 Rất kém'}
                  {rating === 2 && '🙁 Kém'}
                  {rating === 3 && '😐 Trung bình'}
                  {rating === 4 && '🙂 Khá'}
                  {rating === 5 && '😍 Xuất sắc'}
                </>
              ) : (
                <>
                  {rating === 1 && '😞 Rất không hài lòng'}
                  {rating === 2 && '🙁 Không hài lòng'}
                  {rating === 3 && '😐 Bình thường'}
                  {rating === 4 && '🙂 Hài lòng'}
                  {rating === 5 && '😍 Rất hài lòng'}
                </>
              )}
            </span>
          </div>

          {/* Comment text area */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '8px', fontWeight: 600 }}>
              Ý kiến nhận xét của bạn:
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              placeholder={isTutor ? "Nhận xét thái độ, ý thức học tập và sự tiếp thu kiến thức của học viên trong buổi học..." : "Chia sẻ trải nghiệm học tập của bạn cùng gia sư này để giúp các học viên khác lựa chọn..."}
              style={{
                width: '100%',
                backgroundColor: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '12px',
                padding: '12px',
                color: '#fff',
                fontSize: '14px',
                outline: 'none',
                resize: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                backgroundColor: 'transparent',
                color: '#cbd5e1',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '14px',
                transition: 'background-color 0.2s',
              }}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary"
              style={{
                flex: 2,
                padding: '12px',
                borderRadius: '12px',
                border: 'none',
                fontWeight: 700,
                fontSize: '14px',
                cursor: submitting ? 'not-allowed' : 'pointer',
              }}
            >
              {submitting ? 'Đang gửi...' : 'Gửi Đánh Giá'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
