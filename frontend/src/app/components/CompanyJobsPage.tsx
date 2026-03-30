import { useQuery } from '@tanstack/react-query';
import { Search, Plus, Filter, MoreVertical, Users, Calendar, MapPin, IndianRupee } from 'lucide-react';
import companyService from '@/lib/services/companyService';
import { Skeleton } from './ui/skeleton';
import { NavLink } from 'react-router';

export function CompanyJobsPage() {
  const { data: jobs, isLoading } = useQuery({
    queryKey: ['companyJobs'],
    queryFn: companyService.getJobs,
  });

  return (
    <div className="p-8 max-w-[1440px] mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-[#0B1426]">Job Postings</h1>
          <p className="text-sm text-[#5B6472]">Manage and track your active recruitment drives</p>
        </div>
        <NavLink 
          to="/company/jobs/new"
          className="flex items-center gap-2 bg-[#0B1426] text-white px-5 py-2.5 rounded-xl font-medium hover:bg-[#1E3A5F] transition-all"
        >
          <Plus className="w-5 h-5" />
          Post New Job
        </NavLink>
      </div>

      {/* Stats Mini Row */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 border border-[#E7E9EE] rounded-xl">
          <p className="text-xs text-[#5B6472] uppercase font-semibold mb-1">Total Postings</p>
          <p className="text-xl font-bold text-[#0B1426]">{jobs?.length || 0}</p>
        </div>
        <div className="bg-white p-4 border border-[#E7E9EE] rounded-xl">
          <p className="text-xs text-[#5B6472] uppercase font-semibold mb-1">Active Now</p>
          <p className="text-xl font-bold text-[#0B1426]">{jobs?.filter(j => j.status === 'Open').length || 0}</p>
        </div>
        <div className="bg-white p-4 border border-[#E7E9EE] rounded-xl">
          <p className="text-xs text-[#5B6472] uppercase font-semibold mb-1">Total Applicants</p>
          <p className="text-xl font-bold text-[#0B1426]">{jobs?.reduce((acc, j) => acc + j.applicants_count, 0) || 0}</p>
        </div>
        <div className="bg-white p-4 border border-[#E7E9EE] rounded-xl">
          <p className="text-xs text-[#5B6472] uppercase font-semibold mb-1">Pending Review</p>
          <p className="text-xl font-bold text-[#B6922E]">12</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5B6472]" />
          <input
            type="text"
            placeholder="Search by role or ID..."
            className="w-full h-11 pl-10 pr-4 bg-white border border-[#E7E9EE] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#B6922E]"
          />
        </div>
        <button className="flex items-center gap-2 px-4 h-11 bg-white border border-[#E7E9EE] rounded-xl text-sm font-medium hover:bg-[#F8F7F4] transition-colors">
          <Filter className="w-4 h-4" />
          Filter
        </button>
      </div>

      {/* Jobs List */}
      <div className="bg-white border border-[#E7E9EE] rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-[#F8F7F4] border-b border-[#E7E9EE]">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold text-[#5B6472] uppercase">Job Role</th>
              <th className="px-6 py-4 text-xs font-semibold text-[#5B6472] uppercase">Type</th>
              <th className="px-6 py-4 text-xs font-semibold text-[#5B6472] uppercase">Applicants</th>
              <th className="px-6 py-4 text-xs font-semibold text-[#5B6472] uppercase">Salary</th>
              <th className="px-6 py-4 text-xs font-semibold text-[#5B6472] uppercase">Deadline</th>
              <th className="px-6 py-4 text-xs font-semibold text-[#5B6472] uppercase">Status</th>
              <th className="px-6 py-4 text-xs font-semibold text-[#5B6472] uppercase"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E7E9EE]">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-6 py-4"><Skeleton className="h-5 w-40" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-5 w-20" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-5 w-10" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-5 w-20" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-5 w-24" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-6 w-16" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-8 w-8 rounded-full" /></td>
                </tr>
              ))
            ) : (
              jobs?.map((job) => (
                <tr key={job.job_id} className="hover:bg-[#F8F7F4] transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-[#0B1426]">{job.job_title}</span>
                      <span className="text-xs text-[#5B6472]">ID: #JOB-{job.job_id}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#0B1426]">{job.job_type}</td>
                  <td className="px-6 py-4">
                    <NavLink 
                      to={`/company/applicants?job_id=${job.job_id}`}
                      className="flex items-center gap-2 text-sm font-medium text-[#B6922E] hover:underline"
                    >
                      <Users className="w-4 h-4" />
                      {job.applicants_count}
                    </NavLink>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#0B1426]">₹{job.total_ctc} LPA</td>
                  <td className="px-6 py-4 text-sm text-[#0B1426]">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#5B6472]" />
                      {new Date(job.application_deadline).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      job.status === 'Open' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {job.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 hover:bg-[#E7E9EE] rounded-lg text-[#5B6472]">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              )) || (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-[#5B6472]">
                    No job postings found. Get started by posting your first job!
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
