import React from 'react';
import { TutorSearchResult } from '../types/tutor';
import { useAuth } from '../../auth/context/AuthContext';

interface TutorCardProps {
  tutor: TutorSearchResult;
  onSelect: (tutor: TutorSearchResult) => void;
  onBook: (tutor: TutorSearchResult) => void;
}

export const TutorCard: React.FC<TutorCardProps> = ({ tutor, onSelect, onBook }) => {
  const { user } = useAuth();
  const isSelf = user?.id === tutor.tutorId;
  const isTutor = Number(user?.role) === 1 || user?.role === 'Tutor';
  const showBookButton = !isSelf && !isTutor;

  const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(tutor.fullName)}&background=0D8ABC&color=fff&size=128`;
  const primarySubject = tutor.subjects?.[0];

  return (
    <div
      className="glass-panel"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '24px',
        borderRadius: '16px',
        transition: 'transform 0.25s ease, box-shadow 0.25s ease',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
      onClick={() => onSelect(tutor)}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 12px 30px rgba(56, 189, 248, 0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Header Info */}
      <div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '16px' }}>
          <img
            src={tutor.avatarUrl || defaultAvatar}
            alt={tutor.fullName}
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '2px solid #38bdf8',
            }}
          />
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', marginBottom: '4px' }}>
              {tutor.fullName}
            </h3>
            
            {/* Rating & Sessions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: '#94a3b8' }}>
              <span style={{ color: '#fbbf24', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                ⭐ {tutor.averageRating > 0 ? tutor.averageRating.toFixed(1) : '5.0'}
                <span style={{ color: '#64748b' }}>({tutor.totalReviews})</span>
              </span>
              <span>•</span>
              <span>🎓 {tutor.totalSessions} buổi học</span>
            </div>
          </div>
        </div>

        {/* Bio Snippet */}
        <p
          style={{
            fontSize: '13px',
            color: '#cbd5e1',
            lineHeight: '1.5',
            marginBottom: '16px',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            height: '40px',
          }}
        >
          {tutor.bio || 'Gia sư giàu kinh nghiệm, tận tâm truyền đạt kiến thức và đồng hành cùng học viên.'}
        </p>

        {/* Qualifications Tag */}
        {tutor.qualifications && (
          <div
            style={{
              fontSize: '12px',
              color: '#38bdf8',
              backgroundColor: 'rgba(56, 189, 248, 0.1)',
              padding: '6px 10px',
              borderRadius: '6px',
              marginBottom: '16px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            📜 {tutor.qualifications}
          </div>
        )}

        {/* Subjects List */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px' }}>
          {tutor.subjects?.map((sub) => (
            <span
              key={sub.subjectId}
              style={{
                fontSize: '12px',
                padding: '4px 10px',
                borderRadius: '20px',
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                color: '#e2e8f0',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              📚 {sub.subjectName}
            </span>
          ))}
        </div>
      </div>

      {/* Footer Price & Action Buttons */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>Học phí Tín chỉ</div>
          <div style={{ fontSize: '18px', fontWeight: '700', color: '#a855f7' }}>
            💎 {primarySubject?.hourlyCredits || 50} <span style={{ fontSize: '12px', fontWeight: 'normal', color: '#94a3b8' }}>/ giờ</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(tutor);
            }}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              backgroundColor: 'transparent',
              color: '#fff',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Chi tiết
          </button>
          {showBookButton && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onBook(tutor);
              }}
              className="btn-primary"
              style={{
                padding: '8px 16px',
                fontSize: '13px',
              }}
            >
              Đặt lịch
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
