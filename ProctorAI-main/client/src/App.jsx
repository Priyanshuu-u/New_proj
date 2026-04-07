import { Link, Navigate, Route, Routes } from "react-router-dom";
import LandingPage from "./pages/LandingPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import ExaminerRegisterPage from "./pages/ExaminerRegisterPage.jsx";
import DashboardPage from "./pages/examiner/DashboardPage.jsx";
import CreateTestPage from "./pages/examiner/CreateTestPage.jsx";
import MonitorPage from "./pages/examiner/MonitorPage.jsx";
import ResultsPage from "./pages/examiner/ResultsPage.jsx";
import TestsPage from "./pages/examiner/TestsPage.jsx";
import EditTestPage from "./pages/examiner/EditTestPage.jsx";
import HomePage from "./pages/student/HomePage.jsx";
import LobbyPage from "./pages/student/LobbyPage.jsx";
import SessionPage from "./pages/student/SessionPage.jsx";
import ResultPage from "./pages/student/ResultPage.jsx";
import ProtectedRoute from "./components/common/ProtectedRoute.jsx";
import { useAuth } from "./context/AuthContext.jsx";

function NavBar() {
  const { user, logout } = useAuth();

  return (
    <header className="border-b border-slate-200 bg-white shadow-sm sticky top-0 z-50">
      <div className="shell flex items-center justify-between py-3">
        <Link
          className="font-heading text-xl font-bold text-slate-900 flex items-center gap-2"
          to="/"
        >
          <span className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white text-xs font-bold">
            P
          </span>
          ProctorAI
        </Link>

        {user ? (
          <div className="flex items-center gap-1">
            {user.role === "examiner" ? (
              <>
                <Link
                  className="text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-3 py-2 rounded-lg transition-colors font-medium"
                  to="/dashboard"
                >
                  Dashboard
                </Link>
                <Link
                  className="text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-3 py-2 rounded-lg transition-colors font-medium"
                  to="/tests"
                >
                  Tests
                </Link>
              </>
            ) : (
              <Link
                className="text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-3 py-2 rounded-lg transition-colors font-medium"
                to="/home"
              >
                My Exams
              </Link>
            )}

            <div className="ml-2 pl-3 border-l border-slate-200 flex items-center gap-2">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-slate-900 leading-none">{user.name}</p>
                <p className="text-xs text-slate-400 capitalize mt-0.5">{user.role}</p>
              </div>
              <button
                className="text-sm text-slate-500 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors font-medium"
                onClick={logout}
              >
                Sign out
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              className="text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
              to="/login"
            >
              Sign in
            </Link>
            <Link
              className="btn btn-primary text-sm py-2"
              to="/register"
            >
              Get Started
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

export default function App() {
  return (
    <>
      <NavBar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/onboard/examiner" element={<ExaminerRegisterPage />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allow={["examiner"]}>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tests"
          element={
            <ProtectedRoute allow={["examiner"]}>
              <TestsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tests/create"
          element={
            <ProtectedRoute allow={["examiner"]}>
              <CreateTestPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tests/:id/edit"
          element={
            <ProtectedRoute allow={["examiner"]}>
              <EditTestPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tests/:id/monitor"
          element={
            <ProtectedRoute allow={["examiner"]}>
              <MonitorPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tests/:id/results"
          element={
            <ProtectedRoute allow={["examiner"]}>
              <ResultsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/home"
          element={
            <ProtectedRoute allow={["student"]}>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/exam/:id/lobby"
          element={
            <ProtectedRoute allow={["student"]}>
              <LobbyPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/exam/:id/session"
          element={
            <ProtectedRoute allow={["student"]}>
              <SessionPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/exam/:id/result"
          element={
            <ProtectedRoute allow={["student"]}>
              <ResultPage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
