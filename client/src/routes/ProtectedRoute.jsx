import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, allowedRoles }) {
  const role = localStorage.getItem("role");
  const token = localStorage.getItem("token");

  if (!token || !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
