import { useQuery } from '@tanstack/react-query';
import { Briefcase, Users, Calendar, Award, Plus, ArrowUpRight } from 'lucide-react';
import companyService, { CompanyDashboardStats, CompanyJobListing } from '@/lib/services/companyService';
import { useAuthStore } from '@/store/authStore';
import { Skeleton } from './ui/skeleton';
import { NavLink } from 'react-router';
import api from '@/lib/api';

export function CompanyDashboard() {
  const { user } = useAuthStore();
  
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['companyDashboardStats'],
    queryFn: companyService.getDashboardStats,
  });

  const { data: jobs, isLoading: jobsLoading } = useQuery({
    queryKey: ['companyJobs'],
    queryFn: companyService.getJobs,
  });

  const { data: health, isLoading: healthLoading } = useQuery({
    queryKey: ['companyHealth'],
    queryFn: async () => {
      const r = await api.get('/company/dashboard/health');
      return r.data as {
        response_rate: number;
        avg_time_to_hire_days: number | null;
        attention_items: { type: string; level: string; message: string }[];
      };
    },
  });

  return (
    <div className="p-8 max-w-[1440px] mx-auto">
      {/* Header Block */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[2rem] font-semibold text-[#0B1426] mb-2">
            Company Dashboard
          </h1>
          <p className="text-[#5B6472]">
            Welcome back, {user?.username || 'User'} · {user?.role}
          </p>
        </div>
        <NavLink 
          to="/company/jobs/new"
          className="flex items-center gap-2 bg-[#0B1426] text-white px-5 py-2.5 rounded-xl font-medium hover:bg-[#1E3A5F] transition-all shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Post New Job
        </NavLink>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-4 gap-6 mb-10">
        <KPICard
          label="Active Jobs"
          value={statsLoading ? undefined : stats?.active_jobs?.toString() || '0'}
          subtext="Currently accepting applications"
          icon={<Briefcase className="w-5 h-5 text-[#B6922E]" />}
          loading={statsLoading}
        />
        <KPICard
          label="Total Applications"
          value={statsLoading ? undefined : stats?.total_applications?.toString() || '0'}
          subtext="Across all postings"
          icon={<Users className="w-5 h-5 text-[#B6922E]" />}
          loading={statsLoading}
        />
        <KPICard
          label="Interviews Scheduled"
          value={statsLoading ? undefined : stats?.interviews_scheduled?.toString() || '0'}
          subtext="Upcoming this week"
          icon={<Calendar className="w-5 h-5 text-[#B6922E]" />}
          loading={statsLoading}
        />
        <KPICard
          label="Offers Made"
          value={statsLoading ? undefined : stats?.offers_made?.toString() || '0'}
          subtext="Awaiting candidate response"
          icon={<Award className="w-5 h-5 text-[#1F6F43]" />}
          loading={statsLoading}
        />
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Active Job Postings */}
        <div className="col-span-2 bg-white rounded-2xl p-6 border border-[#E7E9EE] shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-[#0B1426]">Recent job postings</h3>
            <NavLink to="/company/jobs" className="text-sm text-[#B6922E] font-medium hover:underline flex items-center gap-1">
              View all <ArrowUpRight className="w-4 h-4" />
            </NavLink>
          </div>

          <div className="space-y-4">
            {jobsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 border border-[#E7E9EE] rounded-xl">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              ))
            ) : (
              jobs?.slice(0, 4).map((job) => (
                <div 
                  key={job.job_id} 
                  className="flex items-center justify-between p-4 border border-[#E7E9EE] rounded-xl hover:border-[#B6922E] transition-all cursor-pointer"
                >
                  <div>
                    <h4 className="font-semibold text-[#0B1426] mb-1">{job.job_title}</h4>
                    <p className="text-sm text-[#5B6472]">
                      {job.job_type} · {job.applicants_count} Applicants · Deadline: {new Date(job.application_deadline).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${
                      job.status === 'Open' ? 'bg-[#ECFDF5] text-[#1F6F43]' : 'bg-[#F3F4F6] text-[#5B6472]'
                    }`}>
                      {job.status}
                    </span>
                    <NavLink
                      to={`/company/applicants?job_id=${job.job_id}`}
                      className="text-[#B6922E] hover:text-[#8E7124]"
                    >
                      <ArrowUpRight className="w-5 h-5" />
                    </NavLink>
                  </div>
                </div>
              )) || <p className="text-sm text-[#5B6472]">No active job postings found.</p>
            )}
          </div>
        </div>

        {/* Quick Actions / Stats */}
        <div className="space-y-6">
          <div className="bg-[#0B1426] text-white rounded-2xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold mb-4">Recruitment health</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-white/70">Response rate</span>
                  <span>{healthLoading ? '…' : `${health?.response_rate ?? 0}%`}</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-[#B6922E] transition-all duration-500" style={{ width: `${health?.response_rate ?? 0}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-white/70">Avg. time-to-hire</span>
                  <span>
                    {healthLoading ? '…' : health?.avg_time_to_hire_days != null ? `${health.avg_time_to_hire_days} days` : 'N/A'}
                  </span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#1F6F43] transition-all duration-500"
                    style={{ width: health?.avg_time_to_hire_days != null ? `${Math.min(health.avg_time_to_hire_days / 30 * 100, 100)}%` : '0%' }}
                  />
                </div>
              </div>
            </div>
            <NavLink
              to="/analytics"
              className="block w-full mt-6 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm font-medium hover:bg-white/10 transition-colors text-center"
            >
              View Full Analytics
            </NavLink>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-[#E7E9EE] shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
            <h3 className="text-lg font-semibold text-[#0B1426] mb-4">Required attention</h3>
            {healthLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-4/5" />
              </div>
            ) : health?.attention_items?.length ? (
              <div className="space-y-4">
                {health.attention_items.map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${
                      item.level === 'warning' ? 'bg-[#EF4444]' : 'bg-[#F59E0B]'
                    }`} />
                    <p className="text-sm text-[#0B1426]">{item.message}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#5B6472]">No outstanding items — all clear! ✓</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function KPICard({ 
  label, 
  value, 
  subtext, 
  icon,
  loading
}: { 
  label: string; 
  value?: string; 
  subtext: string; 
  icon?: React.ReactNode;
  loading?: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-[#E7E9EE] shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[13px] font-medium text-[#5B6472] uppercase tracking-wider">{label}</p>
        <div className="p-2 bg-[#F8F7F4] rounded-lg">
          {icon}
        </div>
      </div>
      <div className="space-y-1">
        {loading ? (
          <Skeleton className="h-9 w-20" />
        ) : (
          <p className="text-3xl font-semibold text-[#0B1426] tabular-nums">{value}</p>
        )}
        <p className="text-xs text-[#5B6472]">{subtext}</p>
      </div>
    </div>
  );
}
