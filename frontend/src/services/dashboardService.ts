import api from '@/lib/api';
import type { ApiResponse, DashboardMetrics, PipelineStage, Application, Job } from '@/types';

// ── Dashboard ──────────────────────────────────
export const dashboardService = {
  getMetrics: async (): Promise<DashboardMetrics> => {
    const res = await api.get<ApiResponse<DashboardMetrics>>('/student/dashboard/metrics');
    return res.data.data;
  },

  getPipeline: async (): Promise<PipelineStage[]> => {
    const res = await api.get<ApiResponse<PipelineStage[]>>('/student/dashboard/pipeline');
    return res.data.data;
  },

  getRecentApplications: async (limit = 5): Promise<Application[]> => {
    const res = await api.get<ApiResponse<Application[]>>(
      `/student/dashboard/recent-applications?limit=${limit}`
    );
    return res.data.data;
  },

  getRecommendedJobs: async (limit = 4): Promise<Job[]> => {
    const res = await api.get<ApiResponse<Job[]>>(
      `/student/dashboard/recommended-jobs?limit=${limit}`
    );
    return res.data.data;
  },
};
