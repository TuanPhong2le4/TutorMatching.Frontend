import React, { useState } from 'react';
import { progressService } from '../services/progressService';

interface SessionRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  studentName?: string;
  subjectName?: string;
  onSuccess: () => void;
}

export const SessionRecordModal: React.FC<SessionRecordModalProps> = ({
  isOpen,
  onClose,
  bookingId,
  studentName,
  subjectName,
  onSuccess,
}) => {
  const [score, setScore] = useState<number>(8.0);
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await progressService.createSessionRecord(bookingId, { score, notes });
      alert('Đã gửi báo cáo đánh giá buổi học thành công!');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi gửi báo cáo buổi học.');
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
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: '800', margin: 0 }} className="gradient-text">
            📝 Báo Cáo Buổi Học
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '20px', cursor: 'pointer' }}>✕</button>
        </div>

        {studentName && (
          <div style={{ marginBottom: '20px', backgroundColor: 'rgba(255,255,255,0.03)', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ fontSize: '13px', color: '#94a3b8', display: 'block' }}>Học viên:</span>
            <strong style={{ fontSize: '15px', color: '#fff' }}>{studentName}</strong>
            {subjectName && <span style={{ fontSize: '13px', color: '#38bdf8', marginLeft: '8px' }}>({subjectName})</span>}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {error && <div style={{ marginBottom: '16px', color: '#f87171', fontSize: '13px', fontWeight: 600 }}>⚠️ {error}</div>}

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '8px', fontWeight: 600 }}>
              Điểm số đánh giá buổi học (Thang điểm 10): *
            </label>
            <input
              type="number"
              min="0"
              max="10"
              step="0.5"
              value={score}
              onChange={(e) => setScore(Number(e.target.value))}
              required
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                backgroundColor: 'rgba(15,23,42,0.6)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#fff',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '8px', fontWeight: 600 }}>
              Nhận xét / Ghi chú của Gia sư:
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Ghi nhận thái độ học tập, các mảng kiến thức đã làm tốt hoặc cần cải thiện của học viên..."
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
                color: '#94a3b8',
                cursor: 'pointer',
              }}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary"
              style={{ flex: 2, padding: '12px', borderRadius: '12px', cursor: 'pointer' }}
            >
              {submitting ? 'Đang gửi...' : 'Gửi Báo Cáo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
