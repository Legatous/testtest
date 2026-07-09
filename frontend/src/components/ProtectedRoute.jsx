import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Wrap any page in <ProtectedRoute> to require login.
// Pass role="admin" to additionally require the admin role.
export default function ProtectedRoute({ children, role }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;

  return children;
}
