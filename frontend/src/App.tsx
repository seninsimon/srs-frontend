import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SessionsList from './pages/SessionsList';
import SessionMonitor from './pages/SessionMonitor';
import JoinSession from './pages/JoinSession';
import UsersList from './pages/UsersList';
import FlaggedUsers from './pages/FlaggedUsers';

function PrivateRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { user, isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route path="/join/:sessionId" element={<JoinSession />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/sessions"
          element={
            <PrivateRoute>
              <SessionsList />
            </PrivateRoute>
          }
        />
        <Route
          path="/sessions/:sessionId/monitor"
          element={
            <PrivateRoute roles={['super_admin', 'host']}>
              <SessionMonitor />
            </PrivateRoute>
          }
        />
        <Route
          path="/users"
          element={
            <PrivateRoute roles={['super_admin']}>
              <UsersList />
            </PrivateRoute>
          }
        />
        <Route
          path="/flags"
          element={
            <PrivateRoute roles={['super_admin', 'host']}>
              <FlaggedUsers />
            </PrivateRoute>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;