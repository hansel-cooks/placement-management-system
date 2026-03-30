// ─────────────────────────────────────────────
// Shared TypeScript types for the placement platform
// ─────────────────────────────────────────────

// ── Auth ──────────────────────────────────────
export interface User {
  id: string;
  email: string;
  role: 'student' | 'recruiter' | 'admin';
  firstName: string;
  lastName: string;
  department?: string;
  graduationYear?: number;
  profileComplete: boolean;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

// ── Jobs / Opportunities ──────────────────────
export type JobType = 'full-time' | 'part-time' | 'internship' | 'contract';
export type WorkMode = 'on-site' | 'remote' | 'hybrid';
export type ExperienceLevel = 'entry' | 'mid' | 'senior';

export interface Job {
  id: string;
  title: string;
  company: string;
  companyLogoUrl?: string;
  location: string;
  workMode: WorkMode;
  jobType: JobType;
  experienceLevel: ExperienceLevel;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  description: string;
  requirements: string[];
  tags: string[];
  postedAt: string;
  deadline: string;
  applicationCount?: number;
  isBookmarked?: boolean;
}

export interface JobListResponse {
  data: Job[];
  total: number;
  page: number;
  pageSize: number;
}

// ── Applications ──────────────────────────────
export type ApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'shortlisted'
  | 'interviewing'
  | 'offered'
  | 'accepted'
  | 'rejected'
  | 'withdrawn';

export interface Application {
  id: string;
  jobId: string;
  studentId: string;
  status: ApplicationStatus;
  appliedAt: string;
  updatedAt: string;
  job: Pick<Job, 'id' | 'title' | 'company' | 'companyLogoUrl' | 'location' | 'jobType'>;
  nextStep?: string;
  nextStepDate?: string;
  notes?: string;
}

export interface ApplicationListResponse {
  data: Application[];
  total: number;
  page: number;
  pageSize: number;
}

// ── Dashboard / Analytics ─────────────────────
export interface DashboardMetrics {
  totalApplications: number;
  activeApplications: number;
  interviewsScheduled: number;
  offersReceived: number;
  profileCompletion: number;
  recommendedJobsCount: number;
}

export interface PipelineStage {
  stage: ApplicationStatus;
  label: string;
  count: number;
}

// ── Interviews ────────────────────────────────
export type InterviewFormat = 'video' | 'phone' | 'in-person' | 'technical' | 'case-study';

export interface Interview {
  id: string;
  applicationId: string;
  scheduledAt: string;
  duration: number; // minutes
  format: InterviewFormat;
  location?: string;
  meetingLink?: string;
  notes?: string;
  application: Pick<Application['job'], 'title' | 'company'>;
}

// ── API Response wrappers ─────────────────────
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}
