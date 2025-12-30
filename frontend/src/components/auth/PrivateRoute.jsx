import { Navigate, useLocation } from "react-router-dom";

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  const location = useLocation();

  // Allow access to woreda routes without authentication
  if (window.location.pathname.startsWith("/woreda-dashboard")) {
    return children;
  }

  // For all other routes, require authentication
  if (!token) {
    const redirectUrl = `/login?redirect=${encodeURIComponent(location.pathname)}`;
    return <Navigate to={redirectUrl} />;
  }

  return children;
};

export default PrivateRoute;
