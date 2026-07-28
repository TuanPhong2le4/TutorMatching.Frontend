import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { progressService, LearningGoalDto, ProgressChartDto } from '../services/progressService';
import { bookingService, BookingDto } from '../services/bookingService';

export const LearningProgressDashboard: React.FC = () => {
  const { user } = useAuth();
  const [goals, setGoals] = useState<LearningGoalDto[]>([]);
  const [chartData, setChartData] = useState<ProgressChartDto | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  
  // Tutor Specific states
  const [students, setStudents] = useState<{ id: string; name: string }[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [mySubjects, setMySubjects] = useState<{ id: string; name: string }[]>([]);
  
  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [isUpdateOpen, setIsUpdateOpen] = useState<boolean>(false);
  const [isRecordOpen, setIsRecordOpen] = useState<boolean>(false);
  const [selectedGoal, setSelectedGoal] = useState<LearningGoalDto | null>(null);
  
  // Form fields
  const [newTitle, setNewTitle] = useState<string>('');
  const [newDescription, setNewDescription] = useState<string>('');
  const [newTargetDate, setNewTargetDate] = useState<string>('');
  const [newSubjectId, setNewSubjectId] = useState<string>('');
  const [newStudentId, setNewStudentId] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [progressNotes, setProgressNotes] = useState<string>('');
  
  const isTutor = Number(user?.role) === 1 || user?.role === 'Tutor';
  const isStudent = Number(user?.role) === 2 || user?.role === 'Student';

  useEffect(() => {
    loadDashboardData();
  }, [selectedStudentId, selectedSubjectId]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch goals
      const goalsList = await progressService.getLearningGoals(
        isTutor ? (selectedStudentId || undefined) : undefined,
        selectedSubjectId || undefined
      );
      setGoals(goalsList || []);

      // If tutor, load active students & subjects from bookings
      if (isTutor && students.length === 0) {
        const bookingsRes = await bookingService.getMyBookings(1, 100);
        const uniqueStudentsMap = new Map<string, string>();
        const uniqueSubjectsMap = new Map<string, string>();
        
        bookingsRes.items?.forEach((b: BookingDto) => {
          if (b.studentId && b.studentName) {
            uniqueStudentsMap.set(b.studentId, b.studentName);
          }
          if (b.subjectId && b.subjectName) {
            uniqueSubjectsMap.set(b.subjectId, b.subjectName);
          }
        });
        
        const loadedStudents = Array.from(uniqueStudentsMap.entries()).map(([id, name]) => ({ id, name }));
        const loadedSubjects = Array.from(uniqueSubjectsMap.entries()).map(([id, name]) => ({ id, name }));
        
        setStudents(loadedStudents);
        setMySubjects(loadedSubjects);
      }

      // If student, build subjects list from goals list if not already
      if (isStudent && selectedSubjectId) {
        const chart = await progressService.getProgressChartData(selectedSubjectId);
        setChartData(chart);
      } else if (isTutor && selectedStudentId && selectedSubjectId) {
        const chart = await progressService.getProgressChartData(selectedSubjectId, selectedStudentId);
        setChartData(chart);
      } else {
        setChartData(null);
      }

    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Extract unique subjects from goals to filter
  const uniqueSubjects = React.useMemo(() => {
    const map = new Map<string, string>();
    goals.forEach(g => {
      // Since LearningGoalDto doesn't have subjectName, we map dynamically if possible, or display IDs,
      // but let's query the subject name or map it.
      // We can also extract subjects from mySubjects if Tutor.
      map.set(g.subjectId, 'Môn học');
    });
    return Array.from(map.keys());
  }, [goals]);

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newStudentId || !newSubjectId) {
      alert('Vui lòng điền đầy đủ các trường bắt buộc.');
      return;
    }
    try {
      await progressService.createLearningGoal({
        studentId: newStudentId,
        subjectId: newSubjectId,
        title: newTitle,
        description: newDescription || undefined,
        targetDate: newTargetDate ? new Date(newTargetDate).toISOString() : undefined
      });
      alert('Tạo mục tiêu học tập mới thành công!');
      setIsCreateOpen(false);
      resetForm();
      loadDashboardData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi tạo mục tiêu học tập.');
    }
  };

  const handleUpdateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal || !newTitle) return;
    try {
      await progressService.updateLearningGoal(selectedGoal.id, {
        title: newTitle,
        description: newDescription || undefined,
        targetDate: newTargetDate ? new Date(newTargetDate).toISOString() : undefined
      });
      alert('Cập nhật mục tiêu thành công!');
      setIsUpdateOpen(false);
      setSelectedGoal(null);
      resetForm();
      loadDashboardData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi cập nhật mục tiêu.');
    }
  };

  const handleRecordProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal) return;
    try {
      await progressService.recordGoalProgress(selectedGoal.id, {
        progressPercentage: progressPercent,
        notes: progressNotes || undefined
      });
      alert('Cập nhật tiến trình mục tiêu thành công!');
      setIsRecordOpen(false);
      setSelectedGoal(null);
      setProgressPercent(0);
      setProgressNotes('');
      loadDashboardData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi cập nhật tiến độ.');
    }
  };

  const openCreateModal = () => {
    resetForm();
    if (students.length > 0) setNewStudentId(students[0].id);
    if (mySubjects.length > 0) setNewSubjectId(mySubjects[0].id);
    setIsCreateOpen(true);
  };

  const openUpdateModal = (goal: LearningGoalDto) => {
    setSelectedGoal(goal);
    setNewTitle(goal.title);
    setNewDescription(goal.description || '');
    setNewTargetDate(goal.targetDate ? goal.targetDate.substring(0, 10) : '');
    setIsUpdateOpen(true);
  };

  const openRecordModal = (goal: LearningGoalDto) => {
    setSelectedGoal(goal);
    setProgressPercent(goal.currentProgress);
    setProgressNotes('');
    setIsRecordOpen(true);
  };

  const resetForm = () => {
    setNewTitle('');
    setNewDescription('');
    setNewTargetDate('');
    setNewSubjectId('');
    setNewStudentId('');
  };

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 0:
        return <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, color: '#94a3b8', backgroundColor: 'rgba(148, 163, 184, 0.15)' }}>Chưa bắt đầu</span>;
      case 1:
        return <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, color: '#38bdf8', backgroundColor: 'rgba(56, 189, 248, 0.15)' }}>Đang thực hiện</span>;
      case 2:
        return <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, color: '#34d399', backgroundColor: 'rgba(52, 211, 153, 0.15)' }}>Hoàn thành</span>;
      case 3:
        return <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, color: '#f87171', backgroundColor: 'rgba(248, 113, 113, 0.15)' }}>Quá hạn</span>;
      default:
        return null;
    }
  };

  // Premium SVG Chart Renderer
  const renderSVGChart = () => {
    if (!chartData || (!chartData.goals.length && !chartData.sessionScores.length)) {
      return (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
          📊 Chưa có lịch sử tiến trình hoặc điểm số của môn học này để hiển thị biểu đồ xu hướng.
        </div>
      );
    }

    // Extract chart points from goal progress histories
    // We aggregate all progress updates to draw a progression curve
    const points: { x: number; y: number; date: string; value: number; label: string }[] = [];

    // Process goal progress history
    chartData.goals.forEach(g => {
      g.progressHistory.forEach(h => {
        points.push({
          x: 0,
          y: 0,
          date: h.recordedAt,
          value: h.progressPercentage,
          label: `Mục tiêu "${g.title}": ${h.progressPercentage}%`
        });
      });
    });

    // Process session scores (mapped to 0-100 scale, e.g. score * 10 if on scale of 10)
    chartData.sessionScores.forEach(s => {
      points.push({
        x: 0,
        y: 0,
        date: s.date,
        value: Number(s.score) * 10, // scale to percentage
        label: `Điểm kiểm tra: ${s.score}/10`
      });
    });

    if (points.length === 0) {
      return <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>Chưa có dữ liệu đồ thị.</div>;
    }

    // Sort points by date ascending
    points.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Map to coordinates (SVG Viewbox: 0 0 500 200)
    const paddingLeft = 40;
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 30;
    const width = 500;
    const height = 200;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    const timestamps = points.map(p => new Date(p.date).getTime());
    const minTime = Math.min(...timestamps);
    const maxTime = Math.max(...timestamps);
    const timeDiff = maxTime - minTime || 1;

    points.forEach(p => {
      const timeRatio = (new Date(p.date).getTime() - minTime) / timeDiff;
      const valRatio = p.value / 100;

      p.x = paddingLeft + timeRatio * chartWidth;
      p.y = paddingTop + (1 - valRatio) * chartHeight;
    });

    // Polyline points string
    const polylinePoints = points.map(p => `${p.x},${p.y}`).join(' ');

    // Area fill path string
    const areaPath = points.length > 0 
      ? `M ${points[0].x} ${paddingTop + chartHeight} ` + points.map(p => `L ${p.x} ${p.y}`).join(' ') + ` L ${points[points.length - 1].x} ${paddingTop + chartHeight} Z`
      : '';

    return (
      <div>
        <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: '#38bdf8', marginBottom: '12px' }}>
          📈 Đồ Thị Xu Hướng Học Tập ({chartData.subjectName})
        </h4>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', maxHeight: '240px', background: 'rgba(15,23,42,0.3)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <defs>
            <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c084fc" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map(val => {
            const ratio = val / 100;
            const y = paddingTop + (1 - ratio) * chartHeight;
            return (
              <g key={val}>
                <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="rgba(255,255,255,0.06)" strokeDasharray="3" />
                <text x={paddingLeft - 8} y={y + 4} fill="#64748b" fontSize="10" textAnchor="end">{val}%</text>
              </g>
            );
          })}

          {/* Draw filled area */}
          {points.length > 0 && (
            <path d={areaPath} fill="url(#chartGrad)" />
          )}

          {/* Draw path line */}
          {points.length > 0 && (
            <polyline fill="none" stroke="url(#chartGrad)" strokeWidth="2.5" points={polylinePoints} />
          )}

          {/* Draw points */}
          {points.map((p, idx) => (
            <g key={idx}>
              <circle cx={p.x} cy={p.y} r="4" fill="#a855f7" stroke="#fff" strokeWidth="1.5" />
              <title>{`${p.label}\nNgày: ${new Date(p.date).toLocaleDateString('vi-VN')}`}</title>
            </g>
          ))}
        </svg>
      </div>
    );
  };

  return (
    <div>
      {/* Upper Filter & Navigation block */}
      <div
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
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          {/* Tutor filters student */}
          {isTutor && (
            <div>
              <label style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                Học Viên:
              </label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
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
                <option value="">-- Tất cả học viên --</option>
                {students.map(st => (
                  <option key={st.id} value={st.id}>{st.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Subject selector to view visual charts */}
          <div>
            <label style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
              Môn Học:
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
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
              <option value="">-- Tất cả môn học --</option>
              {isTutor 
                ? mySubjects.map(sub => <option key={sub.id} value={sub.id}>{sub.name}</option>)
                : uniqueSubjects.map(subId => <option key={subId} value={subId}>Môn học của tôi</option>)
              }
            </select>
          </div>
        </div>

        {isTutor && (
          <button
            onClick={openCreateModal}
            className="btn-primary"
            style={{
              padding: '10px 20px',
              fontSize: '13px',
              fontWeight: 'bold',
            }}
          >
            🎯 Tạo Mục Tiêu Học Tập
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', alignItems: 'start' }}>
        {/* Goals List Panel */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '20px', color: '#fff' }}>
            🎯 Mục Tiêu Đang Theo Dõi ({goals.length})
          </h3>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>Đang tải mục tiêu...</div>
          ) : goals.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>🎯</div>
              <h4 style={{ color: '#fff', fontSize: '15px', marginBottom: '6px' }}>Chưa có mục tiêu học tập</h4>
              <p style={{ fontSize: '13px' }}>
                {isTutor ? 'Hãy thêm mục tiêu đầu tiên cho học viên của bạn để bắt đầu theo dõi.' : 'Gia sư của bạn chưa tạo mục tiêu học tập nào.'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {goals.map(g => {
                const targetText = g.targetDate ? new Date(g.targetDate).toLocaleDateString('vi-VN') : 'Không thời hạn';
                return (
                  <div
                    key={g.id}
                    style={{
                      padding: '16px',
                      borderRadius: '16px',
                      backgroundColor: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <div>
                        <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#fff', margin: '0 0 4px' }}>
                          {g.title}
                        </h4>
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>Hạn chót: {targetText}</span>
                      </div>
                      {getStatusBadge(g.status)}
                    </div>

                    {g.description && (
                      <p style={{ fontSize: '13px', color: '#cbd5e1', marginBottom: '16px', lineHeight: 1.4 }}>
                        {g.description}
                      </p>
                    )}

                    {/* Progress Bar */}
                    <div style={{ marginBottom: isTutor ? '16px' : '0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>
                        <span>Tiến trình:</span>
                        <strong style={{ color: '#c084fc' }}>{g.currentProgress}%</strong>
                      </div>
                      <div style={{ height: '8px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${g.currentProgress}%`,
                            background: 'linear-gradient(90deg, #38bdf8, #a855f7)',
                            borderRadius: '4px',
                            transition: 'width 0.4s ease',
                          }}
                        />
                      </div>
                    </div>

                    {isTutor && (
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '12px' }}>
                        <button
                          onClick={() => openUpdateModal(g)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: '1px solid rgba(255,255,255,0.15)',
                            backgroundColor: 'transparent',
                            color: '#94a3b8',
                            fontSize: '12px',
                            cursor: 'pointer',
                          }}
                        >
                          ✏️ Sửa
                        </button>
                        <button
                          onClick={() => openRecordModal(g)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: 'none',
                            backgroundColor: '#38bdf8',
                            color: '#0f172a',
                            fontWeight: 600,
                            fontSize: '12px',
                            cursor: 'pointer',
                          }}
                        >
                          📈 Cập Nhật
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Visual Chart Panel */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '20px', color: '#fff' }}>
            📊 Biểu Đồ Xu Hướng Học Tập
          </h3>
          {selectedSubjectId ? (
            renderSVGChart()
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
              Select a Subject from the dropdown at the top to load visual metrics and score charts.
            </div>
          )}
        </div>
      </div>

      {/* CREATE GOAL MODAL */}
      {isCreateOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '16px',
          }}
          onClick={() => setIsCreateOpen(false)}
        >
          <div
            className="glass-panel"
            style={{ width: '100%', maxWidth: '480px', padding: '32px', borderRadius: '24px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '20px' }} className="gradient-text">
              🎯 Tạo Mục Tiêu Học Tập Mới
            </h3>
            <form onSubmit={handleCreateGoal}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px', fontWeight: 600 }}>
                  Chọn Học Viên: *
                </label>
                <select
                  value={newStudentId}
                  onChange={(e) => setNewStudentId(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(15,23,42,0.6)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#fff',
                  }}
                >
                  <option value="">-- Chọn học viên --</option>
                  {students.map(st => (
                    <option key={st.id} value={st.id}>{st.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px', fontWeight: 600 }}>
                  Môn Học: *
                </label>
                <select
                  value={newSubjectId}
                  onChange={(e) => setNewSubjectId(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(15,23,42,0.6)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#fff',
                  }}
                >
                  <option value="">-- Chọn môn học --</option>
                  {mySubjects.map(sub => (
                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px', fontWeight: 600 }}>
                  Tiêu Đề Mục Tiêu: *
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  placeholder="Ví dụ: Ôn tập lấy điểm 8 môn Toán"
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(15,23,42,0.6)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#fff',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px', fontWeight: 600 }}>
                  Mô Tả Chi Tiết:
                </label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={3}
                  placeholder="Mô tả cụ thể kế hoạch, đề cương ôn tập..."
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(15,23,42,0.6)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#fff',
                    outline: 'none',
                    resize: 'none',
                  }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px', fontWeight: 600 }}>
                  Hạn Chót (Target Date):
                </label>
                <input
                  type="date"
                  value={newTargetDate}
                  onChange={(e) => setNewTargetDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(15,23,42,0.6)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#fff',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,0.15)',
                    backgroundColor: 'transparent',
                    color: '#94a3b8',
                    cursor: 'pointer',
                  }}
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ flex: 2, padding: '10px', borderRadius: '10px', cursor: 'pointer' }}
                >
                  Tạo Mục Tiêu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPDATE GOAL DETAILS MODAL */}
      {isUpdateOpen && selectedGoal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '16px',
          }}
          onClick={() => setIsUpdateOpen(false)}
        >
          <div
            className="glass-panel"
            style={{ width: '100%', maxWidth: '480px', padding: '32px', borderRadius: '24px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '20px' }} className="gradient-text">
              ✏️ Chỉnh Sửa Mục Tiêu Học Tập
            </h3>
            <form onSubmit={handleUpdateGoal}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px', fontWeight: 600 }}>
                  Tiêu Đề Mục Tiêu: *
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(15,23,42,0.6)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#fff',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px', fontWeight: 600 }}>
                  Mô Tả Chi Tiết:
                </label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(15,23,42,0.6)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#fff',
                    outline: 'none',
                    resize: 'none',
                  }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px', fontWeight: 600 }}>
                  Hạn Chót (Target Date):
                </label>
                <input
                  type="date"
                  value={newTargetDate}
                  onChange={(e) => setNewTargetDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(15,23,42,0.6)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#fff',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setIsUpdateOpen(false)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,0.15)',
                    backgroundColor: 'transparent',
                    color: '#94a3b8',
                    cursor: 'pointer',
                  }}
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ flex: 2, padding: '10px', borderRadius: '10px', cursor: 'pointer' }}
                >
                  Cập Nhật
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECORD PROGRESS MODAL */}
      {isRecordOpen && selectedGoal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '16px',
          }}
          onClick={() => setIsRecordOpen(false)}
        >
          <div
            className="glass-panel"
            style={{ width: '100%', maxWidth: '440px', padding: '32px', borderRadius: '24px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '20px' }} className="gradient-text">
              📈 Cập Nhật Tiến Độ Mục Tiêu
            </h3>
            <form onSubmit={handleRecordProgress}>
              <div style={{ marginBottom: '16px', backgroundColor: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '10px' }}>
                <span style={{ fontSize: '12px', color: '#94a3b8', display: 'block' }}>Mục tiêu:</span>
                <strong style={{ fontSize: '14px', color: '#fff' }}>{selectedGoal.title}</strong>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px', fontWeight: 600 }}>
                  Tiến Độ Đạt Được (%): *
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={progressPercent}
                  onChange={(e) => setProgressPercent(Number(e.target.value))}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(15,23,42,0.6)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#fff',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px', fontWeight: 600 }}>
                  Ghi Chú Tiến Độ:
                </label>
                <textarea
                  value={progressNotes}
                  onChange={(e) => setProgressNotes(e.target.value)}
                  rows={3}
                  placeholder="Ghi nhận cụ thể, kết quả kiểm tra hoặc các bài tập đã hoàn tất..."
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(15,23,42,0.6)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#fff',
                    outline: 'none',
                    resize: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setIsRecordOpen(false)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,0.15)',
                    backgroundColor: 'transparent',
                    color: '#94a3b8',
                    cursor: 'pointer',
                  }}
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ flex: 2, padding: '10px', borderRadius: '10px', cursor: 'pointer' }}
                >
                  Cập Nhật Tiến Độ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
