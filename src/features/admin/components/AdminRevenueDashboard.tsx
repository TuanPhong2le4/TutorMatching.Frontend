import React, { useState, useEffect } from 'react';
import { adminUserService, AdminRevenueReportDto } from '../services/adminUserService';

export const AdminRevenueDashboard: React.FC = () => {
  const [report, setReport] = useState<AdminRevenueReportDto | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Filter states
  const [selectedYear, setSelectedYear] = useState<number | undefined>(new Date().getFullYear());
  const [filterType, setFilterType] = useState<string>('month');
  const [sortBy, setSortBy] = useState<string>('date_asc');

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await adminUserService.getRevenueReport({
        year: selectedYear,
        filterType,
        sortBy
      });
      setReport(res);
    } catch (err) {
      console.error('Failed to fetch revenue report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [selectedYear, filterType, sortBy]);

  // Format currency
  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount * 1000);
  };

  // Render Chart
  const renderChart = () => {
    if (!report || report.periods.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
          📊 Không có dữ liệu doanh thu phù hợp để hiển thị biểu đồ.
        </div>
      );
    }

    const data = report.periods;
    const maxVal = Math.max(...data.map(p => Number(p.revenue)), 1);

    const svgWidth = 700;
    const svgHeight = 320;
    const paddingLeft = 110; // Extra padding for large VND text
    const paddingBottom = 50;
    const paddingTop = 30;
    const paddingRight = 30;

    const chartWidth = svgWidth - paddingLeft - paddingRight;
    const chartHeight = svgHeight - paddingTop - paddingBottom;

    const barCount = data.length;
    const spacing = 15;
    const barWidth = (chartWidth - (spacing * (barCount + 1))) / barCount;

    return (
      <div style={{ width: '100%', overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ width: '100%', minWidth: '600px', height: 'auto' }}>
          <defs>
            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#0369a1" />
            </linearGradient>
          </defs>

          {/* Grid lines and Y axis labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
            const y = paddingTop + (1 - ratio) * chartHeight;
            const val = maxVal * ratio;
            return (
              <g key={index}>
                <line x1={paddingLeft} y1={y} x2={svgWidth - paddingRight} y2={y} stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
                <text x={paddingLeft - 12} y={y + 4} fill="#94a3b8" fontSize="10" fontWeight="500" textAnchor="end">
                  {formatVND(val)}
                </text>
              </g>
            );
          })}

          {/* Render Bars */}
          {data.map((p, idx) => {
            const barHeight = (Number(p.revenue) / maxVal) * chartHeight;
            const x = paddingLeft + spacing + idx * (barWidth + spacing);
            const y = paddingTop + chartHeight - barHeight;

            return (
              <g key={idx}>
                {/* Bar */}
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={Math.max(barHeight, 2)}
                  rx="4"
                  fill="url(#barGradient)"
                  style={{ transition: 'all 0.3s' }}
                />
                
                {/* Value on top of bar */}
                {barHeight > 15 && (
                  <text x={x + barWidth / 2} y={y - 8} fill="#fff" fontSize="9" fontWeight="700" textAnchor="middle">
                    {p.revenue >= 1000 ? `${(p.revenue / 1000).toFixed(1)}M` : `${p.revenue}cr`}
                  </text>
                )}

                {/* X axis labels */}
                <text
                  x={x + barWidth / 2}
                  y={paddingTop + chartHeight + 20}
                  fill="#cbd5e1"
                  fontSize="10"
                  fontWeight="600"
                  textAnchor="middle"
                  transform={`rotate(-15, ${x + barWidth / 2}, ${paddingTop + chartHeight + 20})`}
                >
                  {p.periodName}
                </text>
              </g>
            );
          })}

          {/* X Axis Line */}
          <line
            x1={paddingLeft}
            y1={paddingTop + chartHeight}
            x2={svgWidth - paddingRight}
            y2={paddingTop + chartHeight}
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="1.5"
          />
        </svg>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Page Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#fff', margin: '0 0 6px 0' }}>
            📈 Báo Cáo Doanh Thu
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>
            Quản lý, phân tích doanh thu từ các giao dịch nạp tiền trên hệ thống.
          </p>
        </div>
      </div>

      {/* Filter and sorting controls */}
      <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 600 }}>Năm lọc</label>
          <select
            value={selectedYear || ''}
            onChange={(e) => setSelectedYear(e.target.value ? Number(e.target.value) : undefined)}
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '8px 12px',
              color: '#fff',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="">Tất cả các năm</option>
            <option value="2026">Năm 2026</option>
            <option value="2025">Năm 2025</option>
            <option value="2024">Năm 2024</option>
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 600 }}>Xem theo kỳ</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '8px 12px',
              color: '#fff',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="month">Xem theo Tháng</option>
            <option value="quarter">Xem theo Quý (6 tháng / quý)</option>
            <option value="year">Xem theo Năm</option>
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 600 }}>Sắp xếp dữ liệu</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '8px 12px',
              color: '#fff',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="date_asc">Thời gian: Tăng dần</option>
            <option value="date_desc">Thời gian: Giảm dần</option>
            <option value="revenue_asc">Doanh thu: Tăng dần</option>
            <option value="revenue_desc">Doanh thu: Giảm dần</option>
          </select>
        </div>
      </div>

      {/* Stat Cards */}
      {report && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
          <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', borderLeft: '4px solid #38bdf8' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8' }}>💰 TỔNG DOANH THU</span>
            <h3 style={{ fontSize: '24px', fontWeight: 800, color: '#fff', margin: '8px 0 0 0' }}>
              {formatVND(report.totalRevenue)}
            </h3>
          </div>

          <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', borderLeft: '4px solid #10b981' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8' }}>📈 SỐ LƯỢT GIAO DỊCH</span>
            <h3 style={{ fontSize: '24px', fontWeight: 800, color: '#fff', margin: '8px 0 0 0' }}>
              {report.periods.reduce((sum, p) => sum + p.transactionCount, 0)} giao dịch
            </h3>
          </div>

          <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', borderLeft: '4px solid #a855f7' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8' }}>📊 DOANH THU TRUNG BÌNH KỲ</span>
            <h3 style={{ fontSize: '24px', fontWeight: 800, color: '#fff', margin: '8px 0 0 0' }}>
              {formatVND(report.periods.length > 0 ? report.totalRevenue / report.periods.length : 0)}
            </h3>
          </div>
        </div>
      )}

      {/* Visual Chart Panel */}
      <div className="glass-panel" style={{ padding: '28px', borderRadius: '20px' }}>
        <h4 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '24px', color: '#fff' }}>
          📊 Biểu Đồ Doanh Thu ({filterType === 'month' ? 'Từng Tháng' : filterType === 'quarter' ? 'Từng Quý' : 'Từng Năm'})
        </h4>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
            ⏳ Đang tải biểu đồ dữ liệu doanh thu...
          </div>
        ) : (
          renderChart()
        )}
      </div>

      {/* Details Table */}
      <div className="glass-panel" style={{ padding: '28px', borderRadius: '20px', overflowX: 'auto' }}>
        <h4 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px', color: '#fff' }}>
          📋 Bảng Chi Tiết Doanh Thu
        </h4>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
            Đang tải dữ liệu...
          </div>
        ) : !report || report.periods.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
            Không có dữ liệu hiển thị.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '500px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <th style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '13px', fontWeight: 600 }}>KỲ</th>
                <th style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '13px', fontWeight: 600 }}>SỐ LƯỢT GIAO DỊCH</th>
                <th style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '13px', fontWeight: 600 }}>DOANH THU (TÍN DỤNG)</th>
                <th style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '13px', fontWeight: 600 }}>QUY ĐỔI DOANH THU (VNĐ)</th>
              </tr>
            </thead>
            <tbody>
              {report.periods.map((p, index) => (
                <tr key={index} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '16px', color: '#fff', fontSize: '14px', fontWeight: 600 }}>{p.periodName}</td>
                  <td style={{ padding: '16px', color: '#cbd5e1', fontSize: '14px' }}>{p.transactionCount} lượt</td>
                  <td style={{ padding: '16px', color: '#38bdf8', fontSize: '14px', fontWeight: 600 }}>{p.revenue} cr</td>
                  <td style={{ padding: '16px', color: '#10b981', fontSize: '14px', fontWeight: 600 }}>{formatVND(p.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
