import React from 'react';

export type TabType = 
  | 'home' 
  | 'tutors' 
  | 'bookings' 
  | 'wallet' 
  | 'progress' 
  | 'admin-reviews' 
  | 'admin-users' 
  | 'admin-tutors' 
  | 'admin-revenue' 
  | 'admin-subjects' 
  | 'admin-notifications'
  | 'center-notifications';

interface SidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  userRole?: number | string;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  userRole,
  isOpen,
  onClose,
}) => {
  const roleNum = Number(userRole);
  const isAdmin = roleNum === 0 || userRole === 'Admin';
  const isTutor = roleNum === 1 || userRole === 'Tutor';
  const isStudent = roleNum === 2 || userRole === 'Student';

  const handleItemClick = (tab: TabType) => {
    onTabChange(tab);
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  return (
    <>
      {/* Vertical Sidebar */}
      <aside
        style={{
          backgroundColor: 'rgba(12, 18, 34, 0.96)',
          backdropFilter: 'blur(16px)',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
        className={`sidebar-container ${
          isOpen ? 'sidebar-open' : 'sidebar-closed'
        }`}
      >
        {/* Brand Header */}
        <div
          style={{
            height: '72px',
            boxSizing: 'border-box',
            padding: '0 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div
            onClick={() => handleItemClick('home')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #38bdf8 0%, #818cf8 50%, #c084fc 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 16px -4px rgba(56, 189, 248, 0.35)',
              }}
            >
              <span style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff' }}>T</span>
            </div>
            <div>
              <span
                style={{
                  fontSize: '18px',
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  background: 'linear-gradient(90deg, #38bdf8 0%, #a78bfa 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  display: 'block',
                  lineHeight: '1.2',
                }}
              >
                TutorMatching
              </span>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500, letterSpacing: '0.04em' }}>
                {isAdmin ? 'ADMIN PORTAL' : isTutor ? 'GIA SƯ PRO' : 'HỌC VIÊN PRO'}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Menu List */}
        <div
          style={{
            flex: 1,
            padding: '16px 12px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          {/* GROUP 1: CHÍNH */}
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <NavItem
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                }
                label="Dashboard"
                active={activeTab === 'home'}
                onClick={() => handleItemClick('home')}
              />

              <NavItem
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                }
                label="Tìm gia sư"
                active={activeTab === 'tutors'}
                onClick={() => handleItemClick('tutors')}
              />

              <NavItem
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                }
                label="Lịch học"
                active={activeTab === 'bookings'}
                onClick={() => handleItemClick('bookings')}
              />
            </div>
          </div>

          {/* GROUP 2: NGƯỜI DÙNG (For Admin) OR DÀNH CHO BẠN (For Student/Tutor) */}
          <div>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#64748b',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                padding: '0 12px 8px',
              }}
            >
              {isAdmin ? 'NGƯỜI DÙNG' : 'DÀNH CHO BẠN'}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {isAdmin ? (
                <>
                  <NavItem
                    icon={
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                    }
                    label="Quản lý người dùng"
                    active={activeTab === 'admin-users'}
                    onClick={() => handleItemClick('admin-users')}
                  />

                  <NavItem
                    icon={
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="8.5" cy="7" r="4" />
                        <polyline points="17 11 19 13 23 9" />
                      </svg>
                    }
                    label="Duyệt hồ sơ gia sư"
                    active={activeTab === 'admin-tutors'}
                    onClick={() => handleItemClick('admin-tutors')}
                  />
                </>
              ) : (
                <>
                  <NavItem
                    icon={
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                        <line x1="1" y1="10" x2="23" y2="10" />
                      </svg>
                    }
                    label="Ví Tín Dụng"
                    active={activeTab === 'wallet'}
                    onClick={() => handleItemClick('wallet')}
                  />

                  <NavItem
                    icon={
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 14 14" />
                      </svg>
                    }
                    label="Tiến độ học"
                    active={activeTab === 'progress'}
                    onClick={() => handleItemClick('progress')}
                  />

                  <NavItem
                    icon={
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                      </svg>
                    }
                    label="Thông báo trung tâm"
                    active={activeTab === 'center-notifications'}
                    onClick={() => handleItemClick('center-notifications')}
                  />
                </>
              )}
            </div>
          </div>

          {/* GROUP 3: HỆ THỐNG (For Admin) */}
          {isAdmin && (
            <div>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  padding: '0 12px 8px',
                }}
              >
                HỆ THỐNG
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <NavItem
                  icon={
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                      <line x1="1" y1="10" x2="23" y2="10" />
                    </svg>
                  }
                  label="Quản lý nạp tiền"
                  active={activeTab === 'wallet'}
                  onClick={() => handleItemClick('wallet')}
                />

                <NavItem
                  icon={
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  }
                  label="Quản lý đánh giá"
                  active={activeTab === 'admin-reviews'}
                  onClick={() => handleItemClick('admin-reviews')}
                />

                <NavItem
                  icon={
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                    </svg>
                  }
                  label="Quản lý môn học"
                  active={activeTab === 'admin-subjects'}
                  onClick={() => handleItemClick('admin-subjects')}
                />

                <NavItem
                  icon={
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="20" x2="18" y2="10" />
                      <line x1="12" y1="20" x2="12" y2="4" />
                      <line x1="6" y1="20" x2="6" y2="14" />
                    </svg>
                  }
                  label="Báo cáo doanh thu"
                  active={activeTab === 'admin-revenue'}
                  onClick={() => handleItemClick('admin-revenue')}
                />

                <NavItem
                  icon={
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                  }
                  label="Trung tâm thông báo"
                  active={activeTab === 'admin-notifications' || activeTab === 'center-notifications'}
                  onClick={() => handleItemClick('admin-notifications')}
                />
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Responsive Style Overrides */}
      <style>{`
        @media (max-width: 1023px) {
          .sidebar-container {
            position: fixed !important;
            top: 0 !important;
            bottom: 0 !important;
            left: 0 !important;
            z-index: 999 !important;
            height: 100vh !important;
            box-shadow: 8px 0 32px rgba(0, 0, 0, 0.75) !important;
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease !important;
          }
          .sidebar-closed {
            transform: translateX(-100%) !important;
            width: 280px !important;
            min-width: 280px !important;
            max-width: 280px !important;
            opacity: 0 !important;
            visibility: hidden !important;
            pointer-events: none !important;
          }
          .sidebar-open {
            transform: translateX(0) !important;
            width: 280px !important;
            min-width: 280px !important;
            max-width: 280px !important;
            opacity: 1 !important;
            visibility: visible !important;
            pointer-events: auto !important;
          }
        }

        @media (min-width: 1024px) {
          .sidebar-container {
            transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
            flex-shrink: 0 !important;
          }
          .sidebar-closed {
            width: 0 !important;
            min-width: 0 !important;
            max-width: 0 !important;
            margin-left: 0 !important;
            opacity: 0 !important;
            visibility: hidden !important;
            pointer-events: none !important;
            overflow: hidden !important;
            border-right: none !important;
          }
          .sidebar-open {
            width: 260px !important;
            min-width: 260px !important;
            max-width: 260px !important;
            margin-left: 0 !important;
            opacity: 1 !important;
            visibility: visible !important;
          }
        }
      `}</style>
    </>
  );
};

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, active, onClick }) => {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        width: '100%',
        padding: '12px 14px',
        borderRadius: '12px',
        border: 'none',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: active ? 600 : 500,
        color: active ? '#ffffff' : '#94a3b8',
        background: active
          ? 'linear-gradient(90deg, rgba(56, 189, 248, 0.25) 0%, rgba(99, 102, 241, 0.2) 100%)'
          : 'transparent',
        boxShadow: active ? '0 4px 12px rgba(56, 189, 248, 0.12)' : 'none',
        transition: 'all 0.2s ease',
        textAlign: 'left',
        position: 'relative',
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
          e.currentTarget.style.color = '#e2e8f0';
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = '#94a3b8';
        }
      }}
    >
      {/* Active Indicator bar */}
      {active && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: '8px',
            bottom: '8px',
            width: '4px',
            borderRadius: '0 4px 4px 0',
            background: 'linear-gradient(180deg, #38bdf8 0%, #818cf8 100%)',
          }}
        />
      )}

      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: active ? '#38bdf8' : '#94a3b8',
        }}
      >
        {icon}
      </span>

      <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {label}
      </span>
    </button>
  );
};
