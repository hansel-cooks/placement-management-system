import api from '../api';

export interface StudentDashboardStats {
  total_applied: number;
  shortlisted: number;
  interviews_scheduled: number;
  selected: number;
  rejected: number;
  offers_accepted: number;
}

export interface JobListing {
  id: string;
  company: string;
  industry: string;
  title: string;
  location: string;
  type: string;
  salary: string;
  skills: string[];
  cgpa_cutoff: number;
  applicants_count: number;
  posted_at: string;
  deadline: string;
  openings: number;
  description?: string;
  apply_status?: string | null;
}

export interface Application {
  application_id: number;
  status: string;
  applied_at: string;
  job_title: string;
  location: string;
  job_type: string;
  total_ctc: number;
  company_name: string;
}

const studentService = {
  getDashboardStats: async (): Promise<StudentDashboardStats> => {
    const response = await api.get('/student/dashboard');
    return response.data;
  },

  getEligibleJobs: async (params?: { search?: string, roles?: string, minCgpa?: number, sort?: string }): Promise<JobListing[]> => {
    const response = await api.get('/student/jobs/search', { params });
    return response.data;
  },

  applyJob: async (jobId: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.post('/student/jobs/apply', { job_id: parseInt(jobId, 10) });
    return response.data;
  },

  getApplications: async (): Promise<Application[]> => {
    const response = await api.get('/student/applications');
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/student/profile');
    return response.data;
  },
};

export default studentService;
