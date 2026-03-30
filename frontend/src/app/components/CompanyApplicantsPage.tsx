import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Filter, Mail, ExternalLink, CheckCircle2, XCircle, Clock, ChevronDown } from 'lucide-react';
import companyService from '@/lib/services/companyService';
import { Skeleton } from './ui/skeleton';
import { useSearchParams } from 'react-router';
import api from '@/lib/api';

export function CompanyApplicantsPage() {
  const [searchParams] = useSearchParams();
  const jobId = searchParams.get('job_id');
  const queryClient = useQueryClient();

  const { data: applicants, isLoading } = useQuery({
    queryKey: ['companyApplicants', jobId],
    queryFn: () => companyService.getApplicants(jobId ? parseInt(jobId) : undefined),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => 
      companyService.updateApplicantStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companyApplicants'] });
    },
  });

  const handleStatusUpdate = (id: number, status: string) => {
    statusMutation.mutate({ id, status });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Shortlisted': return <span className="px-2.5 py-1 bg-purple-50 text-purple-700 text-xs font-medium rounded-full">Shortlisted</span>;
      case 'Rejected': return <span className="px-2.5 py-1 bg-red-50 text-red-700 text-xs font-medium rounded-full">Rejected</span>;
      case 'Interview Scheduled': return <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-medium rounded-full">Interview</span>;
      case 'Offer Made': return <span className="px-2.5 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full">Offer Made</span>;
      default: return <span className="px-2.5 py-1 bg-gray-50 text-gray-600 text-xs font-medium rounded-full">Applied</span>;
    }
  };

  return (
    <div className="p-8 max-w-[1440px] mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-[#0B1426]">Applicant Tracking</h1>
          <p className="text-sm text-[#5B6472]">
            {jobId ? `Reviewing candidates for Job ID: #JOB-${jobId}` : 'Browse and manage all applications across roles'}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            disabled={!jobId}
            onClick={async () => {
              if (!jobId) return;
              const res = await api.get(`/company/jobs/${jobId}/applicants.csv`, { responseType: 'blob' });
              const url = window.URL.createObjectURL(res.data);
              const a = document.createElement('a');
              a.href = url;
              a.download = `job_${jobId}_applicants.csv`;
              document.body.appendChild(a);
              a.click();
              a.remove();
              window.URL.revokeObjectURL(url);
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#E7E9EE] rounded-xl font-medium text-sm hover:bg-[#F8F7F4] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5B6472]" />
          <input
            type="text"
            placeholder="Search by student name or email..."
            className="w-full h-11 pl-10 pr-4 bg-white border border-[#E7E9EE] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#B6922E]"
          />
        </div>
        <button className="flex items-center gap-2 px-4 h-11 bg-white border border-[#E7E9EE] rounded-xl text-sm font-medium hover:bg-[#F8F7F4] transition-colors">
          <Filter className="w-4 h-4" />
          More filters
        </button>
      </div>

      {/* Applicants List */}
      <div className="bg-white border border-[#E7E9EE] rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-[#F8F7F4] border-b border-[#E7E9EE]">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold text-[#5B6472] uppercase">Candidate</th>
              <th className="px-6 py-4 text-xs font-semibold text-[#5B6472] uppercase text-center">CGPA</th>
              <th className="px-6 py-4 text-xs font-semibold text-[#5B6472] uppercase">Resume</th>
              <th className="px-6 py-4 text-xs font-semibold text-[#5B6472] uppercase">Applied on</th>
              <th className="px-6 py-4 text-xs font-semibold text-[#5B6472] uppercase">Status</th>
              <th className="px-6 py-4 text-xs font-semibold text-[#5B6472] uppercase text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E7E9EE]">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-6 py-4"><Skeleton className="h-10 w-48" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-5 w-10 mx-auto" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-6 w-16" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-5 w-24" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-6 w-20" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-8 w-24 ml-auto" /></td>
                </tr>
              ))
            ) : (
              applicants?.map((app) => (
                <tr key={app.application_id} className="hover:bg-[#F8F7F4] transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#B6922E]/10 rounded-full flex items-center justify-center text-[#B6922E] font-semibold text-sm">
                        {app.student_name.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-[#0B1426]">{app.student_name}</span>
                        <span className="text-xs text-[#5B6472] truncate max-w-[150px]">{app.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`font-medium ${app.cgpa >= 8.5 ? 'text-green-600' : 'text-[#0B1426]'}`}>
                      {app.cgpa}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <a 
                      href={app.resume_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[#B6922E] hover:underline text-sm font-medium"
                    >
                      View CV <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#0B1426]">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#5B6472]" />
                      {new Date(app.applied_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(app.status)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleStatusUpdate(app.application_id, 'Shortlisted')}
                        disabled={statusMutation.isPending}
                        className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg title='Shortlist'"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleStatusUpdate(app.application_id, 'Rejected')}
                        disabled={statusMutation.isPending}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg title='Reject'"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                      <button className="p-1.5 text-[#5B6472] hover:bg-gray-100 rounded-lg">
                        <Mail className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              )) || (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[#5B6472]">
                    No applicants found for this criteria.
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
