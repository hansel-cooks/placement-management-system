import { useQuery } from '@tanstack/react-query';
import { Building2, Briefcase, Users, Clock, TrendingUp, Award } from 'lucide-react';
import adminService from '@/lib/services/adminService';
import { Skeleton } from '../ui/skeleton';

function StatCard({
  label,
  value,
  subtext,
  icon,
  loading,
}: {
  label: string;
  value?: string;
  subtext: string;
  icon: React.ReactNode;
  loading: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-[#E7E9EE] shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-[#5B6472] uppercase tracking-wide">{label}</p>
        <div className="w-10 h-10 rounded-xl bg-[#F8F7F4] flex items-center justify-center">{icon}</div>
      </div>
      {loading ? (
        <Skeleton className="h-10 w-28" />
      ) : (
        <p className="text-3xl font-semibold text-[#0B1426] tabular-nums">{value || '0'}</p>
      )}
      <p className="text-xs text-[#5B6472] mt-1">{subtext}</p>
    </div>
  );
}

export function AdminDashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['adminDashboard'],
    queryFn: adminService.getDashboard,
  });

  if (error) {
    return (
      <div className="p-8 max-w-[1440px] mx-auto">
        <div className="bg-white border border-[#E7E9EE] rounded-2xl p-8 text-[#B42318]">
          Failed to load admin dashboard.
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[1440px] mx-auto">
      <div className="mb-8">
        <h1 className="text-[2rem] font-semibold text-[#0B1426] mb-2">Admin Dashboard</h1>
        <p className="text-[#5B6472]">University placements overview, approvals, and analytics</p>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-10">
        <StatCard
          label="Total students"
          value={isLoading ? undefined : String(data?.total_students ?? 0)}
          subtext={`Placed: ${data?.placed_students ?? 0} · Unplaced: ${data?.unplaced_students ?? 0}`}
          icon={<Users className="w-5 h-5 text-[#B6922E]" />}
          loading={isLoading}
        />
        <StatCard
          label="Placement rate"
          value={isLoading ? undefined : `${data?.overall_placement_pct ?? 0}%`}
          subtext="Overall (computed)"
          icon={<TrendingUp className="w-5 h-5 text-[#1F6F43]" />}
          loading={isLoading}
        />
        <StatCard
          label="Companies participating"
          value={isLoading ? undefined : String(data?.participating_companies ?? 0)}
          subtext={`Pending approvals: ${data?.pending_company_approvals ?? 0}`}
          icon={<Building2 className="w-5 h-5 text-[#B6922E]" />}
          loading={isLoading}
        />
      </div>

      <div className="grid grid-cols-3 gap-6">
        <StatCard
          label="Jobs posted"
          value={isLoading ? undefined : String(data?.total_jobs_posted ?? 0)}
          subtext={`Pending approvals: ${data?.pending_job_approvals ?? 0}`}
          icon={<Briefcase className="w-5 h-5 text-[#B6922E]" />}
          loading={isLoading}
        />
        <StatCard
          label="Average package (LPA)"
          value={isLoading ? undefined : String(data?.avg_package_lpa ?? 0)}
          subtext="From placements"
          icon={<Award className="w-5 h-5 text-[#B6922E]" />}
          loading={isLoading}
        />
        <StatCard
          label="Highest package (LPA)"
          value={isLoading ? undefined : String(data?.highest_package_lpa ?? 0)}
          subtext="From placements"
          icon={<Clock className="w-5 h-5 text-[#B6922E]" />}
          loading={isLoading}
        />
      </div>
    </div>
  );
}

