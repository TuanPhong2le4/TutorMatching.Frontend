import React, { useState, useEffect, useCallback } from 'react';
import { adminUserService, AdminUserDto } from '../services/adminUserService';

export type SubTab = 'students' | 'tutors';

export interface AdminUserManagementProps {
  initialSubTab?: SubTab;
}

export const AdminUserManagement: React.FC<AdminUserManagementProps> = ({ initialSubTab = 'students' }) => {
  const [subTab, setSubTab] = useState<SubTab>(initialSubTab);

  useEffect(() => {
    if (initialSubTab) {
      setSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  // Students state
  const [students, setStudents] = useState<AdminUserDto[]>([]);
  const [studentsSearch, setStudentsSearch] = useState('');
  const [studentsSearchInput, setStudentsSearchInput] = useState('');
  const [studentsPage, setStudentsPage] = useState(1);
  const [studentsTotalCount, setStudentsTotalCount] = useState(0);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentsActiveFilter, setStudentsActiveFilter] = useState<string>('all');

  // Tutors state
  const [tutors, setTutors] = useState<AdminUserDto[]>([]);
  const [tutorsSearch, setTutorsSearch] = useState('');
  const [tutorsSearchInput, setTutorsSearchInput] = useState('');
  const [tutorsPage, setTutorsPage] = useState(1);
  const [tutorsTotalCount, setTutorsTotalCount] = useState(0);
  const [tutorsLoading, setTutorsLoading] = useState(false);
  const [tutorsActiveFilter, setTutorsActiveFilter] = useState<string>('all');

  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Modal states for warning note
  const [noteUserId, setNoteUserId] = useState<string | null>(null);
  const [noteUserName, setNoteUserName] = useState('');
  const [noteValue, setNoteValue] = useState('');
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [submittingNote, setSubmittingNote] = useState(false);

  const PAGE_SIZE = 10;

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setStudentsSearch(studentsSearchInput);
      setStudentsPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [studentsSearchInput]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setTutorsSearch(tutorsSearchInput);
      setTutorsPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [tutorsSearchInput]);

  // Fetch students
  const fetchStudents = useCallback(async () => {
    try {
      setStudentsLoading(true);
      const res = await adminUserService.getUsers({
        pageNumber: studentsPage,
        pageSize: PAGE_SIZE,
        search: studentsSearch || undefined,
        role: 2, // Student
        isActive: studentsActiveFilter === 'all' ? undefined : studentsActiveFilter === 'active',
      });
      setStudents(res.items || []);
      setStudentsTotalCount(res.totalCount || 0);
    } catch {
      setStudents([]);
    } finally {
      setStudentsLoading(false);
    }
  }, [studentsPage, studentsSearch, studentsActiveFilter]);

  // Fetch tutors
  const fetchTutors = useCallback(async () => {
    try {
      setTutorsLoading(true);
      const res = await adminUserService.getUsers({
        pageNumber: tutorsPage,
        pageSize: PAGE_SIZE,
        search: tutorsSearch || undefined,
        role: 1, // Tutor
        isActive: tutorsActiveFilter === 'all' ? undefined : tutorsActiveFilter === 'active',
      });
      setTutors(res.items || []);
      setTutorsTotalCount(res.totalCount || 0);
    } catch {
      setTutors([]);
    } finally {
      setTutorsLoading(false);
    }
  }, [tutorsPage, tutorsSearch, tutorsActiveFilter]);

  useEffect(() => {
    if (subTab === 'students') fetchStudents();
  }, [fetchStudents, subTab]);

  useEffect(() => {
    if (subTab === 'tutors') fetchTutors();
  }, [fetchTutors, subTab]);

  // Lock / Unlock user
  const handleToggleActive = async (user: AdminUserDto) => {
    const isTutor = user.role === 1;
    const actionLabel = isTutor ? 'sa thái' : 'khóa';
    if (!window.confirm(`Bạn có chắc chắn muốn ${user.isActive ? actionLabel : 'mở khóa'} tài khoản "${user.fullName}"?`)) return;

    try {
      setActionLoading(user.id);
      if (user.isActive) {
        await adminUserService.lockUser(user.id);
      } else {
        await adminUserService.unlockUser(user.id);
      }
      // Refresh the relevant list
      if (subTab === 'students') fetchStudents();
      else fetchTutors();
    } catch (err) {
      console.error(`Failed to toggle user status:`, err);
      alert(`Không thể thực hiện thao tác. Vui lòng thử lại.`);
    } finally {
      setActionLoading(null);
    }
  };

  // Save warning note
  const handleSaveNote = async () => {
    if (!noteUserId) return;
    try {
      setSubmittingNote(true);
      await adminUserService.updateUserNote(noteUserId, noteValue.trim() || null);
      setNoteModalOpen(false);
      // Refresh relevant tab
      if (subTab === 'students') fetchStudents();
      else fetchTutors();
    } catch (err) {
      console.error('Failed to save warning:', err);
      alert('Không thể lưu cảnh cáo. Vui lòng thử lại.');
    } finally {
      setSubmittingNote(false);
    }
  };

  const studentsTotalPages = Math.ceil(studentsTotalCount / PAGE_SIZE);
  const tutorsTotalPages = Math.ceil(tutorsTotalCount / PAGE_SIZE);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const renderUserTable = (
    users: AdminUserDto[],
    loading: boolean,
    searchInput: string,
    setSearchInput: (v: string) => void,
    activeFilter: string,
    setActiveFilter: (v: string) => void,
    page: number,
    setPage: (v: number) => void,
    totalCount: number,
    totalPages: number,
    roleLabel: string,
    roleEmoji: string,
    isTutorTab: boolean,
  ) => (
    <div>
      {/* Filters */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          flexWrap: 'wrap',
          marginBottom: '20px',
        }}
      >
        {/* Search */}
        <div style={{ flex: 1, minWidth: '220px' }}>
          <input
            type="text"
            placeholder={`Tìm kiếm ${roleLabel} theo tên hoặc email...`}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.1)',
              backgroundColor: 'rgba(15, 23, 42, 0.6)',
              color: '#fff',
              fontSize: '14px',
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => (e.target.style.borderColor = isTutorTab ? '#a855f7' : '#38bdf8')}
            onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
          />
        </div>

        {/* Active filter */}
        <div>
          <select
            value={activeFilter}
            onChange={(e) => {
              setActiveFilter(e.target.value);
              setPage(1);
            }}
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.1)',
              backgroundColor: 'rgba(15, 23, 42, 0.6)',
              color: '#fff',
              fontSize: '14px',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">✅ Đang hoạt động</option>
            <option value="inactive">🚫 Đã bị khóa</option>
          </select>
        </div>

        {/* Stats pill */}
        <div
          style={{
            padding: '8px 16px',
            borderRadius: '20px',
            backgroundColor: isTutorTab ? 'rgba(168, 85, 247, 0.1)' : 'rgba(56, 189, 248, 0.1)',
            border: isTutorTab ? '1px solid rgba(168, 85, 247, 0.2)' : '1px solid rgba(56, 189, 248, 0.2)',
            color: isTutorTab ? '#c084fc' : '#38bdf8',
            fontSize: '13px',
            fontWeight: 600,
            whiteSpace: 'nowrap',
          }}
        >
          {roleEmoji} Tổng: {totalCount} {roleLabel}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>⏳</div>
          Đang tải dữ liệu...
        </div>
      ) : users.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>📭</div>
          Không tìm thấy {roleLabel} nào.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <th style={thStyle}>#</th>
                <th style={thStyle}>HỌ TÊN</th>
                <th style={thStyle}>EMAIL</th>
                {isTutorTab && <th style={thStyle}>ĐÁNH GIÁ TRUNG BÌNH</th>}
                <th style={thStyle}>SỐ DƯ (TC)</th>
                <th style={thStyle}>TRẠNG THÁI</th>
                {isTutorTab && <th style={thStyle}>CẢNH CÁO GIA SƯ</th>}
                <th style={thStyle}>NGÀY ĐĂNG KÝ</th>
                <th style={thStyle}>THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, idx) => {
                // Determine if tutor has low ratings (below 3.5 average out of 5 stars)
                const isLowRating = isTutorTab && u.totalReviews && u.totalReviews > 0 && u.averageRating && u.averageRating < 3.5;

                return (
                  <tr
                    key={u.id}
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      fontSize: '14px',
                      transition: 'background-color 0.15s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={tdStyle}>
                      <span style={{ color: '#64748b', fontSize: '13px' }}>
                        {(page - 1) * PAGE_SIZE + idx + 1}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ fontWeight: 600, color: '#fff' }}>{u.fullName}</span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ color: '#94a3b8', fontSize: '13px' }}>{u.email}</span>
                    </td>
                    {isTutorTab && (
                      <td style={tdStyle}>
                        {u.totalReviews && u.totalReviews > 0 ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ color: isLowRating ? '#f87171' : '#fbbf24', fontWeight: 700, fontSize: '14px' }}>
                              ⭐ {u.averageRating ? u.averageRating.toFixed(1) : '0.0'}
                            </span>
                            <span style={{ color: '#64748b', fontSize: '12px' }}>
                              ({u.totalReviews} đánh giá)
                            </span>
                            {isLowRating && (
                              <span
                                title="Điểm đánh giá trung bình thấp! Cần nhắc nhở / Cảnh cáo"
                                style={{
                                  backgroundColor: 'rgba(239, 68, 68, 0.2)',
                                  color: '#f87171',
                                  fontSize: '10px',
                                  padding: '2px 6px',
                                  borderRadius: '6px',
                                  fontWeight: 600,
                                  border: '1px solid rgba(239, 68, 68, 0.3)',
                                  marginLeft: '4px'
                                }}
                              >
                                ⚠️ YẾU
                              </span>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: '#64748b', fontSize: '12px' }}>Chưa có đánh giá</span>
                        )}
                      </td>
                    )}
                    <td style={tdStyle}>
                      <span
                        style={{
                          color: '#c084fc',
                          fontWeight: 600,
                          fontSize: '13px',
                        }}
                      >
                        💎 {u.creditBalance.toFixed(1)}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      {u.isActive ? (
                        <span
                          style={{
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: 600,
                            color: '#10b981',
                            backgroundColor: 'rgba(16, 185, 129, 0.15)',
                            display: 'inline-block',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          ✅ Hoạt động
                        </span>
                      ) : (
                        <span
                          style={{
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: 600,
                            color: '#f87171',
                            backgroundColor: 'rgba(248, 113, 113, 0.15)',
                            display: 'inline-block',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          🚫 Đã khóa
                        </span>
                      )}
                    </td>
                    {isTutorTab && (
                      <td style={{ ...tdStyle, maxWidth: '220px' }}>
                        {u.adminNote ? (
                          <span style={{
                            fontSize: '12px',
                            color: '#fb7185',
                            backgroundColor: 'rgba(244, 63, 94, 0.1)',
                            border: '1px dashed rgba(244, 63, 94, 0.25)',
                            padding: '6px 10px',
                            borderRadius: '8px',
                            display: 'block',
                            lineHeight: '1.4',
                            whiteSpace: 'normal',
                            wordBreak: 'break-word'
                          }}>
                            ⚠️ {u.adminNote}
                          </span>
                        ) : (
                          <span style={{ color: '#64748b', fontSize: '13px', fontStyle: 'italic' }}>Không có</span>
                        )}
                      </td>
                    )}
                    <td style={tdStyle}>
                      <span style={{ color: '#64748b', fontSize: '13px' }}>{formatDate(u.createdAt)}</span>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => handleToggleActive(u)}
                          disabled={actionLoading === u.id}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '8px',
                            border: 'none',
                            fontWeight: 600,
                            fontSize: '12px',
                            cursor: actionLoading === u.id ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s',
                            opacity: actionLoading === u.id ? 0.6 : 1,
                            color: u.isActive ? '#f87171' : '#10b981',
                            backgroundColor: u.isActive
                              ? 'rgba(248, 113, 113, 0.15)'
                              : 'rgba(16, 185, 129, 0.15)',
                          }}
                        >
                          {actionLoading === u.id
                            ? '⏳...'
                            : u.isActive
                            ? (isTutorTab ? '🔒 Sa thái' : '🔒 Khóa')
                            : '🔓 Mở khóa'}
                        </button>

                        {isTutorTab && (
                          <button
                            onClick={() => {
                              setNoteUserId(u.id);
                              setNoteUserName(u.fullName);
                              setNoteValue(u.adminNote || '');
                              setNoteModalOpen(true);
                            }}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '8px',
                              border: '1px solid rgba(245, 158, 11, 0.3)',
                              fontWeight: 600,
                              fontSize: '12px',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              color: '#f59e0b',
                              backgroundColor: 'rgba(245, 158, 11, 0.1)',
                            }}
                          >
                            ⚠️ Cảnh cáo
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px',
            marginTop: '20px',
            flexWrap: 'wrap',
          }}
        >
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            style={paginationBtnStyle(page === 1)}
          >
            ← Trước
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
            .reduce<(number | string)[]>((acc, p, i, arr) => {
              if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('...');
              acc.push(p);
              return acc;
            }, [])
            .map((p, i) =>
              typeof p === 'string' ? (
                <span key={`ellipsis-${i}`} style={{ color: '#64748b', padding: '0 4px' }}>
                  ...
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '13px',
                    transition: 'all 0.2s',
                    color: p === page ? '#fff' : '#94a3b8',
                    backgroundColor: p === page ? (isTutorTab ? '#a855f7' : '#38bdf8') : 'rgba(255,255,255,0.05)',
                  }}
                >
                  {p}
                </button>
              ),
            )}
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            style={paginationBtnStyle(page === totalPages)}
          >
            Sau →
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div
      className="glass-panel"
      style={{
        padding: '28px',
        borderRadius: '16px',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2
          style={{
            fontSize: '22px',
            fontWeight: 700,
            color: '#fff',
            margin: '0 0 6px 0',
          }}
        >
          👥 Quản Lý Người Dùng
        </h2>
        <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
          Quản lý tài khoản sinh viên và gia sư trên hệ thống.
        </p>
      </div>

      {/* Sub-tabs */}
      <div
        style={{
          display: 'flex',
          gap: '4px',
          padding: '4px',
          borderRadius: '12px',
          backgroundColor: 'rgba(15, 23, 42, 0.5)',
          border: '1px solid rgba(255,255,255,0.06)',
          marginBottom: '24px',
          width: 'fit-content',
        }}
      >
        <button
          onClick={() => setSubTab('students')}
          style={{
            padding: '10px 24px',
            borderRadius: '10px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '14px',
            transition: 'all 0.25s',
            color: subTab === 'students' ? '#fff' : '#94a3b8',
            backgroundColor: subTab === 'students' ? '#38bdf8' : 'transparent',
            boxShadow: subTab === 'students' ? '0 4px 12px rgba(56, 189, 248, 0.3)' : 'none',
          }}
        >
          🎓 Quản Lý Sinh Viên
        </button>
        <button
          onClick={() => setSubTab('tutors')}
          style={{
            padding: '10px 24px',
            borderRadius: '10px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '14px',
            transition: 'all 0.25s',
            color: subTab === 'tutors' ? '#fff' : '#94a3b8',
            backgroundColor: subTab === 'tutors' ? '#a855f7' : 'transparent',
            boxShadow: subTab === 'tutors' ? '0 4px 12px rgba(168, 85, 247, 0.3)' : 'none',
          }}
        >
          👨‍🏫 Quản Lý Gia Sư
        </button>
      </div>

      {/* Content */}
      {subTab === 'students' &&
        renderUserTable(
          students,
          studentsLoading,
          studentsSearchInput,
          setStudentsSearchInput,
          studentsActiveFilter,
          setStudentsActiveFilter,
          studentsPage,
          setStudentsPage,
          studentsTotalCount,
          studentsTotalPages,
          'sinh viên',
          '🎓',
          false,
        )}

      {subTab === 'tutors' &&
        renderUserTable(
          tutors,
          tutorsLoading,
          tutorsSearchInput,
          setTutorsSearchInput,
          tutorsActiveFilter,
          setTutorsActiveFilter,
          tutorsPage,
          setTutorsPage,
          tutorsTotalCount,
          tutorsTotalPages,
          'gia sư',
          '👨‍🏫',
          true,
        )}

      {/* Ghi chú Cảnh cáo Modal */}
      {noteModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
        }}>
          <div style={{
            width: '100%',
            maxWidth: '520px',
            backgroundColor: '#0f172a',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px',
            padding: '28px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
          }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '20px', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              ⚠️ Cảnh cáo Gia sư
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1.5', margin: '0 0 20px 0' }}>
              Nhập nội dung nhắc nhở hoặc cảnh cáo cho gia sư <strong>{noteUserName}</strong>. Thông tin này giúp admin lưu lại tiến trình làm việc để quyết định sa thải hoặc giữ lại.
            </p>
            
            <textarea
              value={noteValue}
              onChange={(e) => setNoteValue(e.target.value)}
              placeholder="Nhập nội dung cảnh cáo (ví dụ: Đánh giá thấp 2.5 sao, đã gọi điện cảnh cáo lần 1 ngày 30/07. Hẹn lên trung tâm nói chuyện trước khi quyết định sa thải...)"
              rows={5}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '12px',
                backgroundColor: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff',
                fontSize: '14px',
                lineHeight: '1.5',
                outline: 'none',
                resize: 'none',
                marginBottom: '24px',
                fontFamily: 'inherit',
              }}
            />
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setNoteModalOpen(false)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.15)',
                  backgroundColor: 'transparent',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 600,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                Hủy
              </button>
              <button
                onClick={handleSaveNote}
                disabled={submittingNote}
                style={{
                  padding: '10px 24px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: '#f59e0b',
                  color: '#fff',
                  fontWeight: 600,
                  cursor: submittingNote ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 12px rgba(245, 158, 11, 0.25)',
                }}
                onMouseEnter={(e) => {
                  if(!submittingNote) e.currentTarget.style.backgroundColor = '#d97706';
                }}
                onMouseLeave={(e) => {
                  if(!submittingNote) e.currentTarget.style.backgroundColor = '#f59e0b';
                }}
              >
                {submittingNote ? 'Đang lưu...' : 'Lưu cảnh cáo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Shared styles
const thStyle: React.CSSProperties = {
  padding: '12px 16px',
  color: '#94a3b8',
  fontSize: '13px',
  fontWeight: 600,
  whiteSpace: 'nowrap',
};

const tdStyle: React.CSSProperties = {
  padding: '14px 16px',
};

const paginationBtnStyle = (disabled: boolean): React.CSSProperties => ({
  padding: '6px 14px',
  borderRadius: '8px',
  border: 'none',
  cursor: disabled ? 'not-allowed' : 'pointer',
  fontWeight: 600,
  fontSize: '13px',
  color: disabled ? '#475569' : '#94a3b8',
  backgroundColor: 'rgba(255,255,255,0.05)',
  opacity: disabled ? 0.5 : 1,
  transition: 'all 0.2s',
});
