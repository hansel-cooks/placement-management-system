import { NavLink } from "react-router";
import { 
  LayoutDashboard, 
  Briefcase, 
  FileText, 
  Calendar, 
  FolderOpen, 
  Settings,
  Users,
  Building2,
  ShieldCheck,
  BarChart3
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";

export function Sidebar() {
  const { user } = useAuthStore();
  
  const studentItems = [
    { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { to: "/applications", label: "Applications", icon: FileText },
    { to: "/interviews", label: "Interviews", icon: Calendar },
    { to: "/offers", label: "Offers", icon: Briefcase },
    { to: "/documents", label: "Documents", icon: FolderOpen },
    { to: "/settings", label: "Settings", icon: Settings },
  ];

  const recruiterItems = [
    { to: "/company/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: false },
    { to: "/company/jobs", label: "Job Postings", icon: Briefcase, exact: false },
    { to: "/company/applicants", label: "Applicants", icon: Users, exact: false },
    { to: "/interviews", label: "Interviews", icon: Calendar, exact: false },
    { to: "/offers", label: "Offers", icon: Briefcase, exact: false },
    { to: "/settings", label: "Settings", icon: Settings, exact: false },
  ];

  const adminItems = [
    { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: false },
    { to: "/admin/companies", label: "Companies", icon: Building2, exact: false },
    { to: "/admin/jobs", label: "Job Approvals", icon: ShieldCheck, exact: false },
    { to: "/admin/reports", label: "Reports", icon: BarChart3, exact: false },
    { to: "/settings", label: "Settings", icon: Settings, exact: false },
  ];

  const navItems = user?.role === 'admin' ? adminItems : user?.role === 'company' ? recruiterItems : studentItems;

  return (
    <aside className="w-[264px] h-screen bg-[#0B1426] flex flex-col fixed left-0 top-0">
      {/* Header */}
      <div className="px-6 py-8 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#B6922E] flex items-center justify-center">
            <span className="text-white text-lg font-semibold">U</span>
          </div>
          <div>
            <h1 className="text-white text-base font-semibold tracking-tight">
              Career Services
            </h1>
            <p className="text-white/60 text-xs">Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-xl
                transition-all duration-200
                ${isActive 
                  ? 'bg-[#B6922E]/10 text-white' 
                  : 'text-white/60 hover:text-white hover:bg-white/5'
                }
              `}
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-5 h-5 ${isActive ? 'text-[#B6922E]' : ''}`} />
                  <span className="text-[15px] font-medium">{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-6 border-t border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
            <span className="text-white text-sm font-medium">
              {user?.username?.charAt(0) || 'S'}
            </span>
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-white text-sm font-medium truncate">
              {user?.username || 'User'}
            </p>
            <p className="text-white/60 text-xs truncate">
              {user?.role === 'company' ? 'Recruiter' : user?.role === 'admin' ? 'Admin' : 'Student'}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
