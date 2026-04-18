import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
// Forced HMR Recompilation trigger

import Sidebar from './components/layout/Sidebar';
import StudentSidebar from './components/layout/StudentSidebar';
import CaretakerSidebar from './components/layout/CaretakerSidebar';
import WardenSidebar from './components/layout/WardenSidebar';

import LoginPage from './pages/LoginPage';

// ── ADMIN MODULE PAGES ───────────────────────────────────────
// Reports & Analytics
import DashboardPage from './pages/admin/reports/DashboardPage';
import AdminAttendanceReportsPage from './pages/admin/reports/AdminAttendanceReportsPage';
import SecurityLogsPage from './pages/admin/reports/SecurityLogsPage';
// User Management
import AdminUsersPage from './pages/admin/users/UsersPage';
import StudentsPage from './pages/admin/users/StudentsPage';
import FloorWardenPage from './pages/admin/users/FloorWardenPage';
import AdminWardenDetailPage from './pages/admin/users/AdminWardenDetailPage';
// Hostel & Room Management
import AdminHostelsPage from './pages/admin/hostels/AdminHostelsPage';
import RoomsPage from './pages/admin/hostels/RoomsPage';
import AllocationsPage from './pages/admin/hostels/AllocationsPage';
import MessMenuPage from './pages/admin/hostels/MessMenuPage';
import VisitorManagementPage from './pages/admin/hostels/VisitorManagementPage';
// Requests & Applications
import AdminApplicationReview from './pages/admin/requests/AdminApplicationReview';
import AdminLeaveApprovals from './pages/admin/requests/AdminLeaveApprovals';
// Complaints Management
import ComplaintsPage from './pages/admin/complaints/ComplaintsPage';
import NoticesPage from './pages/admin/complaints/NoticesPage';
import AdminMessagesPage from './pages/admin/complaints/AdminMessagesPage';

// ── WARDEN PAGES ──────────────────────────────────────────────
import WardenLeaveApprovals from './pages/warden/WardenLeaveApprovalsPortal';
import WardenDashboard from './pages/warden/WardenDashboardPortal';
import WardenStudents from './pages/warden/WardenStudentsPortal';
import WardenComplaints from './pages/warden/WardenComplaintsPortal';
import WardenApplicationReview from './pages/warden/WardenApplicationReview';
import WardenRequestManagement from './pages/warden/WardenRequestManagement';
import WardenAttendance from './pages/warden/WardenAttendance';
import WardenMessagesPage from './pages/warden/WardenMessagesPage';

// ── STUDENT PAGES ──────────────────────────────────────────────
import StudentDashboard from './pages/student/StudentDashboardPortal';
import StudentProfile from './pages/student/StudentProfile';
import StudentLeaveRequest from './pages/student/StudentLeaveRequestPortal';
import StudentComplaints from './pages/student/StudentComplaints';
import StudentNotices from './pages/student/StudentNoticesPortal';
import StudentHostelApplication from './pages/student/StudentHostelApplication';
import StudentRequests from './pages/student/StudentRequests';
import StudentAttendance from './pages/student/StudentAttendance';
import StudentStaffDirectory from './pages/student/StudentStaffDirectory';
import StudentVisitorRequests from './pages/student/StudentVisitorRequests';
import StudentMyRoomPage from './pages/student/StudentMyRoom';

// ── CARETAKER PAGES ────────────────────────────────────────────
import CaretakerDashboard from './pages/caretaker/CaretakerDashboardPortal';
import CaretakerComplaints from './pages/caretaker/CaretakerComplaintsPortal';

import { Spinner } from './components/ui';

function getHomePath({ user, isAdmin, isCaretaker, isWarden, isStudent }) {
  if (!user) return '/login';
  if (isAdmin) return '/';
  if (isCaretaker) return '/caretaker';
  if (isWarden) return '/warden';
  if (isStudent) return '/student';
  return '/login';
}

function ProtectedRoute() {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-brand-bg">
      <Spinner size="lg" className="text-brand-primary" />
    </div>
  );
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}

function AdminRoute() {
  const auth = useAuth();
  if (!auth.isAdmin) return <Navigate to={getHomePath(auth)} replace />;
  return <Outlet />;
}

function CaretakerRoute() {
  const auth = useAuth();
  if (!auth.isCaretaker && !auth.isAdmin) return <Navigate to={getHomePath(auth)} replace />;
  return <Outlet />;
}

function WardenRoute() {
  const auth = useAuth();
  if (!auth.isWarden && !auth.isAdmin) return <Navigate to={getHomePath(auth)} replace />;
  return <Outlet />;
}

function StudentRoute() {
  const auth = useAuth();
  if (!auth.isStudent) return <Navigate to={getHomePath(auth)} replace />;
  return <Outlet />;
}

function AppRoutes() {
  const auth = useAuth();
  const { user } = auth;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={getHomePath(auth)} replace /> : <LoginPage />} />

      <Route element={<ProtectedRoute />}>
        {/* Caretaker Routes */}
        <Route path="/caretaker" element={<CaretakerRoute />}>
          <Route element={<CaretakerSidebar />}>
            <Route index element={<CaretakerDashboard />} />
            <Route path="complaints" element={<CaretakerComplaints />} />
            <Route path="*" element={<Navigate to="/caretaker" replace />} />
          </Route>
        </Route>

        {/* Warden Routes */}
        <Route path="/warden" element={<WardenRoute />}>
          <Route element={<WardenSidebar />}>
            <Route index element={<WardenDashboard />} />
            <Route path="students" element={<WardenStudents />} />
            <Route path="applications" element={<WardenApplicationReview />} />
            <Route path="requests" element={<WardenRequestManagement />} />
            <Route path="attendance" element={<WardenAttendance />} />
            <Route path="outpasses" element={<WardenLeaveApprovals />} />
            <Route path="mess-menu" element={<MessMenuPage />} />
            <Route path="visitors" element={<VisitorManagementPage />} />
            <Route path="complaints" element={<WardenComplaints />} />
            <Route path="messages" element={<WardenMessagesPage />} />
            <Route path="*" element={<Navigate to="/warden" replace />} />
          </Route>
        </Route>

        {/* Student Routes */}
        <Route path="/student" element={<StudentRoute />}>
          <Route element={<StudentSidebar />}>
            <Route index element={<StudentDashboard />} />
            <Route path="profile" element={<StudentProfile />} />
            <Route path="applications" element={<StudentHostelApplication />} />
            <Route path="requests" element={<StudentRequests />} />
            <Route path="visitors" element={<StudentVisitorRequests />} />
            <Route path="attendance" element={<StudentAttendance />} />
            <Route path="outpass" element={<StudentLeaveRequest />} />
            <Route path="mess-menu" element={<MessMenuPage />} />
            <Route path="complaints" element={<StudentComplaints />} />
            <Route path="notices" element={<StudentNotices />} />
            <Route path="staff-directory" element={<StudentStaffDirectory />} />
            <Route path="my-room" element={<StudentMyRoomPage />} />
            <Route path="*" element={<Navigate to="/student" replace />} />
          </Route>
        </Route>

        {/* Admin Routes */}
        <Route path="/" element={<AdminRoute />}>
          <Route element={<Sidebar />}>
            <Route index element={<DashboardPage />} />
            <Route path="attendance-reports" element={<AdminAttendanceReportsPage />} />
            <Route path="security-logs" element={<SecurityLogsPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="students" element={<StudentsPage />} />
            <Route path="floor-wardens" element={<FloorWardenPage />} />
            <Route path="wardens/:id" element={<AdminWardenDetailPage />} />
            <Route path="hostels" element={<AdminHostelsPage />} />
            <Route path="rooms" element={<RoomsPage />} />
            <Route path="allocations" element={<AllocationsPage />} />
            <Route path="mess-menu" element={<MessMenuPage />} />
            <Route path="visitors" element={<VisitorManagementPage />} />
            <Route path="applications" element={<AdminApplicationReview />} />
            <Route path="outpasses" element={<AdminLeaveApprovals />} />
            <Route path="complaints" element={<ComplaintsPage />} />
            <Route path="notices" element={<NoticesPage />} />
            <Route path="messages" element={<AdminMessagesPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}

const GOOGLE_CLIENT_ID =
  process.env.REACT_APP_GOOGLE_CLIENT_ID ||
  '181603728534-78tjb4gbu8p6olk8mtpqj2h2guls23vv.apps.googleusercontent.com';

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <ErrorBoundary>
        <AuthProvider>
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <AppRoutes />
            <Toaster
              position="top-right"
              toastOptions={{
                style: { borderRadius: '12px', fontSize: '13px', fontFamily: 'Manrope, Segoe UI, sans-serif' },
                success: { iconTheme: { primary: '#7D53F6', secondary: '#fff' } },
              }}
            />
          </BrowserRouter>
        </AuthProvider>
      </ErrorBoundary>
    </GoogleOAuthProvider>
  );
}
