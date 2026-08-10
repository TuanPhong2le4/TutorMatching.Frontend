import React, { useState, useEffect } from 'react';
import { Subject } from '../../tutors/types/tutor';
import { subjectService } from '../../tutors/services/subjectService';

export const AdminSubjectManagement: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [nameInput, setNameInput] = useState<string>('');
  const [descriptionInput, setDescriptionInput] = useState<string>('');
  const [modalLoading, setModalLoading] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');

  // Toast / Action alerts
  const [alertNotice, setAlertNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [warningModal, setWarningModal] = useState<{ title: string; message: string; subjectName?: string } | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const data = await subjectService.getAll(true);
      setSubjects(data);
    } catch (err: any) {
      setAlertNotice({
        type: 'error',
        message: err.message || 'Không thể tải danh sách môn học.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  // Auto clear alerts after 4s
  useEffect(() => {
    if (alertNotice) {
      const timer = setTimeout(() => setAlertNotice(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [alertNotice]);

  // Filtered Subjects
  const filteredSubjects = subjects.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchSearch) return false;

    if (statusFilter === 'active') return s.isActive;
    if (statusFilter === 'inactive') return !s.isActive;
    return true;
  });

  // Calculate statistics
  const totalCount = subjects.length;
  const activeCount = subjects.filter((s) => s.isActive).length;
  const inactiveCount = subjects.filter((s) => !s.isActive).length;

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingSubject(null);
    setNameInput('');
    setDescriptionInput('');
    setFormError('');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (subject: Subject) => {
    setEditingSubject(subject);
    setNameInput(subject.name);
    setDescriptionInput(subject.description || '');
    setFormError('');
    setIsModalOpen(true);
  };

  // Close Modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSubject(null);
    setNameInput('');
    setDescriptionInput('');
    setFormError('');
    setModalLoading(false);
  };

  // Submit Modal (Create or Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!nameInput.trim()) {
      setFormError('Vui lòng nhập Tên môn học.');
      return;
    }

    if (nameInput.trim().length < 2) {
      setFormError('Tên môn học phải có tối thiểu 2 ký tự.');
      return;
    }

    setModalLoading(true);
    try {
      if (editingSubject) {
        // Update
        await subjectService.update(editingSubject.id, {
          id: editingSubject.id,
          name: nameInput.trim(),
          description: descriptionInput.trim(),
        });
        setAlertNotice({
          type: 'success',
          message: `✅ Đã cập nhật môn học "${nameInput.trim()}" thành công!`,
        });
      } else {
        // Create
        await subjectService.create({
          name: nameInput.trim(),
          description: descriptionInput.trim(),
        });
        setAlertNotice({
          type: 'success',
          message: `🎉 Đã thêm môn học mới "${nameInput.trim()}" thành công!`,
        });
      }

      handleCloseModal();
      await fetchSubjects();
    } catch (err: any) {
      const serverMsg =
        (Array.isArray(err.response?.data?.messages) && err.response.data.messages.length > 0
          ? err.response.data.messages[0]
          : null) ||
        err.response?.data?.message ||
        err.message ||
        'Thao tác không thành công.';
      setFormError(serverMsg);
    } finally {
      setModalLoading(false);
    }
  };

  // Toggle Lock / Unlock (Deactivate / Reactivate)
  const handleToggleLock = async (subject: Subject) => {
    const actionText = subject.isActive ? 'Khóa môn học' : 'Mở khóa môn học';
    const confirmMsg = subject.isActive
      ? `Bạn có chắc muốn Khóa môn học "${subject.name}"? Gia sư & Học viên sẽ không thể chọn môn này để đặt lịch mới.`
      : `Bạn có chắc muốn Mở khóa môn học "${subject.name}" để cho phép đặt lịch bình thường?`;

    if (!window.confirm(confirmMsg)) return;

    setActionLoadingId(subject.id);
    try {
      if (subject.isActive) {
        await subjectService.deleteOrLock(subject.id);
        setAlertNotice({
          type: 'success',
          message: `🔒 Đã khóa môn học "${subject.name}" thành công!`,
        });
      } else {
        await subjectService.reactivate(subject.id);
        setAlertNotice({
          type: 'success',
          message: `🔓 Đã mở khóa môn học "${subject.name}" thành công!`,
        });
      }
      await fetchSubjects();
    } catch (err: any) {
      const serverMsg =
        (Array.isArray(err.response?.data?.messages) && err.response.data.messages.length > 0
          ? err.response.data.messages[0]
          : null) ||
        err.response?.data?.message ||
        err.message ||
        `Không thể ${actionText}.`;

      // Trigger high-visibility Warning Modal
      setWarningModal({
        title: subject.isActive ? 'Không Thể Khóa Môn Học' : 'Không Thể Mở Khóa Môn Học',
        message: serverMsg,
        subjectName: subject.name,
      });

      setAlertNotice({
        type: 'error',
        message: serverMsg,
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 16px' }}>
      {/* Header Title */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, margin: 0, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>📚</span> Quản Lý Môn Học
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '14px', margin: '6px 0 0 0' }}>
            Hệ thống danh mục các môn học giảng dạy trên nền tảng TutorMatching. Thêm mới, chỉnh sửa thông tin hoặc khóa môn học.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          style={{
            padding: '12px 20px',
            backgroundColor: '#0284c7',
            color: '#fff',
            border: 'none',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s ease',
          }}
        >
          <span>➕</span> Thêm Môn Học Mới
        </button>
      </div>

      {/* Alert Notice */}
      {alertNotice && (
        <div
          style={{
            padding: '14px 20px',
            borderRadius: '12px',
            marginBottom: '20px',
            backgroundColor: alertNotice.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: `1px solid ${alertNotice.type === 'success' ? '#10b981' : '#ef4444'}`,
            color: alertNotice.type === 'success' ? '#34d399' : '#f87171',
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          {alertNotice.message}
        </div>
      )}

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div
          style={{
            backgroundColor: '#1e293b',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '20px',
          }}
        >
          <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>
            TỔNG SỐ MÔN HỌC
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#38bdf8' }}>{totalCount}</div>
        </div>

        <div
          style={{
            backgroundColor: '#1e293b',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '20px',
          }}
        >
          <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>
            ĐANG HOẠT ĐỘNG
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#10b981' }}>{activeCount}</div>
        </div>

        <div
          style={{
            backgroundColor: '#1e293b',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '20px',
          }}
        >
          <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>
            ĐANG KHÓA / TẠM DỪNG
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#ef4444' }}>{inactiveCount}</div>
        </div>
      </div>

      {/* Action Bar (Search & Filter) */}
      <div
        style={{
          backgroundColor: '#1e293b',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '16px',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '280px' }}>
          <span style={{ fontSize: '18px' }}>🔍</span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm môn học theo tên hoặc mô tả..."
            style={{
              width: '100%',
              backgroundColor: '#0f172a',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              padding: '10px 14px',
              color: '#f8fafc',
              fontSize: '14px',
              outline: 'none',
            }}
          />
        </div>

        {/* Filter buttons */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setStatusFilter('all')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: statusFilter === 'all' ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
              backgroundColor: statusFilter === 'all' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
              color: statusFilter === 'all' ? '#38bdf8' : '#94a3b8',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Tất cả ({totalCount})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: statusFilter === 'active' ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.1)',
              backgroundColor: statusFilter === 'active' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
              color: statusFilter === 'active' ? '#10b981' : '#94a3b8',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Hoạt động ({activeCount})
          </button>
          <button
            onClick={() => setStatusFilter('inactive')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: statusFilter === 'inactive' ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.1)',
              backgroundColor: statusFilter === 'inactive' ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
              color: statusFilter === 'inactive' ? '#ef4444' : '#94a3b8',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Đang khóa ({inactiveCount})
          </button>
        </div>
      </div>

      {/* Subjects Table */}
      <div
        style={{
          backgroundColor: '#1e293b',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          overflow: 'hidden',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', backgroundColor: '#0f172a' }}>
                <th style={{ padding: '16px 20px', color: '#94a3b8', fontSize: '13px', fontWeight: 600 }}>TÊN MÔN HỌC</th>
                <th style={{ padding: '16px 20px', color: '#94a3b8', fontSize: '13px', fontWeight: 600 }}>MÔ TẢ CHI TIẾT</th>
                <th style={{ padding: '16px 20px', color: '#94a3b8', fontSize: '13px', fontWeight: 600 }}>TRẠNG THÁI</th>
                <th style={{ padding: '16px 20px', color: '#94a3b8', fontSize: '13px', fontWeight: 600, textAlign: 'right' }}>THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                    ⏳ Đang tải danh sách môn học...
                  </td>
                </tr>
              ) : filteredSubjects.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                    Không tìm thấy môn học nào phù hợp với điều kiện tìm kiếm.
                  </td>
                </tr>
              ) : (
                filteredSubjects.map((s) => (
                  <tr
                    key={s.id}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                      transition: 'background-color 0.2s',
                    }}
                  >
                    <td style={{ padding: '16px 20px', fontWeight: 600, color: '#f8fafc' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '18px' }}>📖</span>
                        <span>{s.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px', color: '#cbd5e1', fontSize: '14px', maxWidth: '380px' }}>
                      {s.description || <span style={{ color: '#64748b', fontStyle: 'italic' }}>Chưa có mô tả</span>}
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <span
                        style={{
                          padding: '4px 10px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: 600,
                          backgroundColor: s.isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: s.isActive ? '#34d399' : '#f87171',
                          border: `1px solid ${s.isActive ? '#10b981' : '#ef4444'}`,
                          display: 'inline-block',
                        }}
                      >
                        {s.isActive ? '✅ Đang hoạt động' : '🔒 Đang khóa'}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        {/* Edit Button */}
                        <button
                          onClick={() => handleOpenEditModal(s)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: 'rgba(56, 189, 248, 0.15)',
                            color: '#38bdf8',
                            border: '1px solid #38bdf8',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          ✏️ Sửa
                        </button>

                        {/* Lock / Unlock Button */}
                        <button
                          onClick={() => handleToggleLock(s)}
                          disabled={actionLoadingId === s.id}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: s.isActive ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                            color: s.isActive ? '#f87171' : '#34d399',
                            border: `1px solid ${s.isActive ? '#ef4444' : '#10b981'}`,
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: actionLoadingId === s.id ? 'not-allowed' : 'pointer',
                            opacity: actionLoadingId === s.id ? 0.7 : 1,
                          }}
                        >
                          {actionLoadingId === s.id
                            ? '⏳ Đang xử lý...'
                            : s.isActive
                            ? '🔒 Khóa'
                            : '🔓 Mở Khóa'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
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
        >
          <div
            style={{
              backgroundColor: '#1e293b',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '20px',
              padding: '32px',
              width: '100%',
              maxWidth: '500px',
              color: '#f8fafc',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
                {editingSubject ? '✏️ Chỉnh Sửa Môn Học' : '➕ Thêm Môn Học Mới'}
              </h2>
              <button
                onClick={handleCloseModal}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                ✕
              </button>
            </div>

            {formError && (
              <div
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid #ef4444',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  marginBottom: '20px',
                  color: '#fca5a5',
                  fontSize: '14px',
                }}
              >
                ⚠️ {formError}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#cbd5e1', marginBottom: '8px' }}>
                  Tên Môn Học <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Ví dụ: Toán Cao Cấp, Lập Trình Python, Tiếng Anh Giao Tiếp..."
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    backgroundColor: '#0f172a',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '10px',
                    color: '#f8fafc',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#cbd5e1', marginBottom: '8px' }}>
                  Mô Tả Chi Tiết Môn Học:
                </label>
                <textarea
                  rows={4}
                  value={descriptionInput}
                  onChange={(e) => setDescriptionInput(e.target.value)}
                  placeholder="Mô tả nội dung môn học, lộ trình học tập, đối tượng phù hợp..."
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    backgroundColor: '#0f172a',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '10px',
                    color: '#f8fafc',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  style={{
                    padding: '10px 18px',
                    backgroundColor: '#334155',
                    color: '#cbd5e1',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: modalLoading ? '#475569' : '#0284c7',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: modalLoading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  {modalLoading ? '⏳ Đang lưu...' : '💾 Lưu Môn Học'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONSTRAINT WARNING MODAL (POPUP AT CENTER) */}
      {warningModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '16px',
            animation: 'fadeIn 0.2s ease-out',
          }}
          onClick={() => setWarningModal(null)}
        >
          <div
            style={{
              backgroundColor: '#1e293b',
              border: '2px solid rgba(239, 68, 68, 0.5)',
              borderRadius: '24px',
              padding: '32px',
              width: '100%',
              maxWidth: '520px',
              color: '#f8fafc',
              boxShadow: '0 25px 50px -12px rgba(239, 68, 68, 0.3)',
              textAlign: 'center',
              boxSizing: 'border-box',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: '68px',
                height: '68px',
                borderRadius: '50%',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '2px solid #ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '34px',
                margin: '0 auto 16px auto',
              }}
            >
              🚫
            </div>

            <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#f87171', margin: '0 0 8px 0' }}>
              {warningModal.title}
            </h2>

            {warningModal.subjectName && (
              <div
                style={{
                  display: 'inline-block',
                  padding: '6px 14px',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#38bdf8',
                  marginBottom: '18px',
                }}
              >
                📖 Môn học: {warningModal.subjectName}
              </div>
            )}

            <div
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: '14px',
                padding: '18px',
                color: '#fca5a5',
                fontSize: '14px',
                lineHeight: 1.6,
                textAlign: 'left',
                marginBottom: '24px',
              }}
            >
              ⚠️ {warningModal.message}
            </div>

            <button
              onClick={() => setWarningModal(null)}
              style={{
                width: '100%',
                padding: '13px 24px',
                backgroundColor: '#ef4444',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)',
                transition: 'all 0.2s',
              }}
            >
              Đã hiểu & Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
