import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, FileText, MessageSquare, MoreVertical } from 'lucide-react';
import studentService from '@/lib/services/studentService';
import { Skeleton } from './ui/skeleton';

const statusConfig: Record<string, { bg: string; text: string }> = {
  'Applied': { bg: '#F3F4F6', text: '#5B6472' },
  'Under review': { bg: '#F0F9FF', text: '#1D4ED8' },
  'Shortlisted': { bg: '#F5F3FF', text: '#7C3AED' },
  'Interview_Scheduled': { bg: '#FEF3C7', text: '#A16207' },
  'Selected': { bg: '#ECFDF5', text: '#1F6F43' },
  'Rejected': { bg: '#FEF3F2', text: '#B42318' },
  'Offer_Accepted': { bg: '#D1FAE5', text: '#065F46' },
  'Offer_Declined': { bg: '#FEE2E2', text: '#991B1B' },
};

export function ApplicationsPage() {
  const [activeTab, setActiveTab] = useState('All applications');

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['studentDashboardStats'],
    queryFn: studentService.getDashboardStats,
  });

  const { data: applications, isLoading: appsLoading } = useQuery({
    queryKey: ['myApplications'],
    queryFn: studentService.getApplications,
  });

  const filteredApps = applications?.filter(app => {
    if (activeTab === 'All applications') return true;
    if (activeTab === 'Active') return ['Applied', 'Under review', 'Shortlisted', 'Interview_Scheduled'].includes(app.status);
    if (activeTab === 'Interviews') return app.status === 'Interview_Scheduled';
    if (activeTab === 'Offers') return ['Selected', 'Offer_Accepted'].includes(app.status);
    if (activeTab === 'Archived') return ['Rejected', 'Offer_Declined'].includes(app.status);
    return true;
  });

  return (
    <div className="p-8 max-w-[1440px] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[2rem] font-semibold text-[#0B1426] mb-2">Applications</h1>
        <p className="text-[#5B6472]">Track and manage your placement applications</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-6 gap-4 mb-8">
        <StatCard label="Total" value={stats?.total_applied?.toString()} loading={statsLoading} />
        <StatCard label="Shortlisted" value={stats?.shortlisted?.toString()} loading={statsLoading} />
        <StatCard label="Interview" value={stats?.interviews_scheduled?.toString()} loading={statsLoading} />
        <StatCard label="Offers" value={stats?.selected?.toString()} loading={statsLoading} />
        <StatCard label="Rejected" value={stats?.rejected?.toString()} loading={statsLoading} />
        <StatCard label="Accepted" value={stats?.offers_accepted?.toString()} loading={statsLoading} />
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-[#E7E9EE]">
        <FilterTab 
          label="All applications" 
          count={applications?.length || 0} 
          active={activeTab === 'All applications'} 
          onClick={() => setActiveTab('All applications')}
        />
        <FilterTab 
          label="Active" 
          count={applications?.filter(a => ['Applied', 'Under review', 'Shortlisted', 'Interview_Scheduled'].includes(a.status)).length || 0} 
          active={activeTab === 'Active'}
          onClick={() => setActiveTab('Active')}
        />
        <FilterTab 
          label="Interviews" 
          count={applications?.filter(a => a.status === 'Interview_Scheduled').length || 0} 
          active={activeTab === 'Interviews'}
          onClick={() => setActiveTab('Interviews')}
        />
        <FilterTab 
          label="Offers" 
          count={applications?.filter(a => ['Selected', 'Offer_Accepted'].includes(a.status)).length || 0} 
          active={activeTab === 'Offers'}
          onClick={() => setActiveTab('Offers')}
        />
        <FilterTab 
          label="Archived" 
          count={applications?.filter(a => ['Rejected', 'Offer_Declined'].includes(a.status)).length || 0} 
          active={activeTab === 'Archived'}
          onClick={() => setActiveTab('Archived')}
        />
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-2xl border border-[#E7E9EE] shadow-[0_1px_2px_rgba(16,24,40,0.04)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E7E9EE] bg-[#F8F7F4]">
                <th className="text-left px-6 py-4 text-xs font-semibold text-[#5B6472] uppercase tracking-wider">Company & role</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-[#5B6472] uppercase tracking-wider">Applied date</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-[#5B6472] uppercase tracking-wider">Status</th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-[#5B6472] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {appsLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-[#E7E9EE]">
                    <td className="px-6 py-4"><Skeleton className="h-10 w-48" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-32" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-16 ml-auto" /></td>
                  </tr>
                ))
              ) : (
                filteredApps?.map((app) => (
                  <tr 
                    key={app.application_id}
                    className="border-b border-[#E7E9EE] last:border-0 hover:bg-[#F8F7F4] cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#0B1426] rounded-lg flex items-center justify-center text-white font-semibold flex-shrink-0">
                          {app.company_name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-[#0B1426]">{app.job_title}</p>
                          <p className="text-sm text-[#5B6472]">{app.company_name} · ₹{app.total_ctc} LPA</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-[#5B6472]">
                        <Calendar className="w-4 h-4" />
                        {new Date(app.applied_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span 
                        className="inline-flex px-3 py-1 text-xs font-medium rounded-md"
                        style={{ 
                          backgroundColor: statusConfig[app.status]?.bg || '#F3F4F6',
                          color: statusConfig[app.status]?.text || '#5B6472'
                        }}
                      >
                        {app.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-2 hover:bg-[#F3F4F6] rounded-lg transition-colors" title="View Details">
                          <FileText className="w-4 h-4 text-[#5B6472]" />
                        </button>
                        <button className="p-2 hover:bg-[#F3F4F6] rounded-lg transition-colors" title="Messages">
                          <MessageSquare className="w-4 h-4 text-[#5B6472]" />
                        </button>
                        <button className="p-2 hover:bg-[#F3F4F6] rounded-lg transition-colors">
                          <MoreVertical className="w-4 h-4 text-[#5B6472]" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, loading }: { label: string; value?: string; loading: boolean }) {
  return (
    <div className="bg-white rounded-xl p-4 border border-[#E7E9EE]">
      <p className="text-xs text-[#5B6472] uppercase tracking-wide mb-1">{label}</p>
      {loading ? (
        <Skeleton className="h-8 w-12" />
      ) : (
        <p className="text-2xl font-semibold text-[#0B1426] tabular-nums">{value || '0'}</p>
      )}
    </div>
  );
}

function FilterTab({ 
  label, 
  count, 
  active, 
  onClick 
}: { 
  label: string; 
  count: number; 
  active?: boolean; 
  onClick: () => void;
}) {
  return (
    <button 
      onClick={onClick}
      className={`px-4 py-3 text-sm font-medium transition-colors relative ${
        active 
          ? 'text-[#B6922E]' 
          : 'text-[#5B6472] hover:text-[#0B1426]'
      }`}
    >
      {label} <span className="ml-1.5 text-xs">({count})</span>
      {active && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#B6922E]"></div>}
    </button>
  );
}
