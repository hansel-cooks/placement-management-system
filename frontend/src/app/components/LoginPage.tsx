import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';

type Role = 'student' | 'recruiter';

export function LoginPage() {
  const [role, setRole] = useState<Role>('student');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { username, password });
      const { user } = res.data;
      setUser({
        user_id: user.user_id,
        username: user.username,
        role: user.role,
        entity_id: user.entity_id,
      });
      navigate(user.role === 'company' ? '/company/dashboard' : user.role === 'admin' ? '/admin/dashboard' : '/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: "'Inter', sans-serif" }}>
      {/* LEFT PANEL — Midnight Navy */}
      <div
        style={{
          width: '45%',
          background: 'linear-gradient(148deg, #0B1426 60%, #1E3A5F 100%)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '48px 56px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Top — University crest + name */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                border: '2px solid #B6922E',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#B6922E" strokeWidth="1.8">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c3.33 1.67 8.67 1.67 12 0v-5" />
              </svg>
            </div>
            <div>
              <div style={{ color: '#FFFFFF', fontWeight: 700, fontSize: '15px', letterSpacing: '0.01em' }}>
                University Careers Portal
              </div>
              <div style={{ color: '#B6922E', fontSize: '11px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: '1px' }}>
                Office of Career Services
              </div>
            </div>
          </div>
        </div>

        {/* Middle — headline */}
        <div>
          <div
            style={{
              width: 56,
              height: 2,
              background: '#B6922E',
              marginBottom: 32,
            }}
          />
          <h1
            style={{
              color: '#FFFFFF',
              fontSize: '36px',
              fontWeight: 700,
              lineHeight: 1.2,
              letterSpacing: '-0.02em',
              margin: 0,
              marginBottom: 20,
            }}
          >
            Where talent meets opportunity.
          </h1>
          <p
            style={{
              color: 'rgba(255,255,255,0.55)',
              fontSize: '15px',
              lineHeight: 1.7,
              margin: 0,
              maxWidth: 360,
            }}
          >
            The university's centralised placement platform. Manage your pipeline,
            track applications, and connect with leading recruiters — all in one place.
          </p>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 40, marginTop: 48 }}>
            {[
              { value: '94%', label: 'Placement Rate' },
              { value: '₹18L', label: 'Median Package' },
              { value: '240+', label: 'Recruiters' },
            ].map((s) => (
              <div key={s.label}>
                <div style={{ color: '#B6922E', fontSize: '22px', fontWeight: 700, letterSpacing: '-0.01em' }}>{s.value}</div>
                <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '12px', marginTop: 4, letterSpacing: '0.04em' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: '12px' }}>
          © {new Date().getFullYear()} University Careers &amp; Placements. All rights reserved.
        </div>

        {/* Decorative circle */}
        <div
          style={{
            position: 'absolute',
            bottom: -120,
            right: -120,
            width: 360,
            height: 360,
            borderRadius: '50%',
            border: '1px solid rgba(182,146,46,0.12)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -60,
            right: -60,
            width: 220,
            height: 220,
            borderRadius: '50%',
            border: '1px solid rgba(182,146,46,0.08)',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* RIGHT PANEL — White */}
      <div
        style={{
          flex: 1,
          background: '#F8F7F4',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px',
        }}
      >
        <div style={{ width: '100%', maxWidth: 420 }}>
          <div style={{ marginBottom: 40 }}>
            <h2 style={{ margin: 0, fontSize: '26px', fontWeight: 700, color: '#111827', letterSpacing: '-0.01em' }}>
              Sign in to your account
            </h2>
            <p style={{ margin: '8px 0 0', color: '#5B6472', fontSize: '14px' }}>
              Select your portal and enter your credentials.
            </p>
          </div>

          {/* Role Toggle */}
          <div
            style={{
              display: 'flex',
              background: '#FFFFFF',
              border: '1px solid #E7E9EE',
              borderRadius: '10px',
              padding: '4px',
              marginBottom: '28px',
            }}
          >
            {(['student', 'recruiter'] as Role[]).map((r) => (
              <button
                key={r}
                onClick={() => { setRole(r); setError(''); }}
                style={{
                  flex: 1,
                  padding: '9px 16px',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  background: role === r ? '#0B1426' : 'transparent',
                  color: role === r ? '#FFFFFF' : '#5B6472',
                  letterSpacing: '0.01em',
                }}
              >
                {r === 'student' ? 'Student Portal' : 'Recruiter Portal'}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label
                htmlFor="username"
                style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}
              >
                Username or Email
              </label>
              <input
                id="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={role === 'student' ? 'you@university.edu' : 'recruiter@company.com'}
                style={{
                  width: '100%',
                  height: '46px',
                  padding: '0 16px',
                  border: '1px solid #E7E9EE',
                  borderRadius: '10px',
                  fontSize: '14px',
                  background: '#FFFFFF',
                  color: '#111827',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#B6922E')}
                onBlur={(e) => (e.target.style.borderColor = '#E7E9EE')}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label
                  htmlFor="password"
                  style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}
                >
                  Password
                </label>
                <button
                  type="button"
                  style={{ fontSize: '12px', color: '#B6922E', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  Forgot password?
                </button>
              </div>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                style={{
                  width: '100%',
                  height: '46px',
                  padding: '0 16px',
                  border: '1px solid #E7E9EE',
                  borderRadius: '10px',
                  fontSize: '14px',
                  background: '#FFFFFF',
                  color: '#111827',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#B6922E')}
                onBlur={(e) => (e.target.style.borderColor = '#E7E9EE')}
              />
            </div>

            {error && (
              <div
                style={{
                  padding: '12px 16px',
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  borderRadius: '8px',
                  color: '#B42318',
                  fontSize: '13px',
                  fontWeight: 500,
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                height: '46px',
                background: loading ? '#374151' : '#0B1426',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                letterSpacing: '0.01em',
                transition: 'background 0.15s',
                marginTop: '4px',
              }}
              onMouseEnter={(e) => { if (!loading) (e.target as HTMLButtonElement).style.background = '#1E3A5F'; }}
              onMouseLeave={(e) => { if (!loading) (e.target as HTMLButtonElement).style.background = '#0B1426'; }}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
