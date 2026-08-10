import { api } from '../../../core/api/client';

export interface LearningGoalDto {
  id: string;
  tutorId: string;
  studentId: string;
  subjectId: string;
  title: string;
  description?: string;
  targetDate?: string;
  status: number; // 0=NotStarted, 1=InProgress, 2=Completed, 3=Overdue
  currentProgress: number;
  createdAt: string;
}

export interface ProgressHistoryDto {
  recordedAt: string;
  progressPercentage: number;
}

export interface GoalChartDto {
  goalId: string;
  title: string;
  status: number;
  progressHistory: ProgressHistoryDto[];
}

export interface SessionScoreDto {
  date: string;
  score: number;
}

export interface ProgressChartDto {
  studentId: string;
  subjectId: string;
  subjectName: string;
  goals: GoalChartDto[];
  sessionScores: SessionScoreDto[];
}

export interface CreateLearningGoalRequest {
  studentId: string;
  subjectId: string;
  title: string;
  description?: string;
  targetDate?: string;
}

export interface UpdateLearningGoalRequest {
  title: string;
  description?: string;
  targetDate?: string;
}

export interface RecordGoalProgressRequest {
  progressPercentage: number;
  notes?: string;
}

export interface CreateSessionRecordRequest {
  score: number;
  notes?: string;
}

export const progressService = {
  async getLearningGoals(studentId?: string, subjectId?: string): Promise<LearningGoalDto[]> {
    const res = await api.get<{ data: LearningGoalDto[] }>('/Progress/goals', {
      params: { studentId, subjectId }
    });
    return res.data.data;
  },

  async createLearningGoal(data: CreateLearningGoalRequest): Promise<string> {
    const res = await api.post<{ data: string }>('/Progress/goals', data);
    return res.data.data;
  },

  async updateLearningGoal(id: string, data: UpdateLearningGoalRequest): Promise<boolean> {
    const res = await api.put<{ data: boolean }>(`/Progress/goals/${id}`, data);
    return res.data.data;
  },

  async recordGoalProgress(id: string, data: RecordGoalProgressRequest): Promise<boolean> {
    const res = await api.post<{ data: boolean }>(`/Progress/goals/${id}/record`, data);
    return res.data.data;
  },

  async getProgressChartData(subjectId: string, studentId?: string): Promise<ProgressChartDto> {
    const res = await api.get<{ data: ProgressChartDto }>('/Progress/chart-data', {
      params: { subjectId, studentId }
    });
    return res.data.data;
  },

  async createSessionRecord(bookingId: string, data: CreateSessionRecordRequest): Promise<string> {
    const res = await api.post<{ data: string }>(`/Progress/sessions/${bookingId}`, data);
    return res.data.data;
  }
};
