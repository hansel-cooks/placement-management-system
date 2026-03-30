import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Filter, Users, Calendar, Tag, X, ChevronDown, ChevronUp } from 'lucide-react';
import companyService from '@/lib/services/companyService';
import { Skeleton } from './ui/skeleton';
import { NavLink } from 'react-router';
import api from '@/lib/api';

interface Skill { skill_id: number; skill_name: string; skill_type: string; }

function SkillsPanel({ jobId }: { jobId: number }) {
  const queryClient = useQueryClient();
  const [newSkill, setNewSkill] = useState('');

  const { data: skills = [], isLoading } = useQuery<Skill[]>({
    queryKey: ['jobSkills', jobId],
    queryFn: async () => {
      const r = await api.get(`/company/jobs/${jobId}/skills`);
      return r.data;
    },
  });

  const addMutation = useMutation({
    mutationFn: async (skill_name: string) => {
      await api.post(`/company/jobs/${jobId}/skills`, { skill_name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobSkills', jobId] });
      setNewSkill('');
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (skill_id: number) => {
      await api.delete(`/company/jobs/${jobId}/skills/${skill_id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['jobSkills', jobId] }),
  });

  return (
    <tr>
      <td colSpan={7} className="px-6 py-4 bg-[#F8F7F4] border-t border-[#E7E9EE]">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-3">
            <Tag className="w-4 h-4 text-[#B6922E]" />
            <span className="text-sm font-semibold text-[#0B1426]">Required Skills</span>
          </div>

          {isLoading ? (
            <div className="flex gap-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-7 w-20 rounded-full" />)}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 mb-3">
              {skills.map((s) => (
                <span
                  key={s.skill_id}
                  className="flex items-center gap-1.5 px-3 py-1 bg-white border border-[#E7E9EE] rounded-full text-sm text-[#374151] font-medium"
                >
                  {s.skill_name}
                  <button
                    onClick={() => removeMutation.mutate(s.skill_id)}
                    className="text-[#5B6472] hover:text-red-600 transition-colors ml-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
              {skills.length === 0 && (
                <p className="text-sm text-[#5B6472]">No required skills added yet.</p>
              )}
            </div>
          )}

          <form
            onSubmit={(e) => { e.preventDefault(); if (newSkill.trim()) addMutation.mutate(newSkill.trim()); }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              placeholder="Add skill (e.g. Python, React, SQL)..."
              className="flex-1 h-9 px-3 border border-[#E7E9EE] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#B6922E] bg-white"
            />
            <button
              type="submit"
              disabled={!newSkill.trim() || addMutation.isPending}
              className="flex items-center gap-1.5 px-4 h-9 bg-[#0B1426] text-white rounded-lg text-sm font-medium hover:bg-[#1E3A5F] transition-all disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              Add
            </button>
          </form>
        </div>
      </td>
    </tr>
  );
}

export function CompanyJobsPage() {
  const [expandedSkills, setExpandedSkills] = useState<number | null>(null);

  const { data: jobs, isLoading } = useQuery({
    queryKey: ['companyJobs'],
    queryFn: companyService.getJobs,
  });

  const toggleSkills = (jobId: number) => {
    setExpandedSkills((prev) => (prev === jobId ? null : jobId));
  };

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
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-4 border border-[#E7E9EE] rounded-xl">
          <p className="text-xs text-[#5B6472] uppercase font-semibold mb-1">Total Postings</p>
          <p className="text-xl font-bold text-[#0B1426]">{jobs?.length || 0}</p>
        </div>
        <div className="bg-white p-4 border border-[#E7E9EE] rounded-xl">
          <p className="text-xs text-[#5B6472] uppercase font-semibold mb-1">Active Now</p>
          <p className="text-xl font-bold text-[#0B1426]">{jobs?.filter((j) => j.status === 'Open').length || 0}</p>
        </div>
        <div className="bg-white p-4 border border-[#E7E9EE] rounded-xl">
          <p className="text-xs text-[#5B6472] uppercase font-semibold mb-1">Total Applicants</p>
          <p className="text-xl font-bold text-[#0B1426]">{jobs?.reduce((acc, j) => acc + j.applicants_count, 0) || 0}</p>
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
              <th className="px-6 py-4 text-xs font-semibold text-[#5B6472] uppercase">Skills</th>
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
                  <td className="px-6 py-4"><Skeleton className="h-8 w-20 rounded-full" /></td>
                </tr>
              ))
            ) : jobs?.length ? (
              jobs.flatMap((job) => [
                <tr key={job.job_id} className="hover:bg-[#F8F7F4] transition-colors">
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
                      {job.application_deadline ? new Date(job.application_deadline).toLocaleDateString() : '—'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      job.status === 'Open' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {job.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => toggleSkills(job.job_id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                        expandedSkills === job.job_id
                          ? 'bg-[#B6922E]/10 text-[#B6922E] border-[#B6922E]/20'
                          : 'bg-[#F8F7F4] text-[#5B6472] border-[#E7E9EE] hover:border-[#B6922E]/30'
                      }`}
                    >
                      <Tag className="w-3.5 h-3.5" />
                      Skills
                      {expandedSkills === job.job_id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </td>
                </tr>,
                expandedSkills === job.job_id && <SkillsPanel key={`skills-${job.job_id}`} jobId={job.job_id} />,
              ])
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-[#5B6472]">
                  No job postings found. Get started by posting your first job!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
