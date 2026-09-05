import React, { useState, useEffect, useRef } from 'react';
import { uploadService } from '../../upload/services/uploadService';
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

const MAX_CERT_IMAGES = 4;

const parseCertificates = (raw?: string): { urls: string[]; note: string } => {
  if (!raw) return { urls: [], note: '' };
  const isImg = (url: string) => {
    if (!url) return false;
    const trimmed = url.trim();
    return trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.includes('res.cloudinary.com') || /\.(jpg|jpeg|png|webp|gif)$/i.test(trimmed);
  };
  const parts = raw.split(/[\n,]+/).map((p) => p.trim()).filter(Boolean);
  const urls: string[] = [];
  const notes: string[] = [];
  for (const p of parts) {
    if (isImg(p)) {
      if (urls.length < MAX_CERT_IMAGES) urls.push(p);
    } else {
      notes.push(p);
    }
  }
  return { urls, note: notes.join(', ') };
};

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
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingQual, setUploadingQual] = useState(false);
  const [certImages, setCertImages] = useState<string[]>([]);
  const [uploadingCerts, setUploadingCerts] = useState<{ id: string; previewUrl: string }[]>([]);
  const [certNote, setCertNote] = useState<string>('');
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const qualInputRef = useRef<HTMLInputElement>(null);

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
          const rawQual = profile.tutorProfile.qualifications || '';
          const { urls: loadedCerts, note: loadedNote } = parseCertificates(rawQual);
          setCertImages(loadedCerts);
          setCertNote(loadedNote);
          setQualifications(rawQual);
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

  const handleAvatarFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const oldAvatar = avatarUrl;
    const tempAvatar = URL.createObjectURL(file);
    try {
      setAvatarUrl(tempAvatar);
      setUploadingAvatar(true);
      setMessage(null);
      const res = await uploadService.uploadImage(file, 'avatars');
      if (res && res.url) {
        setAvatarUrl(res.url);
        try { URL.revokeObjectURL(tempAvatar); } catch {}
        setMessage({ type: 'success', text: '📷 Đã tải ảnh đại diện lên Cloudinary thành công!' });
      }
    } catch (err: any) {
      console.error('Failed to upload avatar:', err);
      setAvatarUrl(oldAvatar);
      try { URL.revokeObjectURL(tempAvatar); } catch {}
      setMessage({ type: 'error', text: err?.response?.data?.messages?.[0] || 'Lỗi khi tải ảnh đại diện lên Cloudinary.' });
    } finally {
      setUploadingAvatar(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleQualFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFiles = Array.from(e.target.files || []);
    if (rawFiles.length === 0) return;

    // Filter duplicate files in the same batch
    const files = rawFiles.filter((f, idx, arr) =>
      arr.findIndex((x) => x.name === f.name && x.size === f.size) === idx
    );

    const currentTotal = certImages.length + uploadingCerts.length;
    const remainingSlots = MAX_CERT_IMAGES - currentTotal;
    if (remainingSlots <= 0) {
      setMessage({ type: 'error', text: `⚠️ Bạn đã tải đủ tối đa ${MAX_CERT_IMAGES} ảnh bằng cấp/chứng chỉ.` });
      if (e.target) e.target.value = '';
      return;
    }

    if (files.length > remainingSlots) {
      setMessage({
        type: 'error',
        text: `⚠️ Bạn chỉ có thể chọn thêm tối đa ${remainingSlots} ảnh nữa (Tổng cộng tối đa ${MAX_CERT_IMAGES} ảnh).`,
      });
      if (e.target) e.target.value = '';
      return;
    }

    // 1. Tạo instant preview bằng Blob URL NGAY TỨC THÌ (0.01 giây)
    const newItems = files.map((file) => ({
      id: Math.random().toString(36).substring(2, 9),
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setUploadingCerts((prev) => [...prev, ...newItems]);
    setUploadingQual(true);
    setMessage(null);

    // 2. Tải lên Cloudinary
    try {
      const uploadPromises = newItems.map(async (item) => {
        try {
          const res = await uploadService.uploadImage(item.file, 'certificates');
          return { id: item.id, url: res?.url || '', previewUrl: item.previewUrl };
        } catch (err) {
          console.error('Failed to upload certificate:', err);
          return { id: item.id, url: '', previewUrl: item.previewUrl, error: true };
        }
      });

      const results = await Promise.all(uploadPromises);

      // Thu hồi Blob URLs
      results.forEach((r) => {
        if (r.previewUrl) {
          try { URL.revokeObjectURL(r.previewUrl); } catch {}
        }
      });

      const successfulUrls = results.filter((r) => r.url).map((r) => r.url);
      const finishedIds = results.map((r) => r.id);

      // Cập nhật state
      setUploadingCerts((prev) => prev.filter((item) => !finishedIds.includes(item.id)));

      if (successfulUrls.length > 0) {
        setCertImages((prev) => {
          const updatedList = [...prev, ...successfulUrls];
          const combined = [...updatedList, ...(certNote.trim() ? [certNote.trim()] : [])].join(', ');
          setQualifications(combined);
          return updatedList;
        });
        setMessage({ type: 'success', text: `📜 Đã tải thành công ${successfulUrls.length} ảnh bằng cấp lên Cloudinary!` });
      }

      const failedCount = results.filter((r) => r.error).length;
      if (failedCount > 0) {
        setMessage({ type: 'error', text: `⚠️ Có ${failedCount} ảnh tải thất bại, vui lòng kiểm tra kết nối mạng và thử lại.` });
      }
    } finally {
      setUploadingQual(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleRemoveCertImage = (indexToRemove: number) => {
    const updated = certImages.filter((_, idx) => idx !== indexToRemove);
    setCertImages(updated);
    const combined = [...updated, ...(certNote.trim() ? [certNote.trim()] : [])].join(', ');
    setQualifications(combined);
  };

  const handleAddCertUrl = () => {
    if (!certNote.trim()) return;
    if (certImages.length >= MAX_CERT_IMAGES) {
      setMessage({ type: 'error', text: `⚠️ Đã đạt tối đa ${MAX_CERT_IMAGES} ảnh bằng cấp.` });
      return;
    }
    const newUrl = certNote.trim();
    const updated = [...certImages, newUrl];
    setCertImages(updated);
    setCertNote('');
    setQualifications(updated.join(', '));
    setMessage({ type: 'success', text: '✓ Đã thêm link ảnh trực tiếp vào album bằng cấp!' });
  };

  const handleCertNoteChange = (val: string) => {
    setCertNote(val);
    const combined = [...certImages, ...(val.trim() ? [val.trim()] : [])].join(', ');
    setQualifications(combined);
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

    if (certNote.length > 300) {
      errors.qualifications = `Ghi chú bằng cấp không được vượt quá 300 ký tự (Hiện tại: ${certNote.length}/300).`;
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

      // Return to the current interface and restore URL
      setTimeout(() => {
        onClose();
      }, 700);
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
        onKeyDown={(e) => e.stopPropagation()}
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
                    type="tel"
                    inputMode="numeric"
                    maxLength={15}
                    value={phone}
                    onKeyDown={(e) => {
                      // Allow navigation and editing control keys (Backspace, Delete, Tab, Arrows, Home, End, Enter, Escape, Ctrl/Cmd shortcuts)
                      if (
                        ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'Enter', 'Escape'].includes(e.key) ||
                        e.ctrlKey ||
                        e.metaKey
                      ) {
                        return;
                      }
                      // Strictly block any non-digit character (letters, spaces, symbols)
                      if (!/^[0-9]$/.test(e.key)) {
                        e.preventDefault();
                        e.stopPropagation();
                      }
                    }}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '');
                      handlePhoneChange(digits);
                    }}
                    onPaste={(e) => {
                      e.preventDefault();
                      const pasted = e.clipboardData.getData('text');
                      const digits = pasted.replace(/\D/g, '');
                      const newPhone = (phone + digits).slice(0, 15);
                      handlePhoneChange(newPhone);
                    }}
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

              {/* Avatar URL & Cloudinary Upload */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0' }}>
                    🖼️ Ảnh Đại Diện (Tải ảnh từ máy hoặc dán URL)
                  </label>
                  <span style={{ fontSize: '11px', color: avatarUrl.length > 300 ? '#ef4444' : '#64748b' }}>
                    {avatarUrl.length}/300
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input
                    type="file"
                    ref={avatarInputRef}
                    accept="image/jpeg,image/png,image/webp"
                    style={{ display: 'none' }}
                    onChange={handleAvatarFileSelect}
                  />
                  <input
                    type="text"
                    maxLength={300}
                    value={avatarUrl}
                    onChange={(e) => handleTextChange('avatarUrl', e.target.value, setAvatarUrl, 'Ảnh đại diện')}
                    placeholder="https://res.cloudinary.com/... hoặc bấm nút chọn ảnh"
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: fieldErrors.avatarUrl ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.15)',
                      backgroundColor: 'rgba(15, 23, 42, 0.6)',
                      color: '#fff',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  />
                  <button
                    type="button"
                    disabled={uploadingAvatar}
                    onClick={() => avatarInputRef.current?.click()}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '8px',
                      border: '1px solid #38bdf8',
                      backgroundColor: 'rgba(56, 189, 248, 0.15)',
                      color: '#38bdf8',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: uploadingAvatar ? 'not-allowed' : 'pointer',
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    {uploadingAvatar ? '⏳ Đang tải...' : '📷 Chọn Ảnh'}
                  </button>
                </div>
                {isImageUrl(avatarUrl) && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '10px' }}>
                    <img
                      src={avatarUrl}
                      alt="Avatar Preview"
                      style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #38bdf8' }}
                      onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
                    />
                    <span style={{ fontSize: '12px', color: '#4ade80' }}>✓ Xem trước ảnh đại diện</span>
                  </div>
                )}
                {fieldErrors.avatarUrl && (
                  <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    ⚠️ {fieldErrors.avatarUrl}
                  </span>
                )}
              </div>

              {/* Qualifications with Cloudinary Upload & Preview */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0' }}>
                    📜 Bằng Cấp & Chứng Chỉ (Tối đa ${MAX_CERT_IMAGES} ảnh)
                  </label>
                  <span
                    style={{
                      fontSize: '11px',
                      color: (certImages.length + uploadingCerts.length) >= MAX_CERT_IMAGES ? '#38bdf8' : '#94a3b8',
                      backgroundColor: 'rgba(56, 189, 248, 0.1)',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      fontWeight: 600,
                    }}
                  >
                    Đã tải: {certImages.length + uploadingCerts.length}/${MAX_CERT_IMAGES} ảnh
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap' }}>
                  <input
                    type="file"
                    ref={qualInputRef}
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    style={{ display: 'none' }}
                    onChange={handleQualFileSelect}
                  />
                  <button
                    type="button"
                    disabled={uploadingQual || certImages.length >= MAX_CERT_IMAGES}
                    onClick={() => qualInputRef.current?.click()}
                    style={{
                      padding: '9px 16px',
                      borderRadius: '8px',
                      border: certImages.length >= MAX_CERT_IMAGES ? '1px solid #475569' : '1px solid #a855f7',
                      backgroundColor: certImages.length >= MAX_CERT_IMAGES ? 'rgba(71, 85, 105, 0.2)' : 'rgba(168, 85, 247, 0.15)',
                      color: certImages.length >= MAX_CERT_IMAGES ? '#94a3b8' : '#c084fc',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: uploadingQual || certImages.length >= MAX_CERT_IMAGES ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    {uploadingQual ? '⏳ Đang tải...' : certImages.length >= MAX_CERT_IMAGES ? '✓ Đã đủ 4 ảnh' : '📁 Tải Thêm Ảnh Bằng Cấp'}
                  </button>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                    (Có thể chọn cùng lúc tối đa ${MAX_CERT_IMAGES} ảnh từ máy tính)
                  </span>
                </div>

                {/* Gallery of Uploaded Certificate Photos */}
                {(certImages.length > 0 || uploadingCerts.length > 0) && (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
                      gap: '10px',
                      marginBottom: '10px',
                      padding: '10px',
                      backgroundColor: 'rgba(15, 23, 42, 0.5)',
                      borderRadius: '10px',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                    }}
                  >
                    {/* Finalized Cloudinary Certificates */}
                    {certImages.map((url, idx) => (
                      <div
                        key={idx}
                        style={{
                          position: 'relative',
                          height: '80px',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          border: '1px solid rgba(56, 189, 248, 0.3)',
                          backgroundColor: '#0f172a',
                          transition: 'transform 0.15s ease',
                        }}
                      >
                        <a href={url} target="_blank" rel="noreferrer" title="Click để xem ảnh gốc">
                          <img
                            src={url}
                            alt={`Bằng cấp ${idx + 1}`}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </a>
                        <span
                          style={{
                            position: 'absolute',
                            bottom: '4px',
                            left: '4px',
                            fontSize: '10px',
                            backgroundColor: 'rgba(0,0,0,0.7)',
                            color: '#38bdf8',
                            padding: '1px 5px',
                            borderRadius: '4px',
                            fontWeight: 600,
                          }}
                        >
                          #${idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveCertImage(idx)}
                          title="Xóa ảnh này"
                          style={{
                            position: 'absolute',
                            top: '4px',
                            right: '4px',
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            backgroundColor: '#ef4444',
                            color: '#fff',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '11px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: 0,
                            boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}

                    {/* Instant Optimistic Uploading Cards */}
                    {uploadingCerts.map((item, idx) => (
                      <div
                        key={item.id}
                        style={{
                          position: 'relative',
                          height: '80px',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          border: '1px dashed #38bdf8',
                          backgroundColor: '#0f172a',
                        }}
                      >
                        <img
                          src={item.previewUrl}
                          alt="Đang tải..."
                          style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.7)' }}
                        />
                        <div
                          style={{
                            position: 'absolute',
                            inset: 0,
                            backgroundColor: 'rgba(15, 23, 42, 0.55)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '3px',
                          }}
                        >
                          <span style={{ fontSize: '14px' }}>⏳</span>
                          <span style={{ fontSize: '10px', color: '#38bdf8', fontWeight: 600 }}>
                            Đang lưu...
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Optional Note Text / Paste URL */}
                <div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="text"
                      maxLength={300}
                      value={certNote}
                      onChange={(e) => handleCertNoteChange(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && isImageUrl(certNote)) {
                          e.preventDefault();
                          handleAddCertUrl();
                        }
                      }}
                      placeholder="Dán link ảnh (https://...) hoặc nhập ghi chú bằng cấp..."
                      style={{
                        flex: 1,
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: fieldErrors.qualifications ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.15)',
                        backgroundColor: 'rgba(15, 23, 42, 0.6)',
                        color: '#fff',
                        fontSize: '13px',
                        outline: 'none',
                      }}
                    />
                    {isImageUrl(certNote) && (
                      <button
                        type="button"
                        onClick={handleAddCertUrl}
                        disabled={certImages.length >= MAX_CERT_IMAGES}
                        style={{
                          padding: '9px 14px',
                          borderRadius: '8px',
                          border: '1px solid #0284c7',
                          backgroundColor: '#0284c7',
                          color: '#fff',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        + Thêm vào album
                      </button>
                    )}
                  </div>
                  {fieldErrors.qualifications && (
                    <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                      ⚠️ {fieldErrors.qualifications}
                    </span>
                  )}
                </div>
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
                  {saving ? '⏳ Đang Lưu...' : 'Update Profile'}
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
