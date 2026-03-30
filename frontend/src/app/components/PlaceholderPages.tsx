import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { Skeleton } from './ui/skeleton';

// ─── Types ───────────────────────────────────────────────────────────────────
interface Announcement {
  announcement_id: number;
  title: string;
  body: string;
  priority: 'Info' | 'Warning' | 'Urgent';
  target_role: 'all' | 'student' | 'company';
  created_at: string;
  expires_at: string | null;
}

interface StudentAnalytics {
  funnel: {
    total_applied: number;
    shortlisted: number;
    interviewed: number;
    selected: number;
    offers_accepted: number;
    rejected: number;
  };
  monthly_activity: { month_name: string; applications: number }[];
  top_skills_in_applied_jobs: { skill_name: string; skill_type: string; job_count: number; i_have_it: boolean }[];
}

interface CompanyAnalytics {
  response_rate: number;
  avg_time_to_hire_days: number | null;
  attention_items: { type: string; level: string; message: string }[];
}

// ─── Messages Page ────────────────────────────────────────────────────────────
export function MessagesPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [newPriority, setNewPriority] = useState<'Info' | 'Warning' | 'Urgent'>('Info');
  const [newTarget, setNewTarget] = useState<'all' | 'student' | 'company'>('all');
  const [newExpiry, setNewExpiry] = useState('');
  const [showForm, setShowForm] = useState(false);

  const { data: announcements = [], isLoading } = useQuery<Announcement[]>({
    queryKey: ['announcements'],
    queryFn: async () => {
      const res = await api.get('/admin/announcements');
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      await api.post('/admin/announcements', {
        title: newTitle,
        body: newBody,
        priority: newPriority,
        target_role: newTarget,
        expires_at: newExpiry || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      setNewTitle(''); setNewBody(''); setNewPriority('Info');
      setNewTarget('all'); setNewExpiry(''); setShowForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => { await api.delete(`/admin/announcements/${id}`); },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['announcements'] }),
  });

  const priorityColors: Record<string, string> = {
    Urgent: 'bg-red-100 text-red-700 border-red-200',
    Warning: 'bg-amber-100 text-amber-700 border-amber-200',
    Info:    'bg-blue-100 text-blue-700 border-blue-200',
  };
  const priorityDot: Record<string, string> = {
    Urgent: 'bg-red-500', Warning: 'bg-amber-500', Info: 'bg-blue-500',
  };

  return (
    <div className="p-8 max-w-[1000px] mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[2rem] font-semibold text-[#0B1426] mb-1">Messages &amp; Announcements</h1>
          <p className="text-[#5B6472]">Official notices from the placement cell</p>
        </div>
        {user?.role === 'admin' && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-[#0B1426] text-white px-5 py-2.5 rounded-xl font-medium hover:bg-[#1E3A5F] transition-all shadow-sm text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {showForm ? 'Cancel' : 'New Announcement'}
          </button>
        )}
      </div>

      {/* Admin compose form */}
      {showForm && user?.role === 'admin' && (
        <div className="bg-white rounded-2xl border border-[#E7E9EE] shadow-sm p-6 mb-6">
          <h2 className="font-semibold text-[#0B1426] mb-4">Create Announcement</h2>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full h-11 px-4 border border-[#E7E9EE] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#B6922E]"
            />
            <textarea
              placeholder="Announcement body..."
              value={newBody}
              onChange={(e) => setNewBody(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-[#E7E9EE] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#B6922E] resize-none"
            />
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-[#5B6472] uppercase mb-1 block">Priority</label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as any)}
                  className="w-full h-10 px-3 border border-[#E7E9EE] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#B6922E]"
                >
                  <option>Info</option>
                  <option>Warning</option>
                  <option>Urgent</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#5B6472] uppercase mb-1 block">Target</label>
                <select
                  value={newTarget}
                  onChange={(e) => setNewTarget(e.target.value as any)}
                  className="w-full h-10 px-3 border border-[#E7E9EE] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#B6922E]"
                >
                  <option value="all">Everyone</option>
                  <option value="student">Students only</option>
                  <option value="company">Companies only</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#5B6472] uppercase mb-1 block">Expires (optional)</label>
                <input
                  type="date"
                  value={newExpiry}
                  onChange={(e) => setNewExpiry(e.target.value)}
                  className="w-full h-10 px-3 border border-[#E7E9EE] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#B6922E]"
                />
              </div>
            </div>
            <button
              onClick={() => createMutation.mutate()}
              disabled={!newTitle || !newBody || createMutation.isPending}
              className="px-6 py-2.5 bg-[#0B1426] text-white rounded-xl text-sm font-medium hover:bg-[#1E3A5F] transition-all disabled:opacity-50"
            >
              {createMutation.isPending ? 'Posting...' : 'Post Announcement'}
            </button>
          </div>
        </div>
      )}

      {/* Announcements list */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-[#E7E9EE] p-6">
              <Skeleton className="h-5 w-48 mb-3" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>
      ) : announcements.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E7E9EE] shadow-sm p-16 text-center">
          <div className="w-16 h-16 bg-[#F8F7F4] rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[#B6922E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-[#0B1426] mb-2">No announcements</h3>
          <p className="text-[#5B6472] max-w-sm mx-auto">Check back later for updates from the placement cell.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((ann) => (
            <div
              key={ann.announcement_id}
              className="bg-white rounded-2xl border border-[#E7E9EE] shadow-sm p-6 hover:border-[#B6922E]/30 transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className={`mt-1 w-2.5 h-2.5 rounded-full flex-shrink-0 ${priorityDot[ann.priority]}`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="font-semibold text-[#0B1426] text-base">{ann.title}</h3>
                      <span className={`px-2 py-0.5 rounded-md text-xs font-medium border ${priorityColors[ann.priority]}`}>
                        {ann.priority}
                      </span>
                      {ann.target_role !== 'all' && (
                        <span className="px-2 py-0.5 rounded-md text-xs font-medium border border-[#E7E9EE] text-[#5B6472] bg-[#F8F7F4]">
                          {ann.target_role === 'student' ? 'Students' : 'Companies'}
                        </span>
                      )}
                    </div>
                    <p className="text-[#374151] text-sm leading-relaxed whitespace-pre-wrap">{ann.body}</p>
                    <div className="mt-3 flex items-center gap-4 text-xs text-[#5B6472]">
                      <span>Posted {new Date(ann.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      {ann.expires_at && <span>· Expires {new Date(ann.expires_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                    </div>
                  </div>
                </div>
                {user?.role === 'admin' && (
                  <button
                    onClick={() => deleteMutation.mutate(ann.announcement_id)}
                    className="p-1.5 text-[#5B6472] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                    title="Delete announcement"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Analytics Page ───────────────────────────────────────────────────────────
export function AnalyticsPage() {
  const { user } = useAuthStore();

  const studentQuery = useQuery<StudentAnalytics>({
    queryKey: ['studentAnalytics'],
    queryFn: async () => { const r = await api.get('/student/analytics'); return r.data; },
    enabled: user?.role === 'student',
  });

  const companyQuery = useQuery<CompanyAnalytics>({
    queryKey: ['companyHealth'],
    queryFn: async () => { const r = await api.get('/company/dashboard/health'); return r.data; },
    enabled: user?.role === 'company',
  });

  if (user?.role === 'student') {
    return <StudentAnalyticsView data={studentQuery.data} loading={studentQuery.isLoading} />;
  }
  if (user?.role === 'company') {
    return <CompanyAnalyticsView data={companyQuery.data} loading={companyQuery.isLoading} />;
  }
  return (
    <div className="p-8 max-w-[900px] mx-auto">
      <h1 className="text-[2rem] font-semibold text-[#0B1426] mb-2">Analytics</h1>
      <p className="text-[#5B6472]">Platform analytics are available in the Admin Reports section.</p>
    </div>
  );
}

function FunnelBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1.5">
        <span className="text-[#374151] font-medium">{label}</span>
        <span className="text-[#0B1426] font-semibold tabular-nums">{value}</span>
      </div>
      <div className="h-2.5 bg-[#F3F4F6] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <div className="text-xs text-[#5B6472] mt-1">{pct}% of total</div>
    </div>
  );
}

function StudentAnalyticsView({ data, loading }: { data?: StudentAnalytics; loading: boolean }) {
  const f = data?.funnel;
  const total = f?.total_applied || 1;
  const maxMonth = Math.max(...(data?.monthly_activity || []).map((m) => m.applications), 1);

  return (
    <div className="p-8 max-w-[1100px] mx-auto">
      <div className="mb-8">
        <h1 className="text-[2rem] font-semibold text-[#0B1426] mb-1">My Analytics</h1>
        <p className="text-[#5B6472]">Your personal placement journey at a glance</p>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Application Funnel */}
        <div className="bg-white rounded-2xl border border-[#E7E9EE] shadow-sm p-6">
          <h3 className="font-semibold text-[#0B1426] mb-5">Application Funnel</h3>
          {loading ? (
            <div className="space-y-4">{[1,2,3,4].map((i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
          ) : (
            <div className="space-y-4">
              <FunnelBar label="Applied"        value={f?.total_applied || 0}   max={total} color="#0B1426" />
              <FunnelBar label="Shortlisted"    value={f?.shortlisted || 0}     max={total} color="#1E3A5F" />
              <FunnelBar label="Interviewed"    value={f?.interviewed || 0}     max={total} color="#B6922E" />
              <FunnelBar label="Selected"       value={f?.selected || 0}        max={total} color="#1F6F43" />
              <FunnelBar label="Offer Accepted" value={f?.offers_accepted || 0} max={total} color="#059669" />
            </div>
          )}
        </div>

        {/* Monthly Activity */}
        <div className="bg-white rounded-2xl border border-[#E7E9EE] shadow-sm p-6">
          <h3 className="font-semibold text-[#0B1426] mb-5">Monthly Applications (last 6 months)</h3>
          {loading ? (
            <div className="space-y-4">{[1,2,3].map((i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
          ) : data?.monthly_activity?.length ? (
            <div className="space-y-3">
              {data.monthly_activity.map((m) => {
                const pct = Math.round((m.applications / maxMonth) * 100);
                return (
                  <div key={m.month_name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-[#374151] font-medium">{m.month_name}</span>
                      <span className="text-[#0B1426] font-semibold tabular-nums">{m.applications}</span>
                    </div>
                    <div className="h-2.5 bg-[#F3F4F6] rounded-full overflow-hidden">
                      <div className="h-full bg-[#B6922E] rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-[#5B6472] pt-4">No application activity in the last 6 months.</p>
          )}
        </div>
      </div>

      {/* Skill Gap Analysis */}
      <div className="bg-white rounded-2xl border border-[#E7E9EE] shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-[#0B1426]">Skills in Jobs You Applied To</h3>
          <div className="flex items-center gap-4 text-xs text-[#5B6472]">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#1F6F43] inline-block" />You have it</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#E7E9EE] border border-[#cbd5e1] inline-block" />Skill gap</span>
          </div>
        </div>
        {loading ? (
          <div className="flex flex-wrap gap-3">{[1,2,3,4,5].map((i) => <Skeleton key={i} className="h-8 w-24 rounded-full" />)}</div>
        ) : data?.top_skills_in_applied_jobs?.length ? (
          <div className="flex flex-wrap gap-3">
            {data.top_skills_in_applied_jobs.map((s) => (
              <div
                key={s.skill_name}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-full border text-sm font-medium transition-all ${
                  s.i_have_it
                    ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#1F6F43]'
                    : 'bg-[#F8F7F4] border-[#E7E9EE] text-[#5B6472]'
                }`}
              >
                <span>{s.skill_name}</span>
                <span className="text-xs opacity-70">×{s.job_count}</span>
                {s.i_have_it && (
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#5B6472]">Apply to jobs to see skill insights here.</p>
        )}
      </div>
    </div>
  );
}

function CompanyAnalyticsView({ data, loading }: { data?: CompanyAnalytics; loading: boolean }) {
  return (
    <div className="p-8 max-w-[900px] mx-auto">
      <div className="mb-8">
        <h1 className="text-[2rem] font-semibold text-[#0B1426] mb-1">Recruitment Analytics</h1>
        <p className="text-[#5B6472]">Real-time metrics from your hiring pipeline</p>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-2xl border border-[#E7E9EE] shadow-sm p-6">
          <p className="text-xs font-semibold text-[#5B6472] uppercase tracking-wider mb-3">Application Response Rate</p>
          {loading ? <Skeleton className="h-16 w-32" /> : (
            <>
              <p className="text-5xl font-bold text-[#0B1426] tabular-nums mb-2">{data?.response_rate ?? 0}<span className="text-2xl text-[#5B6472] font-normal">%</span></p>
              <div className="h-2 bg-[#F3F4F6] rounded-full overflow-hidden mt-3">
                <div className="h-full bg-[#B6922E] rounded-full" style={{ width: `${data?.response_rate ?? 0}%` }} />
              </div>
              <p className="text-xs text-[#5B6472] mt-2">Applications reviewed vs. total received</p>
            </>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-[#E7E9EE] shadow-sm p-6">
          <p className="text-xs font-semibold text-[#5B6472] uppercase tracking-wider mb-3">Avg. Time to Hire</p>
          {loading ? <Skeleton className="h-16 w-32" /> : (
            <>
              <p className="text-5xl font-bold text-[#0B1426] tabular-nums mb-2">
                {data?.avg_time_to_hire_days != null ? data.avg_time_to_hire_days : '—'}
                <span className="text-2xl text-[#5B6472] font-normal ml-1">{data?.avg_time_to_hire_days != null ? 'days' : ''}</span>
              </p>
              <p className="text-xs text-[#5B6472] mt-5">From application submission to placement</p>
            </>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#E7E9EE] shadow-sm p-6">
        <h3 className="font-semibold text-[#0B1426] mb-4">Action Items</h3>
        {loading ? (
          <div className="space-y-3">{[1,2].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : data?.attention_items?.length ? (
          <div className="space-y-3">
            {data.attention_items.map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-[#F8F7F4]">
                <div className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${item.level === 'warning' ? 'bg-amber-500' : 'bg-blue-400'}`} />
                <p className="text-sm text-[#374151]">{item.message}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#5B6472]">No outstanding action items. Great work!</p>
        )}
      </div>
    </div>
  );
}

// ─── Settings Page ────────────────────────────────────────────────────────────
export function SettingsPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwMsg, setPwMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [pwLoading, setPwLoading] = useState(false);

  // Profile fields
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Student profile fields
  const profileQuery = useQuery({
    queryKey: [user?.role === 'student' ? 'studentProfile' : user?.role === 'company' ? 'companyProfile' : 'none'],
    queryFn: async () => {
      if (user?.role === 'student') { const r = await api.get('/student/profile'); return r.data; }
      if (user?.role === 'company') { const r = await api.get('/company/profile'); return r.data; }
      return null;
    },
    enabled: user?.role === 'student' || user?.role === 'company',
  });

  const [fields, setFields] = useState<Record<string, string>>({});
  const profileData = profileQuery.data;

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(null);
    if (newPw !== confirmPw) { setPwMsg({ type: 'error', text: 'New passwords do not match.' }); return; }
    if (newPw.length < 6) { setPwMsg({ type: 'error', text: 'Password must be at least 6 characters.' }); return; }
    setPwLoading(true);
    try {
      await api.put('/auth/change-password', { current_password: currentPw, new_password: newPw });
      setPwMsg({ type: 'success', text: 'Password changed successfully.' });
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch (err: any) {
      setPwMsg({ type: 'error', text: err?.response?.data?.error || 'Failed to change password.' });
    } finally {
      setPwLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    setProfileLoading(true);
    try {
      const endpoint = user?.role === 'student' ? '/student/profile' : '/company/profile';
      await api.put(endpoint, fields);
      setProfileMsg({ type: 'success', text: 'Profile updated successfully.' });
      queryClient.invalidateQueries({ queryKey: [user?.role === 'student' ? 'studentProfile' : 'companyProfile'] });
      setFields({});
    } catch (err: any) {
      setProfileMsg({ type: 'error', text: err?.response?.data?.error || 'Failed to update profile.' });
    } finally {
      setProfileLoading(false);
    }
  };

  const studentFields = [
    { key: 'phone', label: 'Phone Number', type: 'tel', placeholder: profileData?.phone || 'e.g. +91 9876543210' },
    { key: 'cgpa', label: 'CGPA', type: 'number', placeholder: profileData?.cgpa?.toString() || '0.0' },
    { key: 'resume_url', label: 'Resume URL', type: 'url', placeholder: profileData?.resume_url || 'Google Drive / Dropbox link' },
  ];

  const companyFields = [
    { key: 'industry', label: 'Industry', type: 'text', placeholder: profileData?.industry || '' },
    { key: 'website', label: 'Website', type: 'url', placeholder: profileData?.website || '' },
    { key: 'hr_name', label: 'HR Name', type: 'text', placeholder: profileData?.hr_name || '' },
    { key: 'hr_email', label: 'HR Email', type: 'email', placeholder: profileData?.hr_email || '' },
    { key: 'hr_phone', label: 'HR Phone', type: 'tel', placeholder: profileData?.hr_phone || '' },
  ];

  const editableFields = user?.role === 'student' ? studentFields : user?.role === 'company' ? companyFields : [];

  return (
    <div className="p-8 max-w-[780px] mx-auto">
      <div className="mb-8">
        <h1 className="text-[2rem] font-semibold text-[#0B1426] mb-1">Account Settings</h1>
        <p className="text-[#5B6472]">Manage your profile and security preferences</p>
      </div>

      <div className="space-y-6">
        {/* Profile Info */}
        <div className="bg-white rounded-2xl border border-[#E7E9EE] shadow-sm p-6">
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-[#E7E9EE]">
            <div className="w-14 h-14 rounded-full bg-[#0B1426] flex items-center justify-center">
              <span className="text-white text-xl font-semibold">{user?.username?.charAt(0)?.toUpperCase()}</span>
            </div>
            <div>
              <p className="font-semibold text-[#0B1426] text-lg">{user?.username}</p>
              <p className="text-sm text-[#5B6472] capitalize">{user?.role}</p>
            </div>
          </div>

          {editableFields.length > 0 && (
            <form onSubmit={handleProfileUpdate}>
              <h3 className="font-semibold text-[#0B1426] mb-4">Update Profile</h3>
              <div className="grid grid-cols-1 gap-4 mb-4">
                {editableFields.map((f) => (
                  <div key={f.key}>
                    <label className="block text-xs font-semibold text-[#5B6472] uppercase tracking-wider mb-1.5">{f.label}</label>
                    <input
                      type={f.type}
                      placeholder={f.placeholder}
                      value={fields[f.key] ?? ''}
                      onChange={(e) => setFields((prev) => ({ ...prev, [f.key]: e.target.value }))}
                      step={f.key === 'cgpa' ? '0.01' : undefined}
                      min={f.key === 'cgpa' ? '0' : undefined}
                      max={f.key === 'cgpa' ? '10' : undefined}
                      className="w-full h-11 px-4 border border-[#E7E9EE] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#B6922E] bg-white"
                    />
                  </div>
                ))}
              </div>
              {profileMsg && (
                <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${profileMsg.type === 'success' ? 'bg-[#ECFDF5] text-[#1F6F43]' : 'bg-red-50 text-red-700'}`}>
                  {profileMsg.text}
                </div>
              )}
              <button
                type="submit"
                disabled={profileLoading || Object.keys(fields).length === 0}
                className="px-6 py-2.5 bg-[#0B1426] text-white rounded-xl text-sm font-medium hover:bg-[#1E3A5F] transition-all disabled:opacity-50"
              >
                {profileLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          )}
        </div>

        {/* Change Password */}
        <div className="bg-white rounded-2xl border border-[#E7E9EE] shadow-sm p-6">
          <h3 className="font-semibold text-[#0B1426] mb-4">Change Password</h3>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#5B6472] uppercase tracking-wider mb-1.5">Current Password</label>
              <input
                type="password"
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                placeholder="Enter current password"
                className="w-full h-11 px-4 border border-[#E7E9EE] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#B6922E]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#5B6472] uppercase tracking-wider mb-1.5">New Password</label>
              <input
                type="password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full h-11 px-4 border border-[#E7E9EE] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#B6922E]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#5B6472] uppercase tracking-wider mb-1.5">Confirm New Password</label>
              <input
                type="password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                placeholder="Repeat new password"
                className="w-full h-11 px-4 border border-[#E7E9EE] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#B6922E]"
              />
            </div>
            {pwMsg && (
              <div className={`px-4 py-3 rounded-xl text-sm font-medium ${pwMsg.type === 'success' ? 'bg-[#ECFDF5] text-[#1F6F43]' : 'bg-red-50 text-red-700'}`}>
                {pwMsg.text}
              </div>
            )}
            <button
              type="submit"
              disabled={pwLoading || !currentPw || !newPw || !confirmPw}
              className="px-6 py-2.5 bg-[#0B1426] text-white rounded-xl text-sm font-medium hover:bg-[#1E3A5F] transition-all disabled:opacity-50"
            >
              {pwLoading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
