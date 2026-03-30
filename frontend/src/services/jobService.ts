import api from '@/lib/api';
import type { ApiResponse, Job, JobListResponse, JobType, WorkMode, ExperienceLevel } from '@/types';

export interface JobFilters {
  search?: string;
  jobType?: JobType;
  workMode?: WorkMode;
  experienceLevel?: ExperienceLevel;
  location?: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'postedAt' | 'deadline' | 'salary';
  sortOrder?: 'asc' | 'desc';
}

export const jobService = {
  getAll: async (filters: JobFilters = {}): Promise<JobListResponse> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.set(key, String(value));
      }
    });
    const res = await api.get<ApiResponse<JobListResponse>>(`/jobs?${params.toString()}`);
    return res.data.data;
  },

  getById: async (id: string): Promise<Job> => {
    const res = await api.get<ApiResponse<Job>>(`/jobs/${id}`);
    return res.data.data;
  },

  apply: async (jobId: string): Promise<{ applicationId: string }> => {
    const res = await api.post<ApiResponse<{ applicationId: string }>>(`/jobs/${jobId}/apply`);
    return res.data.data;
  },

  bookmark: async (jobId: string): Promise<void> => {
    await api.post(`/jobs/${jobId}/bookmark`);
  },

  removeBookmark: async (jobId: string): Promise<void> => {
    await api.delete(`/jobs/${jobId}/bookmark`);
  },
};
