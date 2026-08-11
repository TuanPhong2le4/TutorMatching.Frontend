import React from 'react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: any, subTab?: any) => void;
  role?: number | string;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  unreadCenterNotificationCount?: number;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  badge?: number;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  role,
  isCollapsed,
  onToggleCollapse,
  unreadCenterNotificationCount = 0,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const roleNum = Number(role);
  const isAdmin = roleNum === 0 || role === 'Admin';
  const isTutor = roleNum === 1 || role === 'Tutor';

  // Build menu sections based on user role
  const getMenuSections = (): MenuSection[] => {
    if (isAdmin) {
      return [
        {
          title: 'TỔNG QUAN',
          items: [
            { id: 'home', label: 'Dashboard', icon: '🏠' },
            { id: 'tutors', label: 'Tra cứu gia sư', icon: '🔍' },
            { id: 'bookings', label: 'Quản lý lịch học', icon: '🗓️' },
          ],
        },
        {
          title: 'NGƯỜI DÙNG',
          items: [
            { id: 'admin-users', label: 'Quản lý người dùng', icon: '👥' },
            { id: 'admin-tutors', label: 'Duyệt hồ sơ gia sư', icon: '📋' },
          ],
        },
        {
          title: 'HỆ THỐNG',
          items: [
            { id: 'wallet', label: 'Quản lý nạp tiền', icon: '💳' },
            { id: 'admin-reviews', label: 'Quản lý đánh giá', icon: '⭐' },
            { id: 'admin-subjects', label: 'Quản lý môn học', icon: '📚' },
            { id: 'admin-revenue', label: 'Báo cáo doanh thu', icon: '📈' },
          ],
        },
      ];
    }

    if (isTutor) {
      return [
        {
          title: 'GIẢNG DẠY',
          items: [
            { id: 'home', label: 'Dashboard', icon: '🏠' },
            { id: 'bookings', label: 'Quản lý lịch dạy', icon: '🗓️' },
            { id: 'progress', label: 'Tiến độ học viên', icon: '🎯' },
          ],
        },
        {
          title: 'TÀI CHÍNH & TIỆN ÍCH',
          items: [
            { id: 'wallet', label: 'Ví & Thu nhập', icon: '💎' },
            {
              id: 'center-notifications',
              label: 'Thông báo trung tâm',
              icon: '📢',
              badge: unreadCenterNotificationCount,
            },
            { id: 'tutors', label: 'Tra cứu gia sư', icon: '🔍' },
          ],
        },
      ];
    }

    // Default: Student
    return [
      {
        title: 'HỌC TẬP & GIA SƯ',
        items: [
          { id: 'home', label: 'Dashboard', icon: '🏠' },
          { id: 'tutors', label: 'Tìm gia sư', icon: '🔍' },
          { id: 'bookings', label: 'Lịch học của tôi', icon: '🗓️' },
          { id: 'progress', label: 'Tiến độ học tập', icon: '🎯' },
        ],
      },
      {
        title: 'TÀI CHÍNH & TIỆN ÍCH',
        items: [
          { id: 'wallet', label: 'Ví tín dụng', icon: '💎' },
          {
            id: 'center-notifications',
            label: 'Thông báo trung tâm',
            icon: '📢',
            badge: unreadCenterNotificationCount,
          },
        ],
      },
    ];
  };

  const sections = getMenuSections();

  const handleItemClick = (tabId: string) => {
    onTabChange(tabId);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  // Reusable Sidebar Inner Content
  const renderSidebarContent = (isDrawer = false) => {
    const collapsed = !isDrawer && isCollapsed;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', overflowX: 'hidden' }}>
        {/* Brand Header */}
        <div
          style={{
            padding: collapsed ? '20px 12px' : '20px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            cursor: 'pointer',
            justifyContent: collapsed ? 'center' : 'space-between',
          }}
          onClick={() => handleItemClick('home')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                minWidth: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #38bdf8, #a855f7)',
                display: 'grid',
                placeItems: 'center',
                fontWeight: 800,
                fontSize: '19px',
                color: '#fff',
                boxShadow: '0 4px 12px rgba(56, 189, 248, 0.3)',
              }}
            >
              T
            </div>
            {!collapsed && (
              <div style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
                <h1
                  style={{
                    fontSize: '18px',
                    fontWeight: 800,
                    margin: 0,
                    letterSpacing: '-0.3px',
                    background: 'linear-gradient(135deg, #38bdf8, #c084fc)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  TutorMatching
                </h1>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, display: 'block', marginTop: '-2px' }}>
                  {isAdmin ? 'ADMIN PORTAL' : isTutor ? 'TUTOR HUB' : 'STUDENT APP'}
                </span>
              </div>
            )}
          </div>

          {/* Close button on mobile drawer */}
          {isDrawer && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCloseMobile?.();
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#94a3b8',
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Navigation Menu List */}
        <div style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {sections.map((section, sIdx) => (
            <div key={sIdx}>
              {!collapsed && (
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#64748b',
                    letterSpacing: '0.8px',
                    padding: '0 12px 8px',
                    textTransform: 'uppercase',
                  }}
                >
                  {section.title}
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {section.items.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleItemClick(item.id)}
                      title={collapsed ? item.label : undefined}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: collapsed ? '12px 0' : '10px 14px',
                        justifyContent: collapsed ? 'center' : 'flex-start',
                        borderRadius: '10px',
                        border: isActive
                          ? '1px solid rgba(56, 189, 248, 0.3)'
                          : '1px solid transparent',
                        backgroundColor: isActive
                          ? 'rgba(56, 189, 248, 0.12)'
                          : 'transparent',
                        color: isActive ? '#38bdf8' : '#94a3b8',
                        cursor: 'pointer',
                        fontSize: '13.5px',
                        fontWeight: isActive ? 700 : 500,
                        transition: 'all 0.18s ease',
                        textAlign: 'left',
                        position: 'relative',
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                          e.currentTarget.style.color = '#f1f5f9';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = '#94a3b8';
                        }
                      }}
                    >
                      <span style={{ fontSize: '17px', display: 'grid', placeItems: 'center' }}>
                        {item.icon}
                      </span>
                      {!collapsed && (
                        <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.label}
                        </span>
                      )}
                      {item.badge && item.badge > 0 && (
                        <span
                          style={{
                            backgroundColor: '#ef4444',
                            color: '#fff',
                            borderRadius: '20px',
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: collapsed ? '2px 5px' : '2px 7px',
                            lineHeight: 1,
                            boxShadow: '0 0 8px rgba(239, 68, 68, 0.5)',
                          }}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar Footer: Toggle Collapse Button on Desktop */}
        {!isDrawer && (
          <div
            style={{
              padding: '14px 12px',
              borderTop: '1px solid rgba(255, 255, 255, 0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'space-between',
            }}
          >
            {!collapsed && (
              <span style={{ fontSize: '11px', color: '#475569', fontWeight: 600 }}>
                v2.0 • 2026
              </span>
            )}
            <button
              onClick={onToggleCollapse}
              title={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#94a3b8',
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                display: 'grid',
                placeItems: 'center',
                cursor: 'pointer',
                fontSize: '13px',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.15)';
                e.currentTarget.style.color = '#38bdf8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.color = '#94a3b8';
              }}
            >
              {collapsed ? '▶' : '◀'}
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* 1. DESKTOP STICKY SIDEBAR (Hidden on < 1024px) */}
      <aside
        className="desktop-sidebar"
        style={{
          width: isCollapsed ? '78px' : '260px',
          backgroundColor: '#0c1322',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          height: '100vh',
          position: 'sticky',
          top: 0,
          zIndex: 150,
          transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          flexShrink: 0,
        }}
      >
        {renderSidebarContent(false)}
      </aside>

      {/* 2. MOBILE DRAWER OVERLAY (Shown when isMobileOpen is true) */}
      {isMobileOpen && (
        <div
          className="mobile-drawer"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2000,
            display: 'flex',
          }}
        >
          {/* Backdrop Blur */}
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(5, 10, 20, 0.75)',
              backdropFilter: 'blur(6px)',
              animation: 'fadeIn 0.2s ease-out',
            }}
            onClick={onCloseMobile}
          />

          {/* Slide-in Drawer Container */}
          <aside
            style={{
              position: 'relative',
              width: '280px',
              maxWidth: '85vw',
              height: '100%',
              backgroundColor: '#0c1322',
              borderRight: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
              animation: 'slideInLeft 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              zIndex: 2001,
            }}
          >
            {renderSidebarContent(true)}
          </aside>
        </div>
      )}
    </>
  );
};
