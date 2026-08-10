import React, { useState, useEffect } from 'react';
import { TutorSearchResult } from '../types/tutor';
import { availabilityService, AvailabilityDto } from '../services/availabilityService';
import { reviewService, ReviewDto } from '../../reviews/services/reviewService';
import { useAuth } from '../../auth/context/AuthContext';

interface TutorDetailModalProps {
  tutor: TutorSearchResult | null;
  onClose: () => void;
  onBook: (tutor: TutorSearchResult) => void;
}

export const TutorDetailModal: React.FC<TutorDetailModalProps> = ({ tutor, onClose, onBook }) => {
  const { user } = useAuth();
  const isAdmin = Number(user?.role) === 0 || user?.role === 'Admin';
  const isSelf = tutor && user?.id === tutor.tutorId;
  const isTutor = Number(user?.role) === 1 || user?.role === 'Tutor';
  const showBookButton = !isSelf && !isTutor;

  const [availabilities, setAvailabilities] = useState<AvailabilityDto[]>([]);
  const [reviews, setReviews] = useState<ReviewDto[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (tutor?.tutorId) {
      availabilityService.getAvailabilities(tutor.tutorId)
        .then(data => setAvailabilities(data || []))
        .catch(err => console.error('Failed to load availabilities', err));

      setReviewsLoading(true);
      reviewService.getReviews(tutor.tutorId, 1, 20)
        .then(data => setReviews(data.items || []))
        .catch(err => console.error('Failed to load reviews', err))
        .finally(() => setReviewsLoading(false));
    }
  }, [tutor]);

  if (!tutor) return null;

  const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(tutor.fullName)}&background=0D8ABC&color=fff&size=128`;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '32px',
          borderRadius: '20px',
          position: 'relative',
          boxShadow: '0 25px 50px rgba(0,0,0,0.6)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            fontSize: '22px',
            cursor: 'pointer',
          }}
        >
          ✕
        </button>

        {/* Profile Header */}
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', marginBottom: '24px' }}>
          <img
            src={tutor.avatarUrl || defaultAvatar}
            alt={tutor.fullName}
            style={{
              width: '90px',
              height: '90px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '3px solid #38bdf8',
              boxShadow: '0 0 20px rgba(56, 189, 248, 0.3)',
            }}
          />
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#fff', marginBottom: '6px' }}>
              {tutor.fullName}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <span style={{ backgroundColor: 'rgba(251, 191, 36, 0.15)', color: '#fbbf24', padding: '4px 10px', borderRadius: '20px', fontWeight: '700', fontSize: '13px' }}>
                ⭐ {tutor.averageRating > 0 ? tutor.averageRating.toFixed(1) : '5.0'} / 5.0
              </span>
              <span style={{ color: '#94a3b8', fontSize: '13px' }}>
                💬 {tutor.totalReviews} đánh giá • 🎓 {tutor.totalSessions} buổi dạy
              </span>
            </div>
            {tutor.qualifications && (
              <div style={{ fontSize: '13px', color: '#38bdf8', fontWeight: 500 }}>
                📜 {tutor.qualifications}
              </div>
            )}
          </div>
        </div>

        <hr style={{ borderColor: 'rgba(255, 255, 255, 0.1)', marginBottom: '24px' }} />

        {/* Biography Section */}
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ fontSize: '16px', color: '#e2e8f0', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            👤 Giới Thiệu Bản Thân
          </h4>
          <p style={{ fontSize: '14px', color: '#cbd5e1', lineHeight: '1.6', backgroundColor: 'rgba(15, 23, 42, 0.4)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            {tutor.bio || 'Gia sư giàu kinh nghiệm, tâm huyết với nghề. Giúp học viên nắm vững kiến thức từ cơ bản đến nâng cao.'}
          </p>
        </div>

        {/* Subjects & Rates Section */}
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ fontSize: '16px', color: '#e2e8f0', marginBottom: '12px' }}>
            📚 Môn Giảng Dạy & Học Phí Tín Chỉ
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
            {tutor.subjects?.map((sub) => (
              <div
                key={sub.subjectId}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <div>
                  <div style={{ fontWeight: '600', color: '#fff', fontSize: '14px' }}>{sub.subjectName}</div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>Trình độ: Cấp độ {sub.proficiencyLevel}</div>
                </div>
                <div style={{ fontWeight: '700', color: '#a855f7', fontSize: '15px' }}>
                  💎 {sub.hourlyCredits} <span style={{ fontSize: '11px', color: '#94a3b8' }}>/giờ</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Schedule Overview Info */}
        <div style={{ marginBottom: '28px', backgroundColor: 'rgba(56, 189, 248, 0.08)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
          <div style={{ fontWeight: '600', color: '#38bdf8', fontSize: '14px', marginBottom: '8px' }}>
            📅 Khung Giờ Rảnh Của Gia Sư
          </div>
          {availabilities.length === 0 ? (
            <div style={{ fontSize: '13px', color: '#cbd5e1' }}>Gia sư này chưa đăng ký khung giờ rảnh nào.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '140px', overflowY: 'auto' }}>
              {availabilities.map((av) => (
                <div key={av.id} style={{ fontSize: '13px', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>•</span>
                  {av.isRecurring ? (
                    <span>
                      Thứ {av.dayOfWeek === 0 ? 'Chủ Nhật' : av.dayOfWeek === 6 ? 'Bảy' : (av.dayOfWeek! + 1)}:
                      <strong style={{ color: '#38bdf8', marginLeft: '4px' }}>
                        {av.startTime.substring(0, 5)} - {av.endTime.substring(0, 5)}
                      </strong> (Hàng tuần)
                    </span>
                  ) : (
                    <span>
                      Ngày {av.specificDate ? new Date(av.specificDate).toLocaleDateString('vi-VN') : ''}:
                      <strong style={{ color: '#38bdf8', marginLeft: '4px' }}>
                        {av.startTime.substring(0, 5)} - {av.endTime.substring(0, 5)}
                      </strong> (Một lần)
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Student Reviews Section */}
        <div style={{ marginBottom: '28px' }}>
          <h4 style={{ fontSize: '16px', color: '#e2e8f0', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            💬 Đánh Giá Từ Học Viên
          </h4>
          {reviewsLoading ? (
            <div style={{ fontSize: '13px', color: '#94a3b8' }}>Đang tải đánh giá...</div>
          ) : reviews.length === 0 ? (
            <div style={{ fontSize: '13px', color: '#cbd5e1', fontStyle: 'italic', backgroundColor: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px' }}>
              Chưa có đánh giá nào cho gia sư này.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '200px', overflowY: 'auto' }}>
              {reviews.map((rev) => (
                <div
                  key={rev.id}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div style={{ fontWeight: 600, color: '#fff', fontSize: '13px' }}>
                      {rev.reviewerName}
                      <span style={{ color: '#38bdf8', fontSize: '11px', marginLeft: '6px', fontWeight: 'normal' }}>
                        ({rev.subjectName})
                      </span>
                    </div>
                    <span style={{ color: '#fbbf24', fontSize: '12px', fontWeight: 'bold' }}>
                      {'⭐'.repeat(rev.rating)}
                    </span>
                  </div>
                  {rev.comment && (
                    <p style={{ fontSize: '13px', color: '#cbd5e1', margin: '4px 0 0', lineHeight: 1.4 }}>
                      {rev.comment}
                    </p>
                  )}
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px', textAlign: 'right' }}>
                    {new Date(rev.createdAt).toLocaleDateString('vi-VN')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Admin Only Info Section */}
        {isAdmin && (
          <div style={{ marginBottom: '24px', backgroundColor: 'rgba(168, 85, 247, 0.08)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
            <div style={{ fontWeight: '600', color: '#c084fc', fontSize: '14px', marginBottom: '8px' }}>
              👑 Thông Tin Quản Trị (Admin Only)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: '#cbd5e1' }}>
              <div>📞 Số điện thoại: <strong style={{ color: '#fff' }}>{tutor.phone || 'Chưa cập nhật'}</strong></div>
              <div>✉️ Email: <strong style={{ color: '#fff' }}>{tutor.email || 'Chưa cập nhật'}</strong></div>
              <div>🔗 Link học default: {tutor.defaultMeetingLink ? (
                <a href={tutor.defaultMeetingLink} target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8', textDecoration: 'underline' }}>
                  {tutor.defaultMeetingLink}
                </a>
              ) : (
                <strong style={{ color: '#64748b' }}>Chưa cấu hình</strong>
              )}</div>
            </div>
          </div>
        )}

        {/* Modal Actions */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
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
            Đóng
          </button>
          {showBookButton && (
            <button
              onClick={() => {
                onClose();
                onBook(tutor);
              }}
              className="btn-primary"
              style={{
                padding: '12px 24px',
                fontSize: '14px',
              }}
            >
              🗓️ Đặt Lịch Học Với Gia Sư
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
