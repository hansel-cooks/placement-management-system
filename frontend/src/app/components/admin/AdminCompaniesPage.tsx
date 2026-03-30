import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, XCircle, Search } from 'lucide-react';
import adminService from '@/lib/services/adminService';
import { Skeleton } from '../ui/skeleton';

export function AdminCompaniesPage() {
  const [filter, setFilter] = useState<'all' | 'approved' | 'pending'>('pending');
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const approvedParam = filter === 'all' ? undefined : filter === 'approved';

  const { data, isLoading, error } = useQuery({
    queryKey: ['adminCompanies', filter],
    queryFn: () => adminService.getCompanies(typeof approvedParam === 'boolean' ? { approved: approvedParam } : undefined),
  });

  const mutation = useMutation({
    mutationFn: ({ id, approve }: { id: number; approve: boolean }) => adminService.approveCompany(id, approve),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['adminCompanies'] });
      await queryClient.invalidateQueries({ queryKey: ['adminDashboard'] });
    },
  });

  const companies = useMemo(() => {
    const base = data ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return base;
    return base.filter((c) => (c.company_name || '').toLowerCase().includes(q) || (c.hr_email || '').toLowerCase().includes(q));
  }, [data, search]);

  if (error) {
    return (
      <div className="p-8 max-w-[1440px] mx-auto">
        <div className="bg-white border border-[#E7E9EE] rounded-2xl p-8 text-[#B42318]">Failed to load companies.</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[1440px] mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[2rem] font-semibold text-[#0B1426] mb-2">Recruiter Management</h1>
          <p className="text-[#5B6472]">Approve companies before they can post jobs</p>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="flex bg-white border border-[#E7E9EE] rounded-xl p-1">
          {[
            { key: 'pending', label: 'Pending' },
            { key: 'approved', label: 'Approved' },
            { key: 'all', label: 'All' },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === t.key ? 'bg-[#0B1426] text-white' : 'text-[#5B6472] hover:bg-[#F8F7F4]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5B6472]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search company or HR email..."
            className="w-full h-11 pl-10 pr-4 bg-white border border-[#E7E9EE] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#B6922E]"
          />
        </div>
      </div>

      <div className="bg-white border border-[#E7E9EE] rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-[#F8F7F4] border-b border-[#E7E9EE]">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold text-[#5B6472] uppercase">Company</th>
              <th className="px-6 py-4 text-xs font-semibold text-[#5B6472] uppercase">Industry</th>
              <th className="px-6 py-4 text-xs font-semibold text-[#5B6472] uppercase">HR</th>
              <th className="px-6 py-4 text-xs font-semibold text-[#5B6472] uppercase">Status</th>
              <th className="px-6 py-4 text-xs font-semibold text-[#5B6472] uppercase text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E7E9EE]">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-6 py-4">
                    <Skeleton className="h-5 w-56" />
                  </td>
                  <td className="px-6 py-4">
                    <Skeleton className="h-5 w-24" />
                  </td>
                  <td className="px-6 py-4">
                    <Skeleton className="h-5 w-40" />
                  </td>
                  <td className="px-6 py-4">
                    <Skeleton className="h-5 w-20" />
                  </td>
                  <td className="px-6 py-4">
                    <Skeleton className="h-8 w-28 ml-auto" />
                  </td>
                </tr>
              ))
            ) : companies.length ? (
              companies.map((c) => (
                <tr key={c.company_id} className="hover:bg-[#F8F7F4] transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-[#0B1426]">{c.company_name}</div>
                    <div className="text-xs text-[#5B6472]">{c.website || '—'}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#0B1426]">{c.industry || '—'}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-[#0B1426]">{c.hr_name || 'HR'}</div>
                    <div className="text-xs text-[#5B6472]">{c.hr_email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                        c.is_approved ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {c.is_approved ? 'Approved' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="inline-flex gap-2">
                      <button
                        onClick={() => mutation.mutate({ id: c.company_id, approve: true })}
                        disabled={mutation.isPending}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0B1426] text-white text-sm font-medium hover:bg-[#1E3A5F] disabled:opacity-60"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => mutation.mutate({ id: c.company_id, approve: false })}
                        disabled={mutation.isPending}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#E7E9EE] text-[#B42318] text-sm font-medium hover:bg-red-50 disabled:opacity-60"
                      >
                        <XCircle className="w-4 h-4" />
                        Revoke
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-14 text-center text-[#5B6472]">
                  No companies found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

