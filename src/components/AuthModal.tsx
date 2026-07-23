import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types/auth';

interface FieldErrors {
  fullName?: string;
  email?: string;
  password?: string;
  role?: string;
}

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, authModalMode, closeAuthModal, login, register } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>(authModalMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.Student);
  
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setMode(authModalMode);
    setGeneralError(null);
    setFieldErrors({});
    setTouchedFields({});
  }, [authModalMode, isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  // Single field validation helper
  const validateField = (name: 'email' | 'password' | 'fullName', val: string): string | undefined => {
    const trimmed = val.trim();
    if (name === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!trimmed) return 'Vui lòng nhập địa chỉ Email.';
      if (!emailRegex.test(trimmed)) return 'Địa chỉ Email không đúng định dạng (VD: example@gmail.com).';
    }

    if (name === 'password') {
      if (!val) return 'Vui lòng nhập Mật khẩu.';
      if (val.includes(' ')) return 'Mật khẩu không được chứa khoảng trắng.';
      if (val.length < 6) return 'Mật khẩu phải có tối thiểu 6 ký tự.';
    }

    if (name === 'fullName' && mode === 'register') {
      if (!trimmed) return 'Vui lòng nhập Họ và Tên.';
      if (trimmed.length < 2) return 'Họ và Tên phải có tối thiểu 2 ký tự.';
    }

    return undefined;
  };

  const handleFieldChange = (name: 'email' | 'password' | 'fullName', val: string) => {
    if (name === 'email') setEmail(val);
    if (name === 'password') setPassword(val);
    if (name === 'fullName') setFullName(val);

    // Live instant validation if field was touched or submitted
    if (touchedFields[name]) {
      const errorMsg = validateField(name, val);
      setFieldErrors((prev) => ({ ...prev, [name]: errorMsg }));
    }
  };

  const handleBlur = (name: 'email' | 'password' | 'fullName', val: string) => {
    setTouchedFields((prev) => ({ ...prev, [name]: true }));
    const errorMsg = validateField(name, val);
    setFieldErrors((prev) => ({ ...prev, [name]: errorMsg }));
  };

  const parseBackendErrors = (err: any) => {
    const errors: FieldErrors = {};
    let mainError: string | null = null;
    const data = err?.response?.data;
    const statusCode = err?.response?.status;

    // 1. Check for 409 Conflict or Duplicate Email Exception Message
    const messagesList = Array.isArray(data?.messages) ? data.messages : [];
    const singleMsg = data?.message || err?.message || '';
    const allMessages = [...messagesList, singleMsg];

    let foundEmailDuplicate = false;
    allMessages.forEach((msg) => {
      if (typeof msg === 'string') {
        const lower = msg.toLowerCase();
        if (
          statusCode === 409 ||
          lower.includes('email already exists') ||
          lower.includes('email exist') ||
          lower.includes('already registered') ||
          lower.includes('đã được đăng ký') ||
          lower.includes('đã tồn tại')
        ) {
          errors.email = 'Email này đã được đăng ký trên hệ thống. Vui lòng sử dụng Email khác hoặc Đăng Nhập.';
          foundEmailDuplicate = true;
        }
      }
    });

    if (!foundEmailDuplicate) {
      if (data?.errors && typeof data.errors === 'object') {
        Object.keys(data.errors).forEach((key) => {
          const lowerKey = key.toLowerCase();
          const firstMsg = Array.isArray(data.errors[key]) ? data.errors[key][0] : String(data.errors[key]);
          if (lowerKey.includes('email')) errors.email = firstMsg;
          else if (lowerKey.includes('password')) errors.password = firstMsg;
          else if (lowerKey.includes('fullname') || lowerKey.includes('name')) errors.fullName = firstMsg;
          else if (lowerKey.includes('role')) errors.role = firstMsg;
        });
      }

      if (data?.messages && Array.isArray(data.messages)) {
        data.messages.forEach((msg: string) => {
          const lower = msg.toLowerCase();
          if (lower.includes('email')) errors.email = msg;
          else if (lower.includes('password') || lower.includes('mật khẩu')) errors.password = msg;
          else if (lower.includes('fullname') || lower.includes('name') || lower.includes('họ') || lower.includes('tên')) errors.fullName = msg;
          else if (lower.includes('role') || lower.includes('vai trò')) errors.role = msg;
          else if (!mainError) mainError = msg;
        });
      }
    }

    if (!mainError && !Object.keys(errors).length) {
      mainError = data?.message || err?.message || 'Có lỗi xảy ra, vui lòng thử lại.';
    }

    setFieldErrors(errors);
    setGeneralError(mainError);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    // Mark all fields as touched to trigger full instant UI error highlights
    setTouchedFields({ email: true, password: true, fullName: true });

    const clientErrors: FieldErrors = {};
    const emailErr = validateField('email', email);
    const passErr = validateField('password', password);
    const nameErr = mode === 'register' ? validateField('fullName', fullName) : undefined;

    if (emailErr) clientErrors.email = emailErr;
    if (passErr) clientErrors.password = passErr;
    if (nameErr) clientErrors.fullName = nameErr;

    // IF ANY INSTANT CLIENT VALIDATION FAILS, STOP IMMEDIATELY (NO BACKEND CALL AT ALL)
    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      setGeneralError('Vui lòng kiểm tra và sửa lại các thông báo lỗi bên dưới.');
      return;
    }

    try {
      setIsSubmitting(true);
      if (mode === 'login') {
        await login({ email, password });
      } else {
        await register({ email, password, fullName, role });
      }
    } catch (err: any) {
      parseBackendErrors(err);
    } finally {
      setIsSubmitting(false);
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
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px',
      }}
      onClick={closeAuthModal}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '460px',
          padding: '32px',
          position: 'relative',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            fontSize: '20px',
            cursor: 'pointer',
          }}
        >
          ✕
        </button>

        {/* Modal Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            paddingBottom: '12px',
          }}
        >
          <button
            onClick={() => {
              setMode('login');
              setGeneralError(null);
              setFieldErrors({});
              setTouchedFields({});
            }}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              padding: '8px',
              fontSize: '16px',
              fontWeight: 600,
              color: mode === 'login' ? '#38bdf8' : '#94a3b8',
              borderBottom: mode === 'login' ? '2px solid #38bdf8' : 'none',
              cursor: 'pointer',
            }}
          >
            Đăng Nhập
          </button>
          <button
            onClick={() => {
              setMode('register');
              setGeneralError(null);
              setFieldErrors({});
              setTouchedFields({});
            }}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              padding: '8px',
              fontSize: '16px',
              fontWeight: 600,
              color: mode === 'register' ? '#a855f7' : '#94a3b8',
              borderBottom: mode === 'register' ? '2px solid #a855f7' : 'none',
              cursor: 'pointer',
            }}
          >
            Đăng Ký
          </button>
        </div>

        {/* General Error Alert */}
        {generalError && (
          <div
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#f87171',
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '20px',
              fontSize: '14px',
            }}
          >
            {generalError}
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {mode === 'register' && (
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#94a3b8' }}>
                Họ và Tên <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => handleFieldChange('fullName', e.target.value)}
                onBlur={(e) => handleBlur('fullName', e.target.value)}
                placeholder="Nhập họ và tên đầy đủ"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: fieldErrors.fullName ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.15)',
                  backgroundColor: 'rgba(15, 23, 42, 0.6)',
                  color: '#fff',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
              {fieldErrors.fullName ? (
                <span style={{ display: 'block', marginTop: '4px', fontSize: '12px', color: '#ef4444' }}>
                  ⚠️ {fieldErrors.fullName}
                </span>
              ) : (
                <span style={{ display: 'block', marginTop: '4px', fontSize: '12px', color: '#64748b' }}>
                  💡 Ghi chú: Nhập đúng tên để hiển thị trên chứng chỉ & hồ sơ
                </span>
              )}
            </div>
          )}

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#94a3b8' }}>
              Địa chỉ Email <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => handleFieldChange('email', e.target.value)}
              onBlur={(e) => handleBlur('email', e.target.value)}
              placeholder="example@domain.com"
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '8px',
                border: fieldErrors.email ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.15)',
                backgroundColor: 'rgba(15, 23, 42, 0.6)',
                color: '#fff',
                fontSize: '14px',
                outline: 'none',
              }}
            />
            {fieldErrors.email ? (
              <span style={{ display: 'block', marginTop: '4px', fontSize: '12px', color: '#ef4444' }}>
                ⚠️ {fieldErrors.email}
              </span>
            ) : (
              <span style={{ display: 'block', marginTop: '4px', fontSize: '12px', color: '#64748b' }}>
                💡 Ghi chú: Email hợp lệ (VD: name@gmail.com) dùng để nhận thông báo
              </span>
            )}
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#94a3b8' }}>
              Mật khẩu <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => handleFieldChange('password', e.target.value)}
              onBlur={(e) => handleBlur('password', e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '8px',
                border: fieldErrors.password ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.15)',
                backgroundColor: 'rgba(15, 23, 42, 0.6)',
                color: '#fff',
                fontSize: '14px',
                outline: 'none',
              }}
            />
            {fieldErrors.password ? (
              <span style={{ display: 'block', marginTop: '4px', fontSize: '12px', color: '#ef4444' }}>
                ⚠️ {fieldErrors.password}
              </span>
            ) : (
              <span style={{ display: 'block', marginTop: '4px', fontSize: '12px', color: '#64748b' }}>
                💡 Ghi chú: Mật khẩu bắt buộc tối thiểu 6 ký tự
              </span>
            )}
          </div>

          {mode === 'register' && (
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#94a3b8' }}>
                Bạn tham gia với vai trò: <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setRole(UserRole.Student)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    border: role === UserRole.Student ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)',
                    backgroundColor: role === UserRole.Student ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                    color: role === UserRole.Student ? '#38bdf8' : '#94a3b8',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  🎓 Học Viên
                </button>
                <button
                  type="button"
                  onClick={() => setRole(UserRole.Tutor)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    border: role === UserRole.Tutor ? '1px solid #a855f7' : '1px solid rgba(255,255,255,0.1)',
                    backgroundColor: role === UserRole.Tutor ? 'rgba(168, 85, 247, 0.15)' : 'transparent',
                    color: role === UserRole.Tutor ? '#a855f7' : '#94a3b8',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  👨‍🏫 Gia Sư
                </button>
              </div>
              {fieldErrors.role && (
                <span style={{ display: 'block', marginTop: '4px', fontSize: '12px', color: '#ef4444' }}>
                  ⚠️ {fieldErrors.role}
                </span>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary"
            style={{
              marginTop: '12px',
              padding: '14px',
              fontSize: '15px',
              opacity: isSubmitting ? 0.7 : 1,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
            }}
          >
            {isSubmitting
              ? 'Đang xử lý...'
              : mode === 'login'
              ? 'Đăng Nhập'
              : 'Tạo Tài Khoản'}
          </button>
        </form>
      </div>
    </div>
  );
};
