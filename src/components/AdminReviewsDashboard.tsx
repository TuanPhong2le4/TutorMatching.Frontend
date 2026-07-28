import React, { useState, useEffect } from 'react';
import { reviewService, AdminReviewDto } from '../services/reviewService';

export const AdminReviewsDashboard: React.FC = () => {
  const [reviews, setReviews] = useState<AdminReviewDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  
  // Filter states
  const [search, setSearch] = useState<string>('');
  const [reviewType, setReviewType] = useState<string>('');
  const [rating, setRating] = useState<string>('');

  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchReviews();
  }, [page, reviewType, rating]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const typeNum = reviewType !== '' ? Number(reviewType) : undefined;
      const ratingNum = rating !== '' ? Number(rating) : undefined;
      
      const res = await reviewService.getAllReviews(
        page,
        15,
        search || undefined,
        typeNum,
        ratingNum
      );
      setReviews(res.items || []);
      setTotalCount(res.totalCount || 0);
      setTotalPages(Math.ceil((res.totalCount || 0) / 15));
    } catch (err) {
      console.error('Failed to fetch admin reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchReviews();
  };

  const handleDeleteReview = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn XÓA đánh giá này khỏi hệ thống? Hành động này không thể hoàn tác.')) return;
    try {
      setDeletingId(id);
      await reviewService.deleteReview(id);
      alert('Đã xóa đánh giá thành công.');
      fetchReviews();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi xóa đánh giá.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '4px' }}>
          👑 Quản Lý Đánh Giá Hệ Thống
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '15px' }}>
          Xem và quản lý tất cả các đánh giá giữa Học viên và Gia sư trên nền tảng.
        </p>
      </div>

      {/* Filters Form */}
      <form
        onSubmit={handleSearchSubmit}
        className="glass-panel"
        style={{
          padding: '20px 24px',
          borderRadius: '16px',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', flex: 1 }}>
          {/* Search text */}
          <div style={{ minWidth: '220px', flex: 1 }}>
            <label style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
              Tìm kiếm (Tên/Nhận xét):
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nhập tên người dùng hoặc từ khóa..."
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                backgroundColor: 'rgba(15,23,42,0.6)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#fff',
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>

          {/* Review Type */}
          <div>
            <label style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
              Chiều Đánh Giá:
            </label>
            <select
              value={reviewType}
              onChange={(e) => { setReviewType(e.target.value); setPage(1); }}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                backgroundColor: 'rgba(15,23,42,0.6)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#fff',
                fontSize: '14px',
                outline: 'none',
              }}
            >
              <option value="">Tất cả</option>
              <option value="0">Học viên → Gia sư</option>
              <option value="1">Gia sư → Học viên</option>
            </select>
          </div>

          {/* Rating filter */}
          <div>
            <label style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
              Số Sao:
            </label>
            <select
              value={rating}
              onChange={(e) => { setRating(e.target.value); setPage(1); }}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                backgroundColor: 'rgba(15,23,42,0.6)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#fff',
                fontSize: '14px',
                outline: 'none',
              }}
            >
              <option value="">Tất cả</option>
              {[5, 4, 3, 2, 1].map(num => (
                <option key={num} value={num.toString()}>{num} Sao</option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          className="btn-primary"
          style={{
            padding: '10px 24px',
            fontSize: '14px',
            fontWeight: 'bold',
            height: '40px',
            marginTop: '20px',
          }}
        >
          🔍 Tìm Kiếm
        </button>
      </form>

      {/* Reviews Table container */}
      <div className="glass-panel" style={{ padding: '28px', borderRadius: '20px' }}>
        <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '20px', color: '#fff' }}>
          📋 Danh Sách Nhận Xét Đánh Giá ({totalCount})
        </h3>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>Đang tải danh sách đánh giá...</div>
        ) : reviews.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>💬</div>
            <h4 style={{ color: '#fff', fontSize: '16px', marginBottom: '6px' }}>Không Có Đánh Giá Nào</h4>
            <p style={{ fontSize: '13px', maxWidth: '360px', margin: '0 auto' }}>
              Chưa có dữ liệu nhận xét đánh giá nào thỏa mãn điều kiện tìm kiếm.
            </p>
          </div>
        ) : (
          <div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <th style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '13px', fontWeight: 600 }}>CHIỀU ĐÁNH GIÁ</th>
                    <th style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '13px', fontWeight: 600 }}>NGƯỜI ĐÁNH GIÁ</th>
                    <th style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '13px', fontWeight: 600 }}>ĐỐI TƯỢNG NHẬN</th>
                    <th style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '13px', fontWeight: 600 }}>MÔN HỌC</th>
                    <th style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '13px', fontWeight: 600 }}>ĐÁNH GIÁ</th>
                    <th style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '13px', fontWeight: 600 }}>NHẬN XÉT CHI TIẾT</th>
                    <th style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '13px', fontWeight: 600 }}>THỜI GIAN</th>
                    <th style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '13px', fontWeight: 600 }}>THAO TÁC</th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.map((rev) => {
                    const formattedDate = new Date(rev.createdAt).toLocaleString('vi-VN');
                    const isStudentToTutor = rev.reviewType === 0;

                    return (
                      <tr key={rev.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '14px' }}>
                        <td style={{ padding: '16px' }}>
                          <span
                            style={{
                              padding: '4px 10px',
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontWeight: 600,
                              color: isStudentToTutor ? '#38bdf8' : '#a855f7',
                              backgroundColor: isStudentToTutor ? 'rgba(56, 189, 248, 0.15)' : 'rgba(168, 85, 247, 0.15)',
                            }}
                          >
                            {isStudentToTutor ? '🎓 Học Viên → Gia Sư' : '👨‍🏫 Gia Sư → Học Viên'}
                          </span>
                        </td>
                        <td style={{ padding: '16px', fontWeight: 600, color: '#fff' }}>
                          {rev.reviewerName}
                        </td>
                        <td style={{ padding: '16px', fontWeight: 600, color: '#cbd5e1' }}>
                          {rev.revieweeName}
                        </td>
                        <td style={{ padding: '16px', color: '#38bdf8', fontSize: '13px', fontWeight: 600 }}>
                          {rev.subjectName}
                        </td>
                        <td style={{ padding: '16px', fontWeight: 700, color: '#fbbf24', fontSize: '15px' }}>
                          {'⭐'.repeat(rev.rating)}
                        </td>
                        <td style={{ padding: '16px', color: '#e2e8f0', maxWidth: '300px', wordWrap: 'break-word', whiteSpace: 'normal', lineHeight: 1.4 }}>
                          {rev.comment || <span style={{ color: '#64748b', fontStyle: 'italic' }}>Không có nhận xét viết tay</span>}
                        </td>
                        <td style={{ padding: '16px', color: '#94a3b8', fontSize: '12px' }}>
                          {formattedDate}
                        </td>
                        <td style={{ padding: '16px' }}>
                          <button
                            disabled={deletingId === rev.id}
                            onClick={() => handleDeleteReview(rev.id)}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: 'rgba(239, 68, 68, 0.15)',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              color: '#f87171',
                              borderRadius: '6px',
                              fontSize: '12px',
                              cursor: 'pointer',
                              fontWeight: 600,
                            }}
                          >
                            {deletingId === rev.id ? 'Đang xóa...' : '🗑️ Xóa'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px' }}>
                <button
                  disabled={page === 1}
                  onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid rgba(255,255,255,0.15)',
                    backgroundColor: 'rgba(15,23,42,0.6)',
                    color: page === 1 ? '#64748b' : '#fff',
                    cursor: page === 1 ? 'not-allowed' : 'pointer',
                    fontSize: '13px',
                  }}
                >
                  Trước
                </button>
                <span style={{ display: 'flex', alignItems: 'center', padding: '0 8px', fontSize: '13px', color: '#94a3b8' }}>
                  Trang {page} / {totalPages}
                </span>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid rgba(255,255,255,0.15)',
                    backgroundColor: 'rgba(15,23,42,0.6)',
                    color: page === totalPages ? '#64748b' : '#fff',
                    cursor: page === totalPages ? 'not-allowed' : 'pointer',
                    fontSize: '13px',
                  }}
                >
                  Sau
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
