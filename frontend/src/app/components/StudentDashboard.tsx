import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Clock, CheckCircle, FileCheck, Search, Bookmark, MapPin, Users, X } from 'lucide-react';
import studentService, { StudentDashboardStats, JobListing } from '@/lib/services/studentService';
import { useAuthStore } from '@/store/authStore';
import { Skeleton } from './ui/skeleton';

export function StudentDashboard() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['studentDashboardStats'],
    queryFn: studentService.getDashboardStats,
  });

  // --- FILTER & SORT STATE ---
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoleTypes, setSelectedRoleTypes] = useState<string[]>([]);
  const [minCGPA, setMinCGPA] = useState<number | null>(null);
  const [sortOption, setSortOption] = useState<string>('Recently posted');
  
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const sortParam = sortOption === 'Deadline (earliest)' ? 'deadline' 
                  : sortOption === 'Salary (high to low)' ? 'salary' 
                  : 'recent';

  const { data: filteredOpportunities = [], isLoading: jobsLoading } = useQuery({
    queryKey: ['eligibleJobs', debouncedSearch, selectedRoleTypes, minCGPA, sortParam],
    queryFn: () => studentService.getEligibleJobs({
      search: debouncedSearch,
      roles: selectedRoleTypes.join(","),
      minCgpa: minCGPA ?? undefined,
      sort: sortParam
    }),
  });

  const skipRolesFilter = selectedRoleTypes.length === 0;
  
  const { data: baseJobsForCounts = [] } = useQuery({
    queryKey: ['eligibleJobs', debouncedSearch, [], minCGPA, skipRolesFilter ? sortParam : 'recent'],
    queryFn: () => studentService.getEligibleJobs({
      search: debouncedSearch,
      roles: "",
      minCgpa: minCGPA ?? undefined,
      sort: skipRolesFilter ? sortParam : 'recent'
    }),
  });

  const countRole = (role: string) => baseJobsForCounts.filter(j => j.type === role).length;

  const toggleRole = (role: string) => {
    setSelectedRoleTypes(prev => 
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedRoleTypes([]);
    setMinCGPA(null);
    setSortOption('Recently posted');
  };

  // --- MODAL & APPLY STATE ---
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const selectedJob = filteredOpportunities.find(j => j.id === selectedJobId) || null;

  // Close modal on ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedJobId(null);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  // Apply Mutation
  const applyMutation = useMutation({
    mutationFn: studentService.applyJob,
    onSuccess: (data) => {
      // Invalidate both stats and jobs
      queryClient.invalidateQueries({ queryKey: ['eligibleJobs'] });
      queryClient.invalidateQueries({ queryKey: ['studentDashboardStats'] });
      // We could add a toast here. For now, rely on UI syncing.
    },
    onError: (error: any) => {
      alert(error.response?.data?.error || "Failed to submit application");
    }
  });

  const handleApply = (jobId: string) => {
    applyMutation.mutate(jobId);
  };

  return (
    <div className="p-8 max-w-[1440px] mx-auto pb-20 relative">
      {/* Welcome Block */}
      <div className="mb-8">
        <h1 className="text-[2rem] font-semibold text-[#0B1426] mb-2">
          Welcome back, {user?.username || 'User'}
        </h1>
        <p className="text-[#5B6472]">
          Placement cycle 2025-26
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-5 gap-6 mb-10">
        <KPICard
          label="Applications submitted"
          value={statsLoading ? undefined : stats?.total_applied?.toString() || '0'}
          subtext="Total lifetime"
          icon={<FileCheck className="w-4 h-4" />}
          loading={statsLoading}
        />
        <KPICard
          label="Shortlisted"
          value={statsLoading ? undefined : stats?.shortlisted?.toString() || '0'}
          subtext="Progressing"
          trendPositive
          loading={statsLoading}
        />
        <KPICard
          label="Interviews scheduled"
          value={statsLoading ? undefined : stats?.interviews_scheduled?.toString() || '0'}
          subtext="Upcoming matches"
          icon={<Clock className="w-4 h-4" />}
          loading={statsLoading}
        />
        <KPICard
          label="Offers received"
          value={statsLoading ? undefined : stats?.selected?.toString() || '0'}
          subtext="Awaiting response"
          icon={<CheckCircle className="w-4 h-4 text-[#1F6F43]" />}
          loading={statsLoading}
        />
        <KPICard
          label="Eligibility status"
          value="Verified"
          subtext="Profile approved"
          icon={<FileCheck className="w-4 h-4 text-[#1F6F43]" />}
          loading={false}
        />
      </div>

      <div className="flex gap-8">
        {/* Filters */}
        <aside className="w-[280px] flex-shrink-0 space-y-6">
          <div className="bg-white rounded-2xl border border-[#E7E9EE] p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)] sticky top-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-[#0B1426]">Filters</h3>
              <button onClick={clearAllFilters} className="text-xs text-[#B6922E] font-medium hover:underline">
                Clear all
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium text-[#0B1426] mb-3 block">Role type</label>
                <div className="space-y-2">
                  <FilterCheckbox label="Full-Time" count={countRole('Full-Time')} checked={selectedRoleTypes.includes('Full-Time')} onChange={() => toggleRole('Full-Time')} />
                  <FilterCheckbox label="Internship" count={countRole('Internship')} checked={selectedRoleTypes.includes('Internship')} onChange={() => toggleRole('Internship')} />
                  <FilterCheckbox label="Contract" count={countRole('Contract')} checked={selectedRoleTypes.includes('Contract')} onChange={() => toggleRole('Contract')} />
                </div>
              </div>

              <div className="pt-6 border-t border-[#E7E9EE]">
                <label className="text-sm font-medium text-[#0B1426] mb-3 block">Minimum CGPA</label>
                <select 
                  value={minCGPA === null ? 'Any' : minCGPA.toString()}
                  onChange={(e) => setMinCGPA(e.target.value === 'Any' ? null : parseFloat(e.target.value))}
                  className="w-full h-11 px-3 bg-white border border-[#E7E9EE] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#B6922E]"
                >
                  <option value="Any">Any</option>
                  <option value="7">7.0+</option>
                  <option value="7.5">7.5+</option>
                  <option value="8">8.0+</option>
                  <option value="8.5">8.5+</option>
                  <option value="9">9.0+</option>
                </select>
              </div>
            </div>
          </div>
        </aside>

        {/* List */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="bg-white rounded-2xl border border-[#E7E9EE] p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)] mb-6 flex items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#5B6472]" />
              <input type="text" placeholder="Search by role, company, or skills..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full h-12 pl-12 pr-4 bg-[#F8F7F4] border border-[#E7E9EE] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#B6922E] transition-all" />
            </div>
            
            <div className="flex items-center gap-3 w-64 justify-end flex-shrink-0">
              <span className="text-sm text-[#5B6472] whitespace-nowrap">Sort by:</span>
              <select value={sortOption} onChange={(e) => setSortOption(e.target.value)} className="h-12 px-4 flex-1 bg-white border border-[#E7E9EE] rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#B6922E]">
                <option value="Recently posted">Recently posted</option>
                <option value="Deadline (earliest)">Deadline</option>
                <option value="Salary (high to low)">Salary</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4 px-1">
            <p className="text-sm text-[#5B6472]">
              {jobsLoading ? <Skeleton className="h-4 w-48" /> : <><span className="font-medium text-[#0B1426]">{filteredOpportunities.length}</span> opportunities match your profile</>}
            </p>
          </div>

          <div className="space-y-4">
            {jobsLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="bg-white p-6 border border-[#E7E9EE] rounded-2xl shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
                  <div className="flex items-start gap-4">
                    <Skeleton className="w-14 h-14 rounded-xl" />
                    <div className="flex-1 space-y-3">
                      <Skeleton className="h-6 w-1/3" />
                      <Skeleton className="h-4 w-1/4" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              filteredOpportunities.map((opp) => (
                <div key={opp.id} className="bg-white p-6 border border-[#E7E9EE] rounded-2xl shadow-[0_1px_2px_rgba(16,24,40,0.04)] hover:border-[#B6922E] hover:shadow-[0_6px_18px_rgba(16,24,40,0.06)] transition-all">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-[#0B1426] rounded-xl flex items-center justify-center text-white text-xl font-semibold flex-shrink-0">
                      {opp.company.charAt(0)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-3">
                        <div className="truncate pr-4">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-lg font-semibold text-[#0B1426] truncate">{opp.title}</h3>
                            <span className="px-2 py-0.5 bg-[#F0F9FF] text-[#1D4ED8] text-xs font-medium rounded flex-shrink-0">{opp.type}</span>
                            <span className="px-2 py-0.5 bg-[#FDF4FF] text-[#C026D3] text-xs font-medium rounded flex-shrink-0">{opp.salary}</span>
                            {opp.apply_status === 'Applied' && (
                              <span className="px-2 py-0.5 bg-[#ECFCCB] text-[#4D7C0F] text-xs font-medium rounded flex-shrink-0 border border-[#BEF264]">Applied ✔</span>
                            )}
                          </div>
                          <p className="text-sm text-[#5B6472] font-medium truncate">{opp.company} · {opp.industry || 'Tech'}</p>
                        </div>
                        <button className="p-2 rounded-lg transition-colors text-[#5B6472] hover:bg-[#F8F7F4] flex-shrink-0">
                          <Bookmark className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-sm text-[#5B6472] mb-4">
                        <div className="flex items-center gap-1.5"><MapPin className="w-4 h-4" />{opp.location}</div>
                        <div className="flex items-center gap-1.5"><Users className="w-4 h-4" />{opp.applicants_count} applicants</div>
                        <div className="flex items-center gap-1.5"><Clock className="w-4 h-4" />Posted {opp.posted_at}</div>
                        <div>Min CGPA: <span className="font-medium text-[#0B1426]">{opp.cgpa_cutoff}</span></div>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {opp.skills?.slice(0, 4).map((skill, i) => (
                          <span key={i} className="px-2.5 py-1 bg-[#F3F4F6] text-[#374151] text-xs font-medium rounded-md">{skill}</span>
                        ))}
                        {opp.skills?.length > 4 && (
                          <span className="px-2.5 py-1 bg-[#F3F4F6] text-[#374151] text-xs font-medium rounded-md">+{opp.skills.length - 4} more</span>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-4 border-t border-[#F3F4F6] pt-4">
                        <div className="flex items-center gap-4 text-xs text-[#5B6472]">
                          <span className="text-[#A16207] font-medium">Deadline: {opp.deadline}</span>
                          <span>{opp.openings} openings</span>
                        </div>
                        <div className="flex gap-2">
                          {opp.apply_status === 'Applied' ? (
                             <button disabled className="px-5 py-2.5 bg-[#F3F4F6] text-[#9CA3AF] text-sm font-medium rounded-xl cursor-not-allowed">
                               Applied
                             </button>
                          ) : (
                             <button 
                               onClick={() => handleApply(opp.id)}
                               disabled={applyMutation.isPending && applyMutation.variables === opp.id}
                               className="px-5 py-2.5 bg-[#0B1426] text-white text-sm font-medium rounded-xl hover:bg-[#1E3A5F] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                             >
                               {applyMutation.isPending && applyMutation.variables === opp.id ? 'Applying...' : 'Apply Now'}
                             </button>
                          )}
                          <button onClick={() => setSelectedJobId(opp.id)} className="px-5 py-2.5 border border-[#E7E9EE] text-[#0B1426] text-sm font-medium rounded-xl hover:bg-[#F8F7F4] transition-colors">
                            View details
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
            
            {!jobsLoading && filteredOpportunities.length === 0 && (
              <p className="text-center text-[#5B6472] py-20 bg-white rounded-2xl border border-[#E7E9EE]">
                No opportunities found match your criteria.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* --- JOB DETAILS MODAL --- */}
      {selectedJobId && selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedJobId(null)}></div>
          
          <div className="relative bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="p-6 border-b border-[#E7E9EE] flex items-start justify-between bg-[#F8F7F4]">
              <div className="flex gap-4 items-center">
                 <div className="w-14 h-14 bg-[#0B1426] rounded-xl flex items-center justify-center text-white text-xl font-semibold flex-shrink-0">
                    {selectedJob.company.charAt(0)}
                 </div>
                 <div>
                    <h2 className="text-xl font-bold text-[#0B1426] mb-1">{selectedJob.title}</h2>
                    <p className="text-sm font-medium text-[#5B6472]">{selectedJob.company} · {selectedJob.location}</p>
                 </div>
              </div>
              <button onClick={() => setSelectedJobId(null)} className="p-2 text-[#5B6472] hover:bg-[#E7E9EE] rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-[#F8F7F4] p-4 rounded-xl border border-[#E7E9EE]">
                  <p className="text-xs font-medium text-[#5B6472] uppercase tracking-wide mb-1">Package</p>
                  <p className="text-base font-semibold text-[#0B1426]">{selectedJob.salary}</p>
                </div>
                <div className="bg-[#F8F7F4] p-4 rounded-xl border border-[#E7E9EE]">
                  <p className="text-xs font-medium text-[#5B6472] uppercase tracking-wide mb-1">Role Type</p>
                  <p className="text-base font-semibold text-[#0B1426]">{selectedJob.type}</p>
                </div>
                <div className="bg-[#F8F7F4] p-4 rounded-xl border border-[#E7E9EE]">
                  <p className="text-xs font-medium text-[#5B6472] uppercase tracking-wide mb-1">Openings</p>
                  <p className="text-base font-semibold text-[#0B1426]">{selectedJob.openings}</p>
                </div>
                <div className="bg-[#F8F7F4] p-4 rounded-xl border border-[#E7E9EE]">
                  <p className="text-xs font-medium text-[#5B6472] uppercase tracking-wide mb-1">Deadline</p>
                  <p className="text-base font-semibold text-[#A16207]">{selectedJob.deadline}</p>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-bold text-[#0B1426] mb-3">Required Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedJob.skills?.map((skill, i) => (
                    <span key={i} className="px-3 py-1.5 bg-[#E0E7FF] text-[#3730A3] text-sm font-medium rounded-lg">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                 <h3 className="text-sm font-bold text-[#0B1426] mb-3">Job Description</h3>
                 <div className="prose prose-sm max-w-none text-[#5B6472]">
                   {selectedJob.description?.split('\n').map((line, i) => (
                     <p key={i} className="mb-2">{line.startsWith('-') ? <ExtractedListItem line={line} /> : line}</p>
                   ))}
                 </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 bg-white border-t border-[#E7E9EE] flex items-center justify-between">
              <div className="text-sm text-[#5B6472] flex items-center gap-2">
                 <Users className="w-4 h-4" />
                 <span className="font-semibold text-[#0B1426]">{selectedJob.applicants_count}</span> applicants so far
              </div>
              <div className="flex gap-3">
                <button onClick={() => setSelectedJobId(null)} className="px-5 py-2.5 font-medium text-[#5B6472] hover:bg-[#F8F7F4] rounded-xl transition-colors">
                  Cancel
                </button>
                {selectedJob.apply_status === 'Applied' ? (
                   <button disabled className="px-6 py-2.5 bg-[#F3F4F6] text-[#9CA3AF] text-sm font-medium rounded-xl cursor-not-allowed">
                     Applied
                   </button>
                ) : (
                   <button 
                     onClick={() => handleApply(selectedJob.id)}
                     disabled={applyMutation.isPending && applyMutation.variables === selectedJob.id}
                     className="px-6 py-2.5 bg-[#0B1426] text-white text-sm font-semibold rounded-xl hover:bg-[#1E3A5F] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                   >
                     {applyMutation.isPending && applyMutation.variables === selectedJob.id ? 'Applying...' : 'Apply Now'}
                   </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

// Helper to render markdown-like lists softly
function ExtractedListItem({ line }: { line: string }) {
  return (
    <span className="flex items-start gap-2">
      <span className="mt-1 w-1.5 h-1.5 bg-[#5B6472] rounded-full flex-shrink-0" />
      <span>{line.replace(/^- /, '')}</span>
    </span>
  );
}

function KPICard({ label, value, subtext, trend, trendPositive, icon, loading }: any) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-[#E7E9EE] shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <div className="flex items-start justify-between mb-3"><p className="text-xs text-[#5B6472] uppercase tracking-wide">{label}</p>{icon}</div>
      <div className="flex items-end gap-2 mb-1">
        {loading ? <Skeleton className="h-9 w-16" /> : <p className="text-3xl font-semibold text-[#0B1426] tabular-nums">{value}</p>}
        {trend && <span className={`text-xs font-medium pb-1 ${trendPositive ? 'text-[#1F6F43]' : 'text-[#5B6472]'}`}>{trend}</span>}
      </div>
      <p className="text-xs text-[#5B6472]">{subtext}</p>
    </div>
  );
}

function FilterCheckbox({ label, count, checked, onChange }: any) {
  return (
    <label className="flex items-center justify-between cursor-pointer group">
      <div className="flex items-center gap-2">
        <input type="checkbox" checked={checked} onChange={onChange} className="w-4 h-4 rounded border-[#E7E9EE] text-[#B6922E] focus:ring-[#B6922E] focus:ring-offset-0" />
        <span className="text-sm text-[#0B1426] group-hover:text-[#B6922E]">{label}</span>
      </div>
      <span className="text-xs text-[#5B6472]">{count}</span>
    </label>
  );
}
