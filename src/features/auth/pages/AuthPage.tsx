import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types/auth';
import { ForgotPasswordModal } from '../components/ForgotPasswordModal';

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
  return [];
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

  React.useEffect(() => {
    const handleLocation = () => {
      const path = window.location.pathname;
      const search = window.location.search;
      if (path === '/register') {
        setMode('register');
      } else {
        setMode('login');
        if (path !== '/login' && !search.includes('payment=')) {
          window.history.replaceState(null, '', '/login');
        }
      }
    };

    handleLocation();
    window.addEventListener('popstate', handleLocation);
    return () => window.removeEventListener('popstate', handleLocation);
  }, []);

  const handleSetMode = (newMode: 'login' | 'register') => {
    setMode(newMode);
    window.history.pushState(null, '', `/${newMode}`);
    setGeneralError(null);
    setFieldErrors({});
    setTouchedFields({});
    setShowPassword(false);
  };

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.Student);
  
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  const validateField = (name: 'email' | 'password' | 'fullName', val: string): string | undefined => {
    const trimmed = val.trim();
    if (name === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!trimmed) return 'Vui lòng nhập địa chỉ Email.';
      if (!emailRegex.test(trimmed)) return 'Địa chỉ Email không đúng định dạng (VD: example@gmail.com).';
      
      if (mode === 'register') {
        const registeredList = getRegisteredEmails();
        if (registeredList.includes(trimmed.toLowerCase())) {
          return 'Tài khoản này đã tồn tại';
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

    if (statusCode === 403) {
      mainError = data?.message || 'Tài khoản của bạn đã bị vô hiệu hóa hoặc sa thải. Vui lòng liên hệ trung tâm để được hỗ trợ.';
      setFieldErrors(errors);
      setGeneralError(mainError);
      return;
    }

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
          errors.email = 'Tài khoản này đã tồn tại';
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
      window.history.replaceState(null, '', '/home');
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
        backgroundImage: 'linear-gradient(135deg, rgba(15, 23, 42, 0.82), rgba(15, 23, 42, 0.90)), url("/auth-bg.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
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
              onClick={() => handleSetMode('login')}
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
              onClick={() => handleSetMode('register')}
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
                  maxLength={50}
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
                  <span style={{ display: 'block', marginTop: '4px', fontSize: '12px', minHeight: '18px', color: '#ef4444' }}>
                    ⚠️ {fieldErrors.fullName}
                  </span>
                ) : (
                  <span style={{ display: 'block', marginTop: '4px', fontSize: '12px', minHeight: '18px', color: '#64748b' }}>
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
                maxLength={100}
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
                <span style={{ display: 'block', marginTop: '4px', fontSize: '12px', minHeight: '18px', color: '#ef4444' }}>
                  ⚠️ {fieldErrors.email}
                </span>
              ) : (
                <span style={{ display: 'block', marginTop: '4px', fontSize: '12px', minHeight: '18px', color: '#64748b' }}>
                  💡 Ghi chú: Email hợp lệ (VD: name@gmail.com) dùng để đăng nhập
                </span>
              )}
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#94a3b8', fontWeight: 500 }}>
                Mật khẩu <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => handleFieldChange('password', e.target.value)}
                  onBlur={(e) => handleBlur('password', e.target.value)}
                  maxLength={100}
                placeholder="••••••••"
                  style={{
                    width: '100%',
                    padding: '14px 48px 14px 18px',
                    borderRadius: '10px',
                    border: fieldErrors.password ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.15)',
                    backgroundColor: 'rgba(15, 23, 42, 0.7)',
                    color: '#fff',
                    fontSize: '15px',
                    outline: 'none',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  style={{
                    position: 'absolute',
                    right: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4px',
                  }}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '20px', height: '20px' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '20px', height: '20px' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                  )}
                </button>
              </div>
              {fieldErrors.password ? (
                <span style={{ display: 'block', marginTop: '4px', fontSize: '12px', minHeight: '18px', color: '#ef4444' }}>
                  ⚠️ {fieldErrors.password}
                </span>
              ) : (
                <span style={{ display: 'block', marginTop: '4px', fontSize: '12px', minHeight: '18px', color: '#64748b' }}>
                  💡 Ghi chú: Mật khẩu bắt buộc tối thiểu 6 ký tự
                </span>
              )}

              {mode === 'login' && (
                <div style={{ textAlign: 'right', marginTop: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setIsForgotPasswordOpen(true)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#38bdf8',
                      fontSize: '13px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      padding: 0,
                      textDecoration: 'underline',
                    }}
                  >
                    🔑 Quên mật khẩu?
                  </button>
                </div>
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

      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
        onSuccessLoginRedirect={() => {
          handleSetMode('login');
        }}
      />
    </div>
  );
};
