import React, { useState, useEffect } from 'react';
import { useAuth } from '../../auth/context/AuthContext';
import { profileService, SubjectExperienceDto } from '../services/profileService';
import { tutorService } from '../services/tutorService';
import { Subject } from '../types/tutor';
import { AvailabilityManager } from './AvailabilityManager';

interface TutorProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileSaved: () => void;
}

export const TutorProfileEditModal: React.FC<TutorProfileEditModalProps> = ({ isOpen, onClose, onProfileSaved }) => {
  const { updateUser, logout } = useAuth();
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

  // Field validation error states
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Subjects selection
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<Record<string, { selected: boolean; hourlyCredits: number; level: number }>>({});

  // Lock body scroll when modal is open to fix scroll chaining
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      loadProfileAndSubjects();
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const loadProfileAndSubjects = async () => {
    try {
      setLoading(true);
      setMessage(null);
      setFieldErrors({});

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
                level: sub.proficiencyLevel || 2,
              };
            });
          }
          setSelectedSubjects(subjectMap);
        }
      }
    } catch (err: any) {
      if (err?.response?.status === 401) {
        return;
      }
      console.warn('Profile initially empty or failed to load:', err);
    } finally {
      setLoading(false);
    }
  };

  // Real-time Phone Validation (Only digits, length 10-15)
  const handlePhoneChange = (val: string) => {
    // Only allow digits to be typed
    const cleanDigits = val.replace(/\D/g, '');
    setPhone(cleanDigits);

    if (cleanDigits.length > 0 && (cleanDigits.length < 10 || cleanDigits.length > 15)) {
      setFieldErrors((prev) => ({
        ...prev,
        phone: 'Số điện thoại chỉ gồm chữ số và phải có độ dài từ 10 đến 15 chữ số.',
      }));
    } else {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.phone;
        return next;
      });
    }
  };

  // Real-time Text with max 300 chars
  const handleTextChange = (
    fieldName: string,
    value: string,
    setter: React.Dispatch<React.SetStateAction<string>>,
    label: string
  ) => {
    setter(value);
    if (value.length > 300) {
      setFieldErrors((prev) => ({
        ...prev,
        [fieldName]: `${label} không được vượt quá 300 ký tự (Hiện tại: ${value.length}/300).`,
      }));
    } else {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[fieldName];
        return next;
      });
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
          level: existing?.level || 2,
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

  const isImageUrl = (url: string) => {
    if (!url) return false;
    const clean = url.trim().toLowerCase();
    return clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('data:image');
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!fullName.trim()) {
      errors.fullName = 'Họ và tên không được để trống.';
    } else if (fullName.length > 300) {
      errors.fullName = `Họ và tên không được vượt quá 300 ký tự (Hiện tại: ${fullName.length}/300).`;
    }

    if (phone.trim()) {
      if (!/^\d{10,15}$/.test(phone.trim())) {
        errors.phone = 'Số điện thoại chỉ được dùng số và có độ dài từ 10 đến 15 ký tự.';
      }
    }

    if (bio.length > 300) {
      errors.bio = `Giới thiệu bản thân không được vượt quá 300 ký tự (Hiện tại: ${bio.length}/300).`;
    }

    if (qualifications.length > 300) {
      errors.qualifications = `Bằng cấp/Chứng chỉ không được vượt quá 300 ký tự (Hiện tại: ${qualifications.length}/300).`;
    }

    if (avatarUrl.length > 300) {
      errors.avatarUrl = `Đường dẫn ảnh đại diện không được vượt quá 300 ký tự.`;
    }

    if (defaultMeetingLink.length > 300) {
      errors.defaultMeetingLink = `Link phòng học không được vượt quá 300 ký tự.`;
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      setMessage({ type: 'error', text: 'Vui lòng kiểm tra và sửa lại các trường bị lỗi bên dưới trước khi lưu.' });
      return;
    }

    try {
      setSaving(true);
      setMessage(null);

      // 1. Update Tutor Details (bio, qualifications, meeting link)
      await profileService.updateTutorProfile({
        bio: bio.trim(),
        qualifications: qualifications.trim(),
        defaultMeetingLink: defaultMeetingLink.trim(),
      });

      // 2. Update Tutor Subjects & Hourly Credits
      const subjectPayload: SubjectExperienceDto[] = Object.keys(selectedSubjects)
        .filter((subId) => selectedSubjects[subId].selected)
        .map((subId) => ({
          subjectId: subId,
          proficiencyLevel: selectedSubjects[subId].level || 2,
          hourlyCredits: Number(selectedSubjects[subId].hourlyCredits) || 50,
        }));

      if (subjectPayload.length > 0) {
        await profileService.updateTutorSubjects(subjectPayload);
      }

      // 3. Update User Basic Info (fullName, phone, avatarUrl) safely
      const cleanAvatarUrl = avatarUrl.trim();

      await profileService.updateUserProfile({
        fullName: fullName.trim(),
        phone: phone.trim() || undefined,
        avatarUrl: cleanAvatarUrl || undefined,
      });

      // Sync logged-in user state in AuthContext immediately
      updateUser({
        fullName: fullName.trim(),
        avatarUrl: cleanAvatarUrl || undefined,
      });

      setMessage({ type: 'success', text: '🎉 Đã lưu thành công! Mọi thông tin hồ sơ của bạn đã được cập nhật.' });

      // Trigger catalog & homepage refresh immediately
      onProfileSaved();
    } catch (err: any) {
      console.error('Failed to save tutor profile:', err);
      let errText = err?.response?.data?.messages?.[0] || err?.response?.data?.message || 'Có lỗi xảy ra khi lưu hồ sơ. Vui lòng thử lại.';
      if (err?.response?.status === 401) {
        errText = '🔑 Phiên làm việc đã hết hạn. Đang tự động chuyển về trang Đăng nhập...';
        setTimeout(() => {
          onClose();
          logout();
        }, 1500);
      }
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
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
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
          maxWidth: '820px',
          maxHeight: '90vh',
          overflowY: 'auto',
          overscrollBehavior: 'contain',
          padding: '32px',
          borderRadius: '20px',
          position: 'relative',
          backgroundColor: '#0c1222',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 25px 50px rgba(0,0,0,0.7)',
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
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            color: '#94a3b8',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
        >
          ✕
        </button>

        <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#fff', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          👨‍🏫 Cập Nhật Hồ Sơ Gia Sư
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '20px' }}>
          Cập nhật thông tin lý lịch, bằng cấp chứng chỉ (kèm link ảnh), môn giảng dạy và cấu hình lịch rảnh.
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
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            {message.type === 'success' ? '✓ ' : '⚠️ '}{message.text}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px' }}>Đang tải dữ liệu hồ sơ từ hệ thống...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {/* Form Basic Information & Subjects */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Full Name & Phone */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0' }}>
                      Họ và Tên <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <span style={{ fontSize: '11px', color: fullName.length > 300 ? '#ef4444' : '#64748b' }}>
                      {fullName.length}/300
                    </span>
                  </div>
                  <input
                    type="text"
                    maxLength={300}
                    required
                    value={fullName}
                    onChange={(e) => handleTextChange('fullName', e.target.value, setFullName, 'Họ và tên')}
                    placeholder="Nhập họ và tên đầy đủ..."
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: fieldErrors.fullName ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.15)',
                      backgroundColor: 'rgba(15, 23, 42, 0.6)',
                      color: '#fff',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  />
                  {fieldErrors.fullName && (
                    <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                      ⚠️ {fieldErrors.fullName}
                    </span>
                  )}
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0' }}>
                      Số Điện Thoại (10-15 chữ số)
                    </label>
                    <span style={{ fontSize: '11px', color: fieldErrors.phone ? '#ef4444' : '#64748b' }}>
                      {phone.length}/15
                    </span>
                  </div>
                  <input
                    type="text"
                    maxLength={15}
                    value={phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="Ví dụ: 0988123456"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: fieldErrors.phone ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.15)',
                      backgroundColor: 'rgba(15, 23, 42, 0.6)',
                      color: '#fff',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  />
                  {fieldErrors.phone && (
                    <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                      ⚠️ {fieldErrors.phone}
                    </span>
                  )}
                </div>
              </div>

              {/* Avatar URL */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0' }}>
                    🖼️ Đường Dẫn Ảnh Đại Diện (URL Ảnh Web HTTP/HTTPS)
                  </label>
                  <span style={{ fontSize: '11px', color: avatarUrl.length > 300 ? '#ef4444' : '#64748b' }}>
                    {avatarUrl.length}/300
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={300}
                  value={avatarUrl}
                  onChange={(e) => handleTextChange('avatarUrl', e.target.value, setAvatarUrl, 'Ảnh đại diện')}
                  placeholder="https://images.unsplash.com/photo-..."
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: fieldErrors.avatarUrl ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.15)',
                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                    color: '#fff',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
                {fieldErrors.avatarUrl && (
                  <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    ⚠️ {fieldErrors.avatarUrl}
                  </span>
                )}
              </div>

              {/* Qualifications with Image URL preview */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0' }}>
                    📜 Bằng Cấp & Chứng Chỉ (Nhập text hoặc dán URL ảnh bằng cấp)
                  </label>
                  <span style={{ fontSize: '11px', color: qualifications.length > 300 ? '#ef4444' : '#64748b' }}>
                    {qualifications.length}/300
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={300}
                  value={qualifications}
                  onChange={(e) => handleTextChange('qualifications', e.target.value, setQualifications, 'Bằng cấp/Chứng chỉ')}
                  placeholder="Ví dụ: IELTS 8.0 / Thạc sĩ Sư Phạm hoặc dán link ảnh: https://.../bang-cap.jpg"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: fieldErrors.qualifications ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.15)',
                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                    color: '#fff',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
                {fieldErrors.qualifications && (
                  <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    ⚠️ {fieldErrors.qualifications}
                  </span>
                )}

                {/* Certificate Image Preview Box */}
                {isImageUrl(qualifications) && (
                  <div
                    style={{
                      marginTop: '10px',
                      padding: '12px',
                      backgroundColor: 'rgba(56, 189, 248, 0.08)',
                      borderRadius: '10px',
                      border: '1px solid rgba(56, 189, 248, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                    }}
                  >
                    <img
                      src={qualifications}
                      alt="Chứng chỉ/Bằng cấp"
                      style={{
                        width: '80px',
                        height: '60px',
                        objectFit: 'cover',
                        borderRadius: '6px',
                        border: '1px solid rgba(255,255,255,0.2)',
                      }}
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div>
                      <span style={{ fontSize: '12px', color: '#38bdf8', fontWeight: 600, display: 'block' }}>
                        ✓ Đã nhận diện đường dẫn ảnh Bằng Cấp
                      </span>
                      <a
                        href={qualifications}
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontSize: '11px', color: '#94a3b8', textDecoration: 'underline' }}
                      >
                        Bấm vào đây để xem ảnh gốc
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Bio (Limit 300 chars) */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0' }}>
                    📝 Giới Thiệu Bản Thân & Kinh Nghiệm Giảng Dạy (Tối đa 300 ký tự)
                  </label>
                  <span style={{ fontSize: '11px', color: bio.length > 300 ? '#ef4444' : '#64748b' }}>
                    {bio.length}/300
                  </span>
                </div>
                <textarea
                  rows={3}
                  maxLength={300}
                  value={bio}
                  onChange={(e) => handleTextChange('bio', e.target.value, setBio, 'Giới thiệu bản thân')}
                  placeholder="Mô tả ngắn gọn về phương pháp giảng dạy, phong cách truyền đạt và kinh nghiệm của bạn (tối đa 300 ký tự)..."
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: fieldErrors.bio ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.15)',
                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                    color: '#fff',
                    fontSize: '14px',
                    outline: 'none',
                    resize: 'vertical',
                  }}
                />
                {fieldErrors.bio && (
                  <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    ⚠️ {fieldErrors.bio}
                  </span>
                )}
              </div>

              {/* Online Meeting Link */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0' }}>
                    🔗 Link Phòng Học Trực Tuyến (Google Meet / Zoom)
                  </label>
                  <span style={{ fontSize: '11px', color: defaultMeetingLink.length > 300 ? '#ef4444' : '#64748b' }}>
                    {defaultMeetingLink.length}/300
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={300}
                  value={defaultMeetingLink}
                  onChange={(e) => handleTextChange('defaultMeetingLink', e.target.value, setDefaultMeetingLink, 'Link phòng học')}
                  placeholder="https://meet.google.com/abc-defg-hij"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: fieldErrors.defaultMeetingLink ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.15)',
                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                    color: '#fff',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Subjects & Pricing Selection */}
              <div>
                <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', color: '#e2e8f0', fontWeight: 600 }}>
                  📚 Chọn Môn Giảng Dạy & Thiết Lập Học Phí Tín Chỉ
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '180px', overflowY: 'auto' }}>
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
                          padding: '10px 14px',
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
                            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                          />
                          <span style={{ color: '#fff', fontWeight: 600, fontSize: '13px' }}>{sub.name}</span>
                        </label>

                        {isChecked && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ color: '#94a3b8', fontSize: '12px' }}>Học phí/giờ:</span>
                            <input
                              type="number"
                              min="10"
                              max="10000"
                              value={price}
                              onChange={(e) => handlePriceChange(sub.id, Number(e.target.value))}
                              style={{
                                width: '80px',
                                padding: '6px 10px',
                                borderRadius: '6px',
                                border: '1px solid rgba(255,255,255,0.2)',
                                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                                color: '#fff',
                                fontSize: '13px',
                                outline: 'none',
                                textAlign: 'center',
                              }}
                            />
                            <span style={{ color: '#38bdf8', fontSize: '12px', fontWeight: 700 }}>TC</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Actions Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,0.15)',
                    backgroundColor: 'transparent',
                    color: '#94a3b8',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Đóng
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: '10px 24px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #38bdf8 0%, #6366f1 100%)',
                    color: '#fff',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: saving ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 14px rgba(56, 189, 248, 0.3)',
                  }}
                >
                  {saving ? '⏳ Đang Lưu...' : '💾 Lưu Thông Tin & Môn Học'}
                </button>
              </div>
            </form>

            {/* Section: Cấu Hình Lịch Rảnh Giảng Dạy (Matching Image 2) */}
            <div style={{ paddingTop: '24px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                  📅 Cấu Hình Lịch Rảnh Giảng Dạy
                </h3>
                <p style={{ color: '#94a3b8', fontSize: '13px', marginTop: '4px', marginBottom: 0 }}>
                  Thiết lập các khung giờ rảnh hàng tuần hoặc theo ngày cụ thể để học sinh có thể nhìn thấy và chọn giờ học.
                </p>
              </div>

              <AvailabilityManager onUpdate={onProfileSaved} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
