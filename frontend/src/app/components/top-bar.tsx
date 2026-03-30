import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router";
import { Search, Bell, ChevronDown, User, LogOut, Info } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";

export function TopBar() {
  const { user, logoutLocal } = useAuthStore();
  const navigate = useNavigate();
  const profilePath =
    user?.role === 'student' ? '/documents' : user?.role === 'company' ? '/company/dashboard' : '/admin/dashboard';
  
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const profileRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfile(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }

    function handleEsc(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setShowProfile(false);
        setShowNotifications(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      logoutLocal();
      navigate("/login");
    }
  };

  const toggleProfile = () => {
    setShowNotifications(false);
    setShowProfile(!showProfile);
  };

  const toggleNotifications = () => {
    setShowProfile(false);
    setShowNotifications(!showNotifications);
  };

  return (
    <header className="h-[72px] bg-white border-b border-[#E5E7EB] flex items-center justify-between px-8 relative z-50">
      {/* Search */}
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#5B6472]" />
          <input
            type="text"
            placeholder="Search opportunities, companies, or documents..."
            className="w-full h-12 pl-12 pr-4 bg-[#F8F7F4] border border-[#E5E7EB] rounded-xl text-[15px] placeholder:text-[#5B6472] focus:outline-none focus:ring-2 focus:ring-[#B6922E]/20 focus:border-[#B6922E]"
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4 ml-8">
        {/* Notifications */}
        <div className="relative" ref={notificationsRef}>
          <button 
            onClick={toggleNotifications}
            onKeyDown={(e) => (e.key === ' ' || e.key === 'Enter') && toggleNotifications()}
            className={`relative p-2 rounded-xl transition-colors ${showNotifications ? 'bg-[#F8F7F4]' : 'hover:bg-[#F8F7F4]'}`}
            aria-label="Notifications"
            aria-expanded={showNotifications}
          >
            <Bell className="w-5 h-5 text-[#5B6472]" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#B42318] rounded-full"></span>
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-[#E5E7EB] rounded-2xl shadow-[0_12px_24px_rgba(0,0,0,0.1)] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-6 py-4 border-b border-[#F3F4F6]">
                <h3 className="font-semibold text-[#0B1426]">Notifications</h3>
              </div>
              <div className="p-8 text-center">
                <div className="w-12 h-12 bg-[#F8F7F4] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Info className="w-6 h-6 text-[#5B6472]" />
                </div>
                <p className="text-sm text-[#5B6472]">This feature is coming soon.</p>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <button className="px-4 py-2.5 bg-[#0B1426] text-white rounded-xl hover:bg-[#111827] transition-colors text-sm font-medium">
          {user?.role === 'student' ? 'Quick Apply' : 'Post Job'}
        </button>

        {/* Profile */}
        <div className="relative" ref={profileRef}>
          <button 
            onClick={toggleProfile}
            onKeyDown={(e) => (e.key === ' ' || e.key === 'Enter') && toggleProfile()}
            className={`flex items-center gap-2 pl-2 pr-3 py-2 rounded-xl transition-colors ${showProfile ? 'bg-[#F8F7F4]' : 'hover:bg-[#F8F7F4]'}`}
            aria-expanded={showProfile}
            aria-label="Profile menu"
          >
            <div className="w-8 h-8 rounded-full bg-[#B6922E]/10 flex items-center justify-center">
              <span className="text-[#B6922E] text-sm font-semibold">
                {user?.username?.charAt(0) || 'S'}
              </span>
            </div>
            <ChevronDown className={`w-4 h-4 text-[#5B6472] transition-transform duration-200 ${showProfile ? 'rotate-180' : ''}`} />
          </button>

          {/* Profile Dropdown */}
          {showProfile && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-[#E5E7EB] rounded-2xl shadow-[0_12px_24px_rgba(0,0,0,0.1)] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-3 border-b border-[#F3F4F6]">
                <p className="text-sm font-semibold text-[#0B1426]">{user?.username || 'User'}</p>
                <p className="text-xs text-[#5B6472] truncate">{user?.role}</p>
              </div>
              <div className="p-1.5">
                <Link 
                  to={profilePath}
                  onClick={() => setShowProfile(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-sm text-[#5B6472] hover:bg-[#F8F7F4] hover:text-[#0B1426] rounded-lg transition-colors group"
                >
                  <User className="w-4 h-4 group-hover:text-[#B6922E]" />
                  Profile
                </Link>
                <div className="h-px bg-[#F3F4F6] my-1.5 mx-1.5" />
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[#B42318] hover:bg-red-50 rounded-lg transition-colors group text-left"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
