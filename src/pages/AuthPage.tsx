import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types/auth';

interface FieldErrors {
  fullName?: string;
  email?: string;
  password?: string;
  role?: string;
}

const REGISTERED_EMAILS_KEY = 'tutor_matching_registered_emails';

const getRegisteredEmails = (): string[] => {
  try {
    const data = localStorage.getItem(REGISTERED_EMAILS_KEY);
    if (data) return JSON.parse(data);
  } catch {}
  return ['admin@tutorplatform.com', 'phongtest888@gmail.com', 'phong123@gmail.com'];
};

const saveRegisteredEmail = (email: string) => {
  try {
    const list = getRegisteredEmails();
    const lower = email.toLowerCase().trim();
    if (lower && !list.includes(lower)) {
      list.push(lower);
      localStorage.setItem(REGISTERED_EMAILS_KEY, JSON.stringify(list));
    }
  } catch {}
};

export const AuthPage: React.FC = () => {
  const { login, register } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.Student);
  
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateField = (name: 'email' | 'password' | 'fullName', val: string): string | undefined => {
    const trimmed = val.trim();
    if (name === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!trimmed) return 'Vui lòng nhập địa chỉ Email.';
      if (!emailRegex.test(trimmed)) return 'Địa chỉ Email không đúng định dạng (VD: example@gmail.com).';
      
      if (mode === 'register') {
        const registeredList = getRegisteredEmails();
        if (registeredList.includes(trimmed.toLowerCase())) {
          return 'Email này đã được đăng ký trên hệ thống. Vui lòng chọn Email khác hoặc Đăng Nhập.';
        }
      }
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

    if (touchedFields[name] || name === 'email') {
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
          errors.email = 'Email này đã được đăng ký trên hệ thống. Vui lòng chọn Email khác hoặc Đăng Nhập.';
          saveRegisteredEmail(email);
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
    setTouchedFields({ email: true, password: true, fullName: true });

    const clientErrors: FieldErrors = {};
    const emailErr = validateField('email', email);
    const passErr = validateField('password', password);
    const nameErr = mode === 'register' ? validateField('fullName', fullName) : undefined;

    if (emailErr) clientErrors.email = emailErr;
    if (passErr) clientErrors.password = passErr;
    if (nameErr) clientErrors.fullName = nameErr;

    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      setGeneralError('Vui lòng kiểm tra và sửa lại các thông tin bị lỗi bên dưới.');
      return;
    }

    try {
      setIsSubmitting(true);
      if (mode === 'login') {
        await login({ email, password });
      } else {
        await register({ email, password, fullName, role });
        saveRegisteredEmail(email);
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
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 24px',
        background: 'radial-gradient(circle at 50% 20%, #1e1b4b 0%, #0f172a 70%)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '1000px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
          gap: '40px',
          alignItems: 'center',
        }}
      >
        {/* Left Branding Section */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #38bdf8, #a855f7)', display: 'grid', placeItems: 'center', fontWeight: 'bold', fontSize: '24px' }}>
              T
            </div>
            <h1 style={{ fontSize: '32px', fontWeight: '800' }} className="gradient-text">TutorMatching</h1>
          </div>

          <h2 style={{ fontSize: '38px', fontWeight: '800', lineHeight: '1.25', color: '#fff', marginBottom: '16px' }}>
            Nền Tảng Kết Nối Gia Sư <br />
            <span style={{ color: '#38bdf8' }}>Thông Minh & Uy Tín</span>
          </h2>

          <p style={{ color: '#94a3b8', fontSize: '16px', lineHeight: '1.6', marginBottom: '32px' }}>
            Đăng nhập để trải nghiệm hệ thống kết nối gia sư hàng đầu, tìm kiếm khóa học phù hợp, đặt lịch trực tuyến và quản lý học phí bằng Tín chỉ bảo mật với RESTful API ASP.NET Core.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#e2e8f0', fontSize: '15px' }}>
              <span style={{ backgroundColor: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', width: '32px', height: '32px', borderRadius: '50%', display: 'grid', placeItems: 'center', fontWeight: 'bold' }}>✓</span>
              <span>Bảo mật tuyệt đối với chuẩn Xác thực JWT & Bearer Token</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#e2e8f0', fontSize: '15px' }}>
              <span style={{ backgroundColor: 'rgba(168, 85, 247, 0.15)', color: '#a855f7', width: '32px', height: '32px', borderRadius: '50%', display: 'grid', placeItems: 'center', fontWeight: 'bold' }}>✓</span>
              <span>Lọc gia sư theo Môn học, Đánh giá ⭐ và Mức giá tín chỉ</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#e2e8f0', fontSize: '15px' }}>
              <span style={{ backgroundColor: 'rgba(74, 222, 128, 0.15)', color: '#4ade80', width: '32px', height: '32px', borderRadius: '50%', display: 'grid', placeItems: 'center', fontWeight: 'bold' }}>✓</span>
              <span>Đặt lịch học & quản lý tiến độ học tập minh bạch</span>
            </div>
          </div>
        </div>

        {/* Right Standalone Auth Card */}
        <div
          className="glass-panel"
          style={{
            padding: '40px',
            borderRadius: '24px',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
          }}
        >
          {/* Tabs header */}
          <div
            style={{
              display: 'flex',
              gap: '8px',
              marginBottom: '28px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              paddingBottom: '12px',
            }}
          >
            <button
              type="button"
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
                padding: '10px',
                fontSize: '18px',
                fontWeight: 700,
                color: mode === 'login' ? '#38bdf8' : '#94a3b8',
                borderBottom: mode === 'login' ? '3px solid #38bdf8' : 'none',
                cursor: 'pointer',
              }}
            >
              Đăng Nhập
            </button>
            <button
              type="button"
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
                padding: '10px',
                fontSize: '18px',
                fontWeight: 700,
                color: mode === 'register' ? '#a855f7' : '#94a3b8',
                borderBottom: mode === 'register' ? '3px solid #a855f7' : 'none',
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
                borderRadius: '10px',
                marginBottom: '20px',
                fontSize: '14px',
              }}
            >
              {generalError}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {mode === 'register' && (
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#94a3b8', fontWeight: 500 }}>
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
                    padding: '14px 18px',
                    borderRadius: '10px',
                    border: fieldErrors.fullName ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.15)',
                    backgroundColor: 'rgba(15, 23, 42, 0.7)',
                    color: '#fff',
                    fontSize: '15px',
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
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#94a3b8', fontWeight: 500 }}>
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
                  padding: '14px 18px',
                  borderRadius: '10px',
                  border: fieldErrors.email ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.15)',
                  backgroundColor: 'rgba(15, 23, 42, 0.7)',
                  color: '#fff',
                  fontSize: '15px',
                  outline: 'none',
                }}
              />
              {fieldErrors.email ? (
                <span style={{ display: 'block', marginTop: '4px', fontSize: '12px', color: '#ef4444' }}>
                  ⚠️ {fieldErrors.email}
                </span>
              ) : (
                <span style={{ display: 'block', marginTop: '4px', fontSize: '12px', color: '#64748b' }}>
                  💡 Ghi chú: Email hợp lệ (VD: name@gmail.com) dùng để đăng nhập
                </span>
              )}
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#94a3b8', fontWeight: 500 }}>
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
                  padding: '14px 18px',
                  borderRadius: '10px',
                  border: fieldErrors.password ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.15)',
                  backgroundColor: 'rgba(15, 23, 42, 0.7)',
                  color: '#fff',
                  fontSize: '15px',
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
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#94a3b8', fontWeight: 500 }}>
                  Bạn tham gia với vai trò: <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setRole(UserRole.Student)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '10px',
                      border: role === UserRole.Student ? '2px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)',
                      backgroundColor: role === UserRole.Student ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                      color: role === UserRole.Student ? '#38bdf8' : '#94a3b8',
                      cursor: 'pointer',
                      fontWeight: 700,
                    }}
                  >
                    🎓 Học Viên
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole(UserRole.Tutor)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '10px',
                      border: role === UserRole.Tutor ? '2px solid #a855f7' : '1px solid rgba(255,255,255,0.1)',
                      backgroundColor: role === UserRole.Tutor ? 'rgba(168, 85, 247, 0.15)' : 'transparent',
                      color: role === UserRole.Tutor ? '#a855f7' : '#94a3b8',
                      cursor: 'pointer',
                      fontWeight: 700,
                    }}
                  >
                    👨‍🏫 Gia Sư
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary"
              style={{
                marginTop: '12px',
                padding: '16px',
                fontSize: '16px',
                fontWeight: '700',
                borderRadius: '12px',
                opacity: isSubmitting ? 0.7 : 1,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
              }}
            >
              {isSubmitting
                ? 'Đang xử lý...'
                : mode === 'login'
                ? 'Đăng Nhập Vào Hệ Thống →'
                : 'Tạo Tài Khoản Ngay →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
