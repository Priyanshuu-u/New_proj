import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

export default function ProtectedRoute({ allow, children }) {
  const { user } = useAuth();

  if (!user || !user.role) {
    return <Navigate to="/login" replace />;
  }

  if (allow && !allow.includes(user.role)) {
    return (
      <Navigate
        to={user.role === "examiner" ? "/dashboard" : "/home"}
        replace
      />
    );
  }

  return children;
}
