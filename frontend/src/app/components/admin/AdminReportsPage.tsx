import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import adminService from '@/lib/services/adminService';
import { Skeleton } from '../ui/skeleton';

const REPORTS: { key: string; label: string; description: string }[] = [
  { key: 'departments', label: 'Departments', description: 'Department-wise placement stats' },
  { key: 'top-companies', label: 'Top Companies', description: 'Top recruiters by CTC and conversion' },
  { key: 'skills', label: 'Skills', description: 'Most in-demand skills and placement rate' },
  { key: 'ctc-bands', label: 'CTC Bands', description: 'Placement distribution by compensation bands' },
  { key: 'monthly-trend', label: 'Monthly Trend', description: 'Month-wise placements trend' },
  { key: 'at-risk-students', label: 'At-risk Students', description: 'Unplaced students with high rejection rates' },
];

function JsonTable({ rows }: { rows: any[] }) {
  const cols = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => Object.keys(r || {}).forEach((k) => set.add(k)));
    return Array.from(set);
  }, [rows]);

  if (!rows.length) {
    return <div className="px-6 py-12 text-center text-[#5B6472]">No data.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead className="bg-[#F8F7F4] border-b border-[#E7E9EE]">
          <tr>
            {cols.map((c) => (
              <th key={c} className="px-6 py-4 text-xs font-semibold text-[#5B6472] uppercase">
                {c.replaceAll('_', ' ')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E7E9EE]">
          {rows.map((r, idx) => (
            <tr key={idx} className="hover:bg-[#F8F7F4] transition-colors">
              {cols.map((c) => (
                <td key={c} className="px-6 py-4 text-sm text-[#0B1426] whitespace-nowrap">
                  {r?.[c] === null || typeof r?.[c] === 'undefined' ? '—' : String(r[c])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AdminReportsPage() {
  const [active, setActive] = useState(REPORTS[0].key);
  const meta = REPORTS.find((r) => r.key === active)!;

  const { data, isLoading, error } = useQuery({
    queryKey: ['adminReport', active],
    queryFn: () => adminService.getReport(active),
  });

  return (
    <div className="p-8 max-w-[1440px] mx-auto">
      <div className="mb-8">
        <h1 className="text-[2rem] font-semibold text-[#0B1426] mb-2">Reports & Analytics</h1>
        <p className="text-[#5B6472]">Production KPIs computed from real placement data</p>
      </div>

      <div className="flex items-center gap-2 mb-6 border-b border-[#E7E9EE]">
        {REPORTS.map((r) => (
          <button
            key={r.key}
            onClick={() => setActive(r.key)}
            className={`px-4 py-3 text-sm font-medium transition-colors relative ${
              active === r.key ? 'text-[#B6922E]' : 'text-[#5B6472] hover:text-[#0B1426]'
            }`}
          >
            {r.label}
            {active === r.key && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#B6922E]" />}
          </button>
        ))}
      </div>

      <div className="bg-white border border-[#E7E9EE] rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-[#E7E9EE]">
          <div className="font-semibold text-[#0B1426]">{meta.label}</div>
          <div className="text-sm text-[#5B6472]">{meta.description}</div>
        </div>

        {error ? (
          <div className="px-6 py-12 text-center text-[#B42318]">Failed to load report.</div>
        ) : isLoading ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-6 w-2/5" />
            <Skeleton className="h-6 w-3/5" />
            <Skeleton className="h-6 w-4/5" />
          </div>
        ) : (
          <JsonTable rows={Array.isArray(data) ? data : []} />
        )}
      </div>
    </div>
  );
}

