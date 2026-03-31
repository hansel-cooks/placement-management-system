import { Outlet, Navigate } from 'react-router';
import { useEffect } from 'react';
import { Sidebar } from './sidebar';
import { TopBar } from './top-bar';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';

export function DashboardLayout() {
  const { isAuthenticated, hasHydrated, isHydrating, setUser, setHydration, logoutLocal } = useAuthStore();

  useEffect(() => {
    let cancelled = false;
    async function hydrate() {
      // Avoid refetch loops; we only need to confirm session once on boot.
      if (hasHydrated || isHydrating) return;
      setHydration({ isHydrating: true, hasHydrated: false });
      try {
        const res = await api.get('/auth/me');
        if (cancelled) return;
        setUser({
          user_id: res.data.user_id,
          username: res.data.username,
          name: res.data.name,
          role: res.data.role,
          entity_id: res.data.entity_id,
        });
      } catch {
        if (cancelled) return;
        logoutLocal();
      } finally {
        if (cancelled) return;
        setHydration({ isHydrating: false, hasHydrated: true });
      }
    }
    hydrate();
    return () => {
      cancelled = true;
    };
  }, [hasHydrated, isHydrating, logoutLocal, setHydration, setUser]);

  // Guard: if not authenticated, redirect to login
  if (!isAuthenticated && hasHydrated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-[#F8F7F4]">
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden ml-[264px]">
        <TopBar />

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

