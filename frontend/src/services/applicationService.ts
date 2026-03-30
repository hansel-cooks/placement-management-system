import api from '@/lib/api';
import type {
  ApiResponse,
  Application,
  ApplicationListResponse,
  ApplicationStatus,
} from '@/types';

export interface ApplicationFilters {
  status?: ApplicationStatus;
  page?: number;
  pageSize?: number;
  sortBy?: 'appliedAt' | 'updatedAt' | 'company';
  sortOrder?: 'asc' | 'desc';
}

export const applicationService = {
  getAll: async (filters: ApplicationFilters = {}): Promise<ApplicationListResponse> => {
    const params = new URLSearchParams();
    if (filters.status) params.set('status', filters.status);
    if (filters.page) params.set('page', String(filters.page));
    if (filters.pageSize) params.set('pageSize', String(filters.pageSize));
    if (filters.sortBy) params.set('sortBy', filters.sortBy);
    if (filters.sortOrder) params.set('sortOrder', filters.sortOrder);

    const res = await api.get<ApiResponse<ApplicationListResponse>>(
      `/student/applications?${params.toString()}`
    );
    return res.data.data;
  },

  getById: async (id: string): Promise<Application> => {
    const res = await api.get<ApiResponse<Application>>(`/student/applications/${id}`);
    return res.data.data;
  },

  withdraw: async (id: string): Promise<void> => {
    await api.patch(`/student/applications/${id}/withdraw`);
  },
};
