import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, XCircle, ExternalLink } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { Skeleton } from './ui/skeleton';

type StudentOffer = {
  placement_id: number;
  application_id: number;
  company_name: string;
  job_title: string;
  total_ctc: number;
  joining_date: string | null;
  offer_letter_url: string | null;
  offer_status: 'Extended' | 'Accepted' | 'Declined' | 'Revoked';
  placed_at: string;
};

type CompanyOffer = {
  placement_id: number;
  application_id: number;
  job_id: number;
  job_title: string;
  full_name: string;
  email: string;
  total_ctc: number;
  offer_status: 'Extended' | 'Accepted' | 'Declined' | 'Revoked';
  placed_at: string;
  offer_letter_url?: string | null;
};

export function OffersPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const studentQuery = useQuery({
    queryKey: ['studentOffers'],
    queryFn: async (): Promise<StudentOffer[]> => (await api.get('/student/offers')).data,
    enabled: user?.role === 'student',
  });

  const companyQuery = useQuery({
    queryKey: ['companyOffers'],
    queryFn: async (): Promise<CompanyOffer[]> => (await api.get('/company/offers')).data,
    enabled: user?.role === 'company',
  });

  const respondMutation = useMutation({
    mutationFn: ({ placementId, decision }: { placementId: number; decision: 'Accepted' | 'Declined' }) =>
      api.put(`/student/offers/${placementId}/respond`, { decision }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['studentOffers'] });
      await queryClient.invalidateQueries({ queryKey: ['myApplications'] });
      await queryClient.invalidateQueries({ queryKey: ['studentDashboardStats'] });
    },
  });

  const loading = user?.role === 'student' ? studentQuery.isLoading : companyQuery.isLoading;
  const error = user?.role === 'student' ? studentQuery.error : companyQuery.error;

  return (
    <div className="p-8 max-w-[1440px] mx-auto">
      <div className="mb-8">
        <h1 className="text-[2rem] font-semibold text-[#0B1426] mb-2">Offers</h1>
        <p className="text-[#5B6472]">
          {user?.role === 'company' ? 'Track offers and candidate decisions' : 'Review and respond to placement offers'}
        </p>
      </div>

      {error ? (
        <div className="bg-white border border-[#E7E9EE] rounded-2xl p-8 text-[#B42318]">Failed to load offers.</div>
      ) : (
        <div className="bg-white border border-[#E7E9EE] rounded-2xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-6 space-y-3">
              <Skeleton className="h-6 w-3/5" />
              <Skeleton className="h-6 w-4/5" />
              <Skeleton className="h-6 w-2/5" />
            </div>
          ) : user?.role === 'company' ? (
            <CompanyOffersTable rows={companyQuery.data || []} />
          ) : (
            <StudentOffersTable
              rows={studentQuery.data || []}
              onRespond={(placementId, decision) => respondMutation.mutate({ placementId, decision })}
              busy={respondMutation.isPending}
            />
          )}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === 'Accepted'
      ? 'bg-green-50 text-green-700'
      : status === 'Declined' || status === 'Revoked'
        ? 'bg-red-50 text-red-700'
        : 'bg-amber-50 text-amber-700';
  return <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${cls}`}>{status}</span>;
}

function StudentOffersTable({
  rows,
  onRespond,
  busy,
}: {
  rows: StudentOffer[];
  onRespond: (placementId: number, decision: 'Accepted' | 'Declined') => void;
  busy: boolean;
}) {
  if (!rows.length) {
    return <div className="px-6 py-14 text-center text-[#5B6472]">No offers yet.</div>;
  }

  return (
    <table className="w-full text-left">
      <thead className="bg-[#F8F7F4] border-b border-[#E7E9EE]">
        <tr>
          <th className="px-6 py-4 text-xs font-semibold text-[#5B6472] uppercase">Offer</th>
          <th className="px-6 py-4 text-xs font-semibold text-[#5B6472] uppercase">CTC</th>
          <th className="px-6 py-4 text-xs font-semibold text-[#5B6472] uppercase">Status</th>
          <th className="px-6 py-4 text-xs font-semibold text-[#5B6472] uppercase text-right">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-[#E7E9EE]">
        {rows.map((o) => (
          <tr key={o.placement_id} className="hover:bg-[#F8F7F4] transition-colors">
            <td className="px-6 py-4">
              <div className="font-semibold text-[#0B1426]">{o.job_title}</div>
              <div className="text-xs text-[#5B6472]">{o.company_name}</div>
            </td>
            <td className="px-6 py-4 text-sm text-[#0B1426]">₹{o.total_ctc} LPA</td>
            <td className="px-6 py-4">
              <StatusBadge status={o.offer_status} />
            </td>
            <td className="px-6 py-4 text-right">
              <div className="inline-flex items-center gap-2">
                {o.offer_letter_url && (
                  <a
                    href={o.offer_letter_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#E7E9EE] text-sm font-medium hover:bg-[#F8F7F4]"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Letter
                  </a>
                )}
                {o.offer_status === 'Extended' && (
                  <>
                    <button
                      onClick={() => onRespond(o.placement_id, 'Accepted')}
                      disabled={busy}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0B1426] text-white text-sm font-medium hover:bg-[#1E3A5F] disabled:opacity-60"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Accept
                    </button>
                    <button
                      onClick={() => onRespond(o.placement_id, 'Declined')}
                      disabled={busy}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#E7E9EE] text-[#B42318] text-sm font-medium hover:bg-red-50 disabled:opacity-60"
                    >
                      <XCircle className="w-4 h-4" />
                      Decline
                    </button>
                  </>
                )}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function CompanyOffersTable({ rows }: { rows: CompanyOffer[] }) {
  if (!rows.length) {
    return <div className="px-6 py-14 text-center text-[#5B6472]">No offers created yet.</div>;
  }

  return (
    <table className="w-full text-left">
      <thead className="bg-[#F8F7F4] border-b border-[#E7E9EE]">
        <tr>
          <th className="px-6 py-4 text-xs font-semibold text-[#5B6472] uppercase">Candidate</th>
          <th className="px-6 py-4 text-xs font-semibold text-[#5B6472] uppercase">Job</th>
          <th className="px-6 py-4 text-xs font-semibold text-[#5B6472] uppercase">CTC</th>
          <th className="px-6 py-4 text-xs font-semibold text-[#5B6472] uppercase">Status</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-[#E7E9EE]">
        {rows.map((o) => (
          <tr key={o.placement_id} className="hover:bg-[#F8F7F4] transition-colors">
            <td className="px-6 py-4">
              <div className="font-semibold text-[#0B1426]">{o.full_name}</div>
              <div className="text-xs text-[#5B6472]">{o.email}</div>
            </td>
            <td className="px-6 py-4 text-sm text-[#0B1426]">{o.job_title}</td>
            <td className="px-6 py-4 text-sm text-[#0B1426]">₹{o.total_ctc} LPA</td>
            <td className="px-6 py-4">
              <StatusBadge status={o.offer_status} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

