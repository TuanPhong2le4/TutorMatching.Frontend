import React, { useState, useEffect } from 'react';
import { useAuth } from '../../auth/context/AuthContext';
import { availabilityService, AvailabilityDto, UpdateAvailabilityRequestItem } from '../services/availabilityService';

export const isValid24hTime = (timeStr: string): boolean => {
  return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(timeStr);
};

export const formatTimeOnBlur = (val: string, setter: (v: string) => void) => {
  const trimmed = val.trim();
  const singleHourRegex = /^([0-9]):([0-5][0-9])$/;
  if (singleHourRegex.test(trimmed)) {
    setter(trimmed.padStart(5, '0'));
    return;
  }
  if (/^[0-9]$/.test(trimmed)) {
    setter(`0${trimmed}:00`);
    return;
  }
  if (/^[1-2][0-9]$/.test(trimmed)) {
    const num = parseInt(trimmed, 10);
    if (num >= 0 && num <= 23) {
      setter(`${trimmed}:00`);
    }
    return;
  }
};

export interface AvailabilityManagerProps {
  onUpdate?: () => void;
}

export const AvailabilityManager: React.FC<AvailabilityManagerProps> = ({ onUpdate }) => {
  const { user } = useAuth();
  const [slots, setSlots] = useState<AvailabilityDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states
  const [isRecurring, setIsRecurring] = useState<boolean>(true);
  const [dayOfWeek, setDayOfWeek] = useState<number>(1); // Monday
  const [specificDate, setSpecificDate] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('12:00');

  useEffect(() => {
    if (user?.id) {
      loadAvailabilities();
    }
  }, [user]);

  const loadAvailabilities = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const data = await availabilityService.getAvailabilities(user!.id);
      setSlots(data || []);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Không thể tải cấu hình lịch rảnh của bạn.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSlot = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!isValid24hTime(startTime) || !isValid24hTime(endTime)) {
      setErrorMsg('Giờ phải đúng định dạng 24h HH:mm (ví dụ: 09:15, 14:30).');
      return;
    }

    if (startTime >= endTime) {
      setErrorMsg('Thời gian bắt đầu phải trước thời gian kết thúc.');
      return;
    }

    if (!isRecurring && !specificDate) {
      setErrorMsg('Vui lòng chọn ngày học cụ thể.');
      return;
    }

    // Check duplicate
    const startStr = startTime + ':00';
    const endStr = endTime + ':00';

    const isDuplicate = slots.some(s => {
      if (s.isRecurring !== isRecurring) return false;
      if (isRecurring) {
        return s.dayOfWeek === dayOfWeek && s.startTime === startStr && s.endTime === endStr;
      } else {
        const sDate = s.specificDate ? new Date(s.specificDate).toISOString().split('T')[0] : '';
        return sDate === specificDate && s.startTime === startStr && s.endTime === endStr;
      }
    });

    if (isDuplicate) {
      setErrorMsg('Khung giờ này đã tồn tại trong danh sách.');
      return;
    }

    const newSlot: AvailabilityDto = {
      id: Math.random().toString(), // temp frontend ID
      isRecurring,
      dayOfWeek: isRecurring ? dayOfWeek : null,
      specificDate: isRecurring ? null : specificDate,
      startTime: startStr,
      endTime: endStr
    };

    setSlots(prev => [...prev, newSlot]);
  };

  const handleRemoveSlot = (id: string) => {
    setSlots(prev => prev.filter(s => s.id !== id));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const payload: UpdateAvailabilityRequestItem[] = slots.map(s => ({
        dayOfWeek: s.isRecurring ? s.dayOfWeek : null,
        startTime: s.startTime,
        endTime: s.endTime,
        isRecurring: s.isRecurring,
        specificDate: s.isRecurring ? null : s.specificDate
      }));

      await availabilityService.updateMyAvailability(payload);
      setSuccessMsg('Đã lưu cấu hình lịch rảnh thành công!');
      setTimeout(() => setSuccessMsg(null), 3000);
      loadAvailabilities();
      onUpdate?.();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Có lỗi xảy ra khi lưu lịch rảnh. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const daysOfWeekLabels = [
    { value: 0, label: 'Chủ Nhật' },
    { value: 1, label: 'Thứ Hai' },
    { value: 2, label: 'Thứ Ba' },
    { value: 3, label: 'Thứ Tư' },
    { value: 4, label: 'Thứ Năm' },
    { value: 5, label: 'Thứ Sáu' },
    { value: 6, label: 'Thứ Bảy' }
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', alignItems: 'start' }}>
      {/* Configuration Form */}
      <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', color: '#38bdf8' }}>
          ➕ Thêm Khung Giờ Rảnh
        </h3>

        <form onSubmit={handleAddSlot}>
          {/* Recurring Toggle */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
              <input
                type="radio"
                checked={isRecurring}
                onChange={() => setIsRecurring(true)}
                style={{ accentColor: '#38bdf8' }}
              />
              Lặp lại hàng tuần (Học Kỳ)
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
              <input
                type="radio"
                checked={!isRecurring}
                onChange={() => setIsRecurring(false)}
                style={{ accentColor: '#38bdf8' }}
              />
              Ngày cụ thể
            </label>
          </div>

          {/* Day of week selection */}
          {isRecurring ? (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', fontWeight: 600, marginBottom: '6px' }}>Chọn Thứ trong tuần:</label>
              <select
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  backgroundColor: '#0f172a',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff',
                  fontSize: '14px',
                  outline: 'none',
                }}
              >
                {daysOfWeekLabels.map(d => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>
          ) : (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', fontWeight: 600, marginBottom: '6px' }}>Chọn Ngày:</label>
              <input
                type="date"
                value={specificDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setSpecificDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  backgroundColor: '#0f172a',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>
          )}

          {/* Time Picker Inputs */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', fontWeight: 600, marginBottom: '6px' }}>Giờ Bắt Đầu (định dạng 24h):</label>
              <input
                type="text"
                placeholder="HH:mm (ví dụ: 09:15)"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                onBlur={() => formatTimeOnBlur(startTime, setStartTime)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  backgroundColor: '#0f172a',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', fontWeight: 600, marginBottom: '6px' }}>Giờ Kết Thúc (định dạng 24h):</label>
              <input
                type="text"
                placeholder="HH:mm (ví dụ: 12:45)"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                onBlur={() => formatTimeOnBlur(endTime, setEndTime)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  backgroundColor: '#0f172a',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%', padding: '12px' }}>
            Thêm Khung Giờ Rảnh
          </button>
        </form>
      </div>

      {/* Slots List */}
      <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#fff' }}>
            📋 Danh Sách Khung Giờ Đã Thiết Lập
          </h3>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="btn-primary"
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              boxShadow: 'none',
            }}
          >
            {saving ? '⏳ Đang lưu...' : '💾 Lưu Lịch Rảnh'}
          </button>
        </div>

        {successMsg && (
          <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10b981', padding: '10px', borderRadius: '8px', fontSize: '13px', marginBottom: '12px' }}>
            ✔️ {successMsg}
          </div>
        )}

        {errorMsg && (
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', padding: '10px', borderRadius: '8px', fontSize: '13px', marginBottom: '12px' }}>
            ⚠️ {errorMsg}
          </div>
        )}

        {loading ? (
          <div style={{ color: '#94a3b8', fontSize: '14px', textAlign: 'center', padding: '32px' }}>Đang tải lịch rảnh hiện tại...</div>
        ) : slots.length === 0 ? (
          <div style={{ color: '#94a3b8', fontSize: '14px', textAlign: 'center', padding: '32px' }}>
            Chưa có khung giờ rảnh nào được thiết lập. Hãy thêm khung giờ ở bảng bên trái rồi bấm **Lưu Lịch Rảnh**.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto', paddingRight: '4px' }}>
            {slots.map((s) => {
              const startFormatted = s.startTime.substring(0, 5);
              const endFormatted = s.endTime.substring(0, 5);
              return (
                <div
                  key={s.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <div style={{ fontSize: '13px' }}>
                    {s.isRecurring ? (
                      <span>
                        🔄 Hàng tuần: <strong style={{ color: '#38bdf8' }}>Thứ {s.dayOfWeek === 0 ? 'Chủ Nhật' : s.dayOfWeek === 6 ? 'Bảy' : (s.dayOfWeek! + 1)}</strong>
                      </span>
                    ) : (
                      <span>
                        📅 Một lần: <strong style={{ color: '#a855f7' }}>{s.specificDate ? new Date(s.specificDate).toLocaleDateString('vi-VN') : ''}</strong>
                      </span>
                    )}
                    <span style={{ marginLeft: '12px', color: '#cbd5e1' }}>⏰ {startFormatted} - {endFormatted}</span>
                  </div>
                  <button
                    onClick={() => handleRemoveSlot(s.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#f87171',
                      cursor: 'pointer',
                      fontSize: '14px',
                      padding: '4px',
                    }}
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
