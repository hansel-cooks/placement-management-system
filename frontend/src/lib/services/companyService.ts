import api from '../api';

export interface CompanyDashboardStats {
  active_jobs: number;
  total_applications: number;
  interviews_scheduled: number;
  offers_made: number;
}

export interface CompanyJobListing {
  job_id: number;
  job_title: string;
  job_type: string;
  location: string;
  total_ctc: number;
  openings: number;
  application_deadline: string;
  applicants_count: number;
  status: 'Open' | 'Closed';
}

export interface CompanyApplicant {
  application_id: number;
  student_id: number;
  student_name: string;
  email: string;
  cgpa: number;
  department: string;
  resume_url: string;
  status: 'Pending' | 'Shortlisted' | 'Rejected' | 'Interview Scheduled' | 'Offer Made';
  applied_at: string;
}

export interface NewJobPayload {
  job_title: string;
  job_description: string;
  industry: string;
  job_type: 'Full-Time' | 'Internship' | 'Contract';
  location: string;
  total_ctc: number;
  min_cgpa: number;
  openings: number;
  application_deadline: string;
  requirements?: string;
}

const companyService = {
  getDashboardStats: async (): Promise<CompanyDashboardStats> => {
    const response = await api.get('/company/dashboard');
    return response.data;
  },

  getJobs: async (): Promise<CompanyJobListing[]> => {
    const response = await api.get('/company/jobs');
    const jobs = response.data as any[];
    return jobs.map((j) => {
      const totalCtc = Number(j.ctc_fixed || 0) + Number(j.ctc_variable || 0);
      const applicationDeadline = j.application_deadline
        ? String(j.application_deadline).slice(0, 10)
        : '';
      const isOpen = !j.application_deadline || new Date(applicationDeadline) >= new Date(new Date().toISOString().slice(0, 10));

      return {
        job_id: j.job_id,
        job_title: j.job_title,
        job_type: j.job_type,
        location: j.location,
        total_ctc: totalCtc,
        openings: j.openings,
        application_deadline: applicationDeadline,
        applicants_count: Number(j.total_applications || 0),
        status: isOpen ? 'Open' : 'Closed',
      } as CompanyJobListing;
    });
  },

  getApplicants: async (jobId?: number): Promise<CompanyApplicant[]> => {
    if (!jobId) return [];
    const response = await api.get(`/company/jobs/${jobId}/applicants`);
    const applicants = response.data as any[];
    return applicants.map((a) => ({
      application_id: a.application_id,
      student_id: a.student_id,
      student_name: a.full_name,
      email: a.email,
      cgpa: Number(a.cgpa),
      department: a.department,
      resume_url: a.resume_url,
      status: a.status,
      applied_at: String(a.applied_at).slice(0, 10),
    })) as CompanyApplicant[];
  },

  postJob: async (jobData: NewJobPayload): Promise<{ message: string; job_id: number }> => {
    const payload = {
      job_title: jobData.job_title,
      job_description: jobData.job_description,
      location: jobData.location,
      job_type: jobData.job_type,
      ctc_fixed: jobData.total_ctc,
      ctc_variable: 0,
      min_cgpa: jobData.min_cgpa,
      openings: jobData.openings,
      application_deadline: jobData.application_deadline,
    };
    const response = await api.post('/company/jobs', payload);
    return response.data;
  },

  updateApplicantStatus: async (applicationId: number, status: string): Promise<{ message: string }> => {
    const response = await api.put(`/company/applications/${applicationId}/status`, { status });
    return response.data;
  }
};

export default companyService;
