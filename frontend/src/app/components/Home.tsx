import { useAuthStore } from "@/store/authStore";
import { Navigate } from "react-router";

export function Home() {
  const { user } = useAuthStore();
  
  if (user?.role === 'company') {
    return <Navigate to="/company/dashboard" replace />;
  }

  if (user?.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }
  
  return <Navigate to="/dashboard" replace />;
}
