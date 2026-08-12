import React from 'react';
import { Subject } from '../types/tutor';

interface TutorSearchFilterProps {
  searchTerm: string;
  onSearchChange: (val: string) => void;
  selectedSubjectId: string;
  onSubjectChange: (val: string) => void;
  minRating: number;
  onMinRatingChange: (val: number) => void;
  subjects: Subject[];
  onReset: () => void;
}

const SEARCH_MAX_LEN = 300;

export const TutorSearchFilter: React.FC<TutorSearchFilterProps> = ({
  searchTerm,
  onSearchChange,
  selectedSubjectId,
  onSubjectChange,
  minRating,
  onMinRatingChange,
  subjects,
  onReset,
}) => {
  const isOverLimit = searchTerm.length >= SEARCH_MAX_LEN;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (searchTerm.length >= SEARCH_MAX_LEN) {
      const allowedKeys = [
        'Backspace',
        'Delete',
        'ArrowLeft',
        'ArrowRight',
        'ArrowUp',
        'ArrowDown',
        'Tab',
        'Home',
        'End',
        'Enter',
        'Escape',
      ];
      const isShortcut = (e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x', 'z'].includes(e.key.toLowerCase());
      if (!allowedKeys.includes(e.key) && !isShortcut) {
        e.preventDefault();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasteText = e.clipboardData.getData('text');
    const spaceLeft = SEARCH_MAX_LEN - searchTerm.length;
    if (spaceLeft <= 0) {
      e.preventDefault();
      return;
    }
    if (pasteText.length > spaceLeft) {
      e.preventDefault();
      const truncated = searchTerm + pasteText.substring(0, spaceLeft);
      onSearchChange(truncated);
    }
  };

  return (
    <div
      className="glass-panel"
      style={{
        padding: '24px',
        borderRadius: '16px',
        marginBottom: '32px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      {/* Top Search Bar Input */}
      <div style={{ position: 'relative', width: '100%' }}>
        <input
          type="text"
          value={searchTerm}
          maxLength={SEARCH_MAX_LEN}
          onChange={(e) => onSearchChange(e.target.value.substring(0, SEARCH_MAX_LEN))}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder="🔍 Tìm kiếm gia sư theo tên, môn học hoặc từ khóa kinh nghiệm..."
          style={{
            width: '100%',
            padding: '14px 20px',
            borderRadius: '12px',
            border: isOverLimit ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.15)',
            backgroundColor: 'rgba(15, 23, 42, 0.7)',
            color: '#fff',
            fontSize: '15px',
            outline: 'none',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          }}
        />
        {/* Character Limit Indicator & Warning */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', padding: '0 4px', fontSize: '12px' }}>
          {isOverLimit ? (
            <span style={{ color: '#ef4444', fontWeight: 600 }}>
              ⚠️ Vui lòng không nhập quá ký tự cho phép (Tối đa 300 ký tự - Bàn phím đã bị khóa)
            </span>
          ) : (
            <span style={{ color: '#64748b' }}>Tối đa 300 ký tự</span>
          )}
          <span style={{ color: isOverLimit ? '#ef4444' : '#94a3b8', fontWeight: isOverLimit ? 700 : 500 }}>
            {searchTerm.length}/{SEARCH_MAX_LEN}
          </span>
        </div>
      </div>

      {/* Filter Dropdowns & Controls */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', flex: 1 }}>
          {/* Subject Dropdown */}
          <select
            value={selectedSubjectId}
            onChange={(e) => onSubjectChange(e.target.value)}
            style={{
              padding: '10px 16px',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              backgroundColor: 'rgba(15, 23, 42, 0.8)',
              color: '#fff',
              fontSize: '14px',
              outline: 'none',
              cursor: 'pointer',
              minWidth: '180px',
            }}
          >
            <option value="">📚 Tất cả môn học</option>
            {subjects.map((sub) => (
              <option key={sub.id} value={sub.id} style={{ backgroundColor: '#0f172a', color: '#fff' }}>
                {sub.name} ({sub.category})
              </option>
            ))}
          </select>

          {/* Rating Dropdown */}
          <select
            value={minRating}
            onChange={(e) => onMinRatingChange(Number(e.target.value))}
            style={{
              padding: '10px 16px',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              backgroundColor: 'rgba(15, 23, 42, 0.8)',
              color: '#fff',
              fontSize: '14px',
              outline: 'none',
              cursor: 'pointer',
              minWidth: '160px',
            }}
          >
            <option value={0}>⭐ Tất cả đánh giá</option>
            <option value={4.5} style={{ backgroundColor: '#0f172a', color: '#fff' }}>⭐ Từ 4.5 trở lên</option>
            <option value={4.8} style={{ backgroundColor: '#0f172a', color: '#fff' }}>⭐ Từ 4.8 trở lên</option>
          </select>
        </div>

        {/* Reset Filter Button */}
        {(searchTerm || selectedSubjectId || minRating > 0) && (
          <button
            onClick={onReset}
            style={{
              padding: '10px 16px',
              borderRadius: '10px',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: '#f87171',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            🔄 Xóa bộ lọc
          </button>
        )}
      </div>
    </div>
  );
};
