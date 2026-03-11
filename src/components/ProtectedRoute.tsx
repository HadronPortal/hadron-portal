import { Navigate } from 'react-router-dom';

function isTokenValid(token: string | null): boolean {
  if (!token) return false;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const payload = JSON.parse(atob(parts[1]));
    // Check expiry (exp is in seconds)
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      localStorage.removeItem('hadron_token');
      localStorage.removeItem('hadron_user');
      return false;
    }
    return true;
  } catch {
    localStorage.removeItem('hadron_token');
    localStorage.removeItem('hadron_user');
    return false;
  }
}

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('hadron_token');
  if (!isTokenValid(token)) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

export default ProtectedRoute;
