import { useMemo } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import studentService from '@/lib/services/studentService';
import api from '@/lib/api';
import { Skeleton } from './ui/skeleton';

type StudentInterviewRow = {
  application_id: number;
  round_id: number;
  round_number: number;
  round_type: string;
  scheduled_at: string | null;
  venue: string | null;
  interviewer: string | null;
  status: string;
  score?: number | null;
  feedback?: string | null;
  outcome?: string | null;
  job_title?: string;
  company_name?: string;
};

type CompanyInterviewRow = {
  round_id: number;
  application_id: number;
  job_id: number;
  job_title: string;
  student_id: number;
  full_name: string;
  email: string;
  round_number: number;
  round_type: string;
  scheduled_at: string | null;
  venue: string | null;
  interviewer: string | null;
  status: string;
};

async function fetchCompanyInterviews(): Promise<CompanyInterviewRow[]> {
  const res = await api.get('/company/interviews');
  return res.data;
}

export function InterviewsPage() {
  const { user } = useAuthStore();

  // Company: single endpoint
  const companyQuery = useQuery({
    queryKey: ['companyInterviews'],
    queryFn: fetchCompanyInterviews,
    enabled: user?.role === 'company',
  });

  // Student: we can compute from applications + per-application interviews (works even without new endpoint).
  const appsQuery = useQuery({
    queryKey: ['myApplications'],
    queryFn: studentService.getApplications,
    enabled: user?.role === 'student',
  });

  const roundsQueries = useQueries({
    queries:
      (appsQuery.data || []).map((a) => ({
        queryKey: ['studentInterviewRounds', a.application_id],
        queryFn: async () => {
          const res = await api.get(`/student/applications/${a.application_id}/interviews`);
          const rounds = res.data as any[];
          return rounds.map((r) => ({
            ...r,
            application_id: a.application_id,
            job_title: a.job_title,
            company_name: a.company_name,
          })) as StudentInterviewRow[];
        },
        enabled: user?.role === 'student' && Boolean(appsQuery.data?.length),
      })) || [],
  });

  const studentRows = useMemo(() => {
    const rows: StudentInterviewRow[] = [];
    roundsQueries.forEach((q) => {
      if (q.data) rows.push(...q.data);
    });
    rows.sort((a, b) => String(a.scheduled_at || '').localeCompare(String(b.scheduled_at || '')));
    return rows;
  }, [roundsQueries]);

  const loading =
    user?.role === 'company'
      ? companyQuery.isLoading
      : user?.role === 'student'
        ? appsQuery.isLoading || roundsQueries.some((q) => q.isLoading)
        : false;

  const error =
    user?.role === 'company'
      ? companyQuery.error
      : user?.role === 'student'
        ? appsQuery.error || roundsQueries.find((q) => q.error)?.error
        : null;

  if (!user) return null;

  return (
    <div className="p-8 max-w-[1440px] mx-auto">
      <div className="mb-8">
        <h1 className="text-[2rem] font-semibold text-[#0B1426] mb-2">Interviews</h1>
        <p className="text-[#5B6472]">
          {user.role === 'company' ? 'Manage scheduled interview rounds across your postings' : 'Track upcoming rounds across your applications'}
        </p>
      </div>

      {error ? (
        <div className="bg-white border border-[#E7E9EE] rounded-2xl p-8 text-[#B42318]">Failed to load interviews.</div>
      ) : (
        <div className="bg-white border border-[#E7E9EE] rounded-2xl overflow-hidden shadow-sm">
          <div className="border-b border-[#E7E9EE] bg-[#F8F7F4] px-6 py-4 text-xs font-semibold text-[#5B6472] uppercase">
            Upcoming & completed rounds
          </div>

          {loading ? (
            <div className="p-6 space-y-3">
              <Skeleton className="h-6 w-3/5" />
              <Skeleton className="h-6 w-4/5" />
              <Skeleton className="h-6 w-2/5" />
            </div>
          ) : user.role === 'company' ? (
            <CompanyRoundsTable rows={companyQuery.data || []} />
          ) : (
            <StudentRoundsTable rows={studentRows} />
          )}
        </div>
      )}
    </div>
  );
}

function StudentRoundsTable({ rows }: { rows: StudentInterviewRow[] }) {
  if (!rows.length) {
    return <div className="px-6 py-14 text-center text-[#5B6472]">No interview rounds scheduled yet.</div>;
  }

  return (
    <table className="w-full text-left">
      <thead className="bg-white border-b border-[#E7E9EE]">
        <tr>
          <th className="px-6 py-4 text-xs font-semibold text-[#5B6472] uppercase">Company & role</th>
          <th className="px-6 py-4 text-xs font-semibold text-[#5B6472] uppercase">Round</th>
          <th className="px-6 py-4 text-xs font-semibold text-[#5B6472] uppercase">Schedule</th>
          <th className="px-6 py-4 text-xs font-semibold text-[#5B6472] uppercase">Status</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-[#E7E9EE]">
        {rows.map((r) => (
          <tr key={r.round_id} className="hover:bg-[#F8F7F4] transition-colors">
            <td className="px-6 py-4">
              <div className="font-semibold text-[#0B1426]">{r.job_title || '—'}</div>
              <div className="text-xs text-[#5B6472]">{r.company_name || '—'}</div>
            </td>
            <td className="px-6 py-4 text-sm text-[#0B1426]">
              #{r.round_number} · {r.round_type}
            </td>
            <td className="px-6 py-4 text-sm text-[#0B1426]">
              <div className="flex items-center gap-2 text-[#5B6472]">
                <Calendar className="w-4 h-4" />
                <span className="text-[#0B1426]">{r.scheduled_at ? new Date(r.scheduled_at).toLocaleString() : 'TBD'}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#5B6472] mt-1">
                <MapPin className="w-4 h-4" />
                {r.venue || '—'}
              </div>
            </td>
            <td className="px-6 py-4">
              <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-[#F3F4F6] text-[#5B6472]">{r.status}</span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function CompanyRoundsTable({ rows }: { rows: CompanyInterviewRow[] }) {
  if (!rows.length) {
    return <div className="px-6 py-14 text-center text-[#5B6472]">No interview rounds scheduled yet.</div>;
  }

  return (
    <table className="w-full text-left">
      <thead className="bg-white border-b border-[#E7E9EE]">
        <tr>
          <th className="px-6 py-4 text-xs font-semibold text-[#5B6472] uppercase">Candidate</th>
          <th className="px-6 py-4 text-xs font-semibold text-[#5B6472] uppercase">Job</th>
          <th className="px-6 py-4 text-xs font-semibold text-[#5B6472] uppercase">Round</th>
          <th className="px-6 py-4 text-xs font-semibold text-[#5B6472] uppercase">Schedule</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-[#E7E9EE]">
        {rows.map((r) => (
          <tr key={r.round_id} className="hover:bg-[#F8F7F4] transition-colors">
            <td className="px-6 py-4">
              <div className="font-semibold text-[#0B1426]">{r.full_name}</div>
              <div className="text-xs text-[#5B6472]">{r.email}</div>
            </td>
            <td className="px-6 py-4 text-sm text-[#0B1426]">{r.job_title}</td>
            <td className="px-6 py-4 text-sm text-[#0B1426]">
              #{r.round_number} · {r.round_type}
            </td>
            <td className="px-6 py-4 text-sm text-[#0B1426]">
              <div className="flex items-center gap-2 text-[#5B6472]">
                <Clock className="w-4 h-4" />
                <span className="text-[#0B1426]">{r.scheduled_at ? new Date(r.scheduled_at).toLocaleString() : 'TBD'}</span>
              </div>
              <div className="text-xs text-[#5B6472] mt-1">{r.venue || '—'}</div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

