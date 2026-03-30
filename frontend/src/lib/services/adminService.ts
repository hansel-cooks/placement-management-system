import api from '../api';

export interface AdminDashboardStats {
  total_students: number;
  placed_students: number;
  unplaced_students: number;
  overall_placement_pct: number | null;
  participating_companies: number;
  total_jobs_posted: number;
  avg_package_lpa: number | null;
  highest_package_lpa: number | null;
  pending_company_approvals: number;
  pending_job_approvals: number;
}

export interface AdminCompany {
  company_id: number;
  company_name: string;
  industry: string | null;
  website: string | null;
  hr_name: string | null;
  hr_email: string;
  hr_phone: string | null;
  is_approved: boolean;
  created_at?: string;
}

export interface AdminJob {
  job_id: number;
  company_id: number;
  company_name: string;
  job_title: string;
  job_type: string;
  location: string;
  ctc_fixed: number;
  ctc_variable: number;
  min_cgpa: number;
  openings: number;
  application_deadline: string | null;
  is_approved: boolean;
  total_applications: number;
  created_at?: string;
}

export interface AdminStudent {
  student_id: number;
  full_name: string;
  email: string;
  phone?: string | null;
  department: string;
  graduation_year: number;
  cgpa: number;
  backlogs?: number;
  is_placed: boolean;
  resume_url?: string | null;
  created_at?: string;
}

const adminService = {
  getDashboard: async (): Promise<AdminDashboardStats> => {
    const res = await api.get('/admin/dashboard');
    return res.data;
  },

  getCompanies: async (params?: { approved?: boolean }): Promise<AdminCompany[]> => {
    const res = await api.get('/admin/companies', { params });
    return res.data;
  },

  approveCompany: async (companyId: number, approve: boolean): Promise<{ message: string }> => {
    const res = await api.put(`/admin/companies/${companyId}/approve`, { approve });
    return res.data;
  },

  getJobs: async (params?: { approved?: boolean }): Promise<AdminJob[]> => {
    const res = await api.get('/admin/jobs', { params });
    return res.data;
  },

  approveJob: async (jobId: number, approve: boolean): Promise<{ message: string }> => {
    const res = await api.put(`/admin/jobs/${jobId}/approve`, { approve });
    return res.data;
  },

  getStudents: async (params?: { department?: string; is_placed?: boolean; cgpa_min?: number }): Promise<AdminStudent[]> => {
    const res = await api.get('/admin/students', { params });
    return res.data;
  },

  getStudent: async (studentId: number) => {
    const res = await api.get(`/admin/students/${studentId}`);
    return res.data;
  },

  getReport: async (reportKey: string) => {
    const res = await api.get(`/admin/reports/${reportKey}`);
    return res.data;
  },
};

export default adminService;

