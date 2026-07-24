import React, { useState, useEffect } from 'react';
import { profileService, SubjectExperienceDto } from '../services/profileService';
import { tutorService } from '../services/tutorService';
import { Subject } from '../types/tutor';

interface TutorProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileSaved: () => void;
}

export const TutorProfileEditModal: React.FC<TutorProfileEditModalProps> = ({ isOpen, onClose, onProfileSaved }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bio, setBio] = useState('');
  const [qualifications, setQualifications] = useState('');
  const [defaultMeetingLink, setDefaultMeetingLink] = useState('');

  // Subjects selection
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<Record<string, { selected: boolean; hourlyCredits: number; level: number }>>({});

  useEffect(() => {
    if (isOpen) {
      loadProfileAndSubjects();
    }
  }, [isOpen]);

  const loadProfileAndSubjects = async () => {
    try {
      setLoading(true);
      setMessage(null);

      // Load all available subjects
      const subjectsList = await tutorService.getAllSubjects();
      setAllSubjects(subjectsList || []);

      // Load current tutor profile
      const profile = await profileService.getMyProfile();
      if (profile) {
        setFullName(profile.fullName || '');
        setPhone(profile.phone || '');
        setAvatarUrl(profile.avatarUrl || '');

        if (profile.tutorProfile) {
          setBio(profile.tutorProfile.bio || '');
          setQualifications(profile.tutorProfile.qualifications || '');
          setDefaultMeetingLink(profile.tutorProfile.defaultMeetingLink || '');

          // Map existing subjects safely
          const subjectMap: Record<string, { selected: boolean; hourlyCredits: number; level: number }> = {};
          if (Array.isArray(profile.tutorProfile.subjects)) {
            profile.tutorProfile.subjects.forEach((sub) => {
              subjectMap[sub.subjectId] = {
                selected: true,
                hourlyCredits: sub.hourlyCredits || 50,
                level: sub.proficiencyLevel || 5,
              };
            });
          }
          setSelectedSubjects(subjectMap);
        }
      }
    } catch (err: any) {
      console.warn('Profile initially empty or failed to load:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubjectToggle = (subjectId: string) => {
    setSelectedSubjects((prev) => {
      const existing = prev[subjectId];
      return {
        ...prev,
        [subjectId]: {
          selected: !existing?.selected,
          hourlyCredits: existing?.hourlyCredits || 50,
          level: existing?.level || 5,
        },
      };
    });
  };

  const handlePriceChange = (subjectId: string, credits: number) => {
    setSelectedSubjects((prev) => ({
      ...prev,
      [subjectId]: {
        ...prev[subjectId],
        hourlyCredits: credits > 0 ? credits : 10,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setMessage(null);

      // 1. Update Tutor Details (bio, qualifications, meeting link)
      await profileService.updateTutorProfile({
        bio,
        qualifications,
        defaultMeetingLink,
      });

      // 2. Update Tutor Subjects & Hourly Credits
      const subjectPayload: SubjectExperienceDto[] = Object.keys(selectedSubjects)
        .filter((subId) => selectedSubjects[subId].selected)
        .map((subId) => ({
          subjectId: subId,
          proficiencyLevel: selectedSubjects[subId].level || 5,
          hourlyCredits: Number(selectedSubjects[subId].hourlyCredits) || 50,
        }));

      if (subjectPayload.length > 0) {
        await profileService.updateTutorSubjects(subjectPayload);
      }

      // 3. Update User Basic Info (fullName, phone, avatarUrl) safely
      let cleanAvatarUrl = avatarUrl?.trim() || '';
      if (cleanAvatarUrl.length > 2000 && cleanAvatarUrl.startsWith('data:image')) {
        // Truncate or fallback to standard avatar URL if base64 string is too massive for URL column
        cleanAvatarUrl = '';
      }

      try {
        await profileService.updateUserProfile({
          fullName,
          phone,
          avatarUrl: cleanAvatarUrl || undefined,
        });
      } catch (errUser) {
        console.warn('User basic info update warning:', errUser);
      }

      setMessage({ type: 'success', text: 'Đã lưu thành công! Thông tin hồ sơ Gia Sư đã được cập nhật cho sinh viên xem.' });
      
      // Trigger catalog refresh immediately
      onProfileSaved();
      
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Failed to save tutor profile:', err);
      const errText = err?.response?.data?.messages?.[0] || 'Có lỗi xảy ra khi lưu hồ sơ. Vui lòng thử lại.';
      setMessage({ type: 'error', text: errText });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

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
        zIndex: 1100,
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '720px',
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

        <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#fff', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          👨‍🏫 Cập Nhật Hồ Sơ Gia Sư
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '24px' }}>
          Hoàn thiện thông tin tiểu sử, bằng cấp và thiết lập mức giá Tín chỉ cho các môn bạn giảng dạy.
        </p>

        {message && (
          <div
            style={{
              backgroundColor: message.type === 'success' ? 'rgba(74, 222, 128, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${message.type === 'success' ? 'rgba(74, 222, 128, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
              color: message.type === 'success' ? '#4ade80' : '#f87171',
              padding: '12px 16px',
              borderRadius: '10px',
              marginBottom: '20px',
              fontSize: '14px',
              fontWeight: 600,
            }}
          >
            {message.type === 'success' ? '✓ ' : '⚠️ '}{message.text}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px' }}>Đang tải dữ liệu hồ sơ từ API...</div>
        ) : (
          <form onSubmit={handleSubmit} autoComplete="off" data-lpignore="true" data-form-type="other" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Full Name & Phone */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#94a3b8' }}>
                  Họ và Tên <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  name="tutorFullNameNoAutofill"
                  autoComplete="one-time-code"
                  data-lpignore="true"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.15)',
                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                    color: '#fff',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#94a3b8' }}>
                  Số Điện Thoại Liên Hệ
                </label>
                <input
                  type="text"
                  name="tutorPhoneNoAutofill"
                  autoComplete="one-time-code"
                  data-lpignore="true"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0988xxxxxx"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.15)',
                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                    color: '#fff',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            {/* Avatar URL */}
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#94a3b8' }}>
                Đường Dẫn Ảnh Đại Diện (URL Ảnh Web HTTP/HTTPS)
              </label>
              <input
                type="text"
                name="tutorAvatarUrlNoAutofill"
                autoComplete="one-time-code"
                data-lpignore="true"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://images.unsplash.com/photo-..."
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.15)',
                  backgroundColor: 'rgba(15, 23, 42, 0.6)',
                  color: '#fff',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
              <span style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                💡 Mẹo: Dùng đường dẫn ảnh Web dạng http/https để ảnh đại diện sắc nét và không kích hoạt popup bộ nhớ trình duyệt.
              </span>
            </div>

            {/* Qualifications */}
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#94a3b8' }}>
                📜 Trình Độ Bằng Cấp & Chứng Chỉ
              </label>
              <input
                type="text"
                name="tutorQualNoAutofill"
                autoComplete="one-time-code"
                data-lpignore="true"
                value={qualifications}
                onChange={(e) => setQualifications(e.target.value)}
                placeholder="Ví dụ: Thạc sĩ Đại Học Quốc Gia / IELTS 8.0 / Giải Nhất Quốc Gia..."
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.15)',
                  backgroundColor: 'rgba(15, 23, 42, 0.6)',
                  color: '#fff',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>

            {/* Bio */}
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#94a3b8' }}>
                📝 Giới Thiệu Bản Thân & Kinh Nghiệm Giảng Dạy
              </label>
              <textarea
                rows={4}
                name="tutorBioNoAutofill"
                autoComplete="one-time-code"
                data-lpignore="true"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Viết vài dòng ngắn gọn mô tả kinh nghiệm, phương pháp giảng dạy và thế mạnh của bạn..."
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.15)',
                  backgroundColor: 'rgba(15, 23, 42, 0.6)',
                  color: '#fff',
                  fontSize: '14px',
                  outline: 'none',
                  resize: 'vertical',
                }}
              />
            </div>

            {/* Online Meeting Link */}
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#94a3b8' }}>
                🔗 Link Phòng Học Trực Tuyến (Google Meet / Zoom / MS Teams)
              </label>
              <input
                type="text"
                name="tutorMeetingLinkNoAutofill"
                autoComplete="one-time-code"
                data-lpignore="true"
                value={defaultMeetingLink}
                onChange={(e) => setDefaultMeetingLink(e.target.value)}
                placeholder="https://meet.google.com/abc-defg-hij"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.15)',
                  backgroundColor: 'rgba(15, 23, 42, 0.6)',
                  color: '#fff',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>

            {/* Subjects & Pricing Selection */}
            <div>
              <label style={{ display: 'block', marginBottom: '10px', fontSize: '15px', color: '#e2e8f0', fontWeight: 600 }}>
                📚 Chọn Môn Giảng Dạy & Thiết Lập Học Phí Tín Chỉ
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {allSubjects.map((sub) => {
                  const isChecked = selectedSubjects[sub.id]?.selected || false;
                  const price = selectedSubjects[sub.id]?.hourlyCredits || 50;

                  return (
                    <div
                      key={sub.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        borderRadius: '10px',
                        backgroundColor: isChecked ? 'rgba(56, 189, 248, 0.1)' : 'rgba(255,255,255,0.03)',
                        border: isChecked ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.08)',
                      }}
                    >
                      <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', flex: 1 }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleSubjectToggle(sub.id)}
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        <div>
                          <div style={{ color: '#fff', fontWeight: 600, fontSize: '14px' }}>{sub.name}</div>
                          <div style={{ color: '#94a3b8', fontSize: '12px' }}>{sub.category}</div>
                        </div>
                      </label>

                      {isChecked && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '13px', color: '#a855f7', fontWeight: 600 }}>💎 Học phí (Tín chỉ/giờ):</span>
                          <input
                            type="number"
                            min={10}
                            max={500}
                            name={`subPrice_${sub.id}`}
                            autoComplete="one-time-code"
                            value={price}
                            onChange={(e) => handlePriceChange(sub.id, Number(e.target.value))}
                            style={{
                              width: '80px',
                              padding: '6px 10px',
                              borderRadius: '6px',
                              border: '1px solid #a855f7',
                              backgroundColor: 'rgba(15, 23, 42, 0.8)',
                              color: '#fff',
                              fontSize: '14px',
                              fontWeight: 'bold',
                              textAlign: 'center',
                              outline: 'none',
                            }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
              <button
                type="button"
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
                Hủy
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn-primary"
                style={{
                  padding: '12px 28px',
                  fontSize: '14px',
                  opacity: saving ? 0.7 : 1,
                  cursor: saving ? 'not-allowed' : 'pointer',
                }}
              >
                {saving ? 'Đang Lưu Hồ Sơ...' : '💾 Lưu Hồ Sơ Gia Sư'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
