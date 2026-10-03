import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import type { UserRole } from "../types";

export function RequireAuth({ role }: { role?: UserRole }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) {
    const loginPath =
      role === "STUDENT" ? "/login/student" : "/login/institution";
    return (
      <Navigate to={loginPath} replace state={{ from: location.pathname }} />
    );
  }
  if (role && user.role !== role) {
    return (
      <Navigate
        to={user.role === "ADMIN" ? "/admin/dashboard" : "/student/dashboard"}
        replace
      />
    );
  }
  return <Outlet />;
}
