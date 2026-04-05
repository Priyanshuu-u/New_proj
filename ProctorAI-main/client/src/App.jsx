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
    <header className="border-b border-black/10 bg-gradient-to-r from-white to-sky-50 shadow-sm">
      <div className="shell flex items-center justify-between py-4">
        <Link className="font-heading text-2xl font-bold bg-gradient-to-r from-sky-600 to-sky-700 bg-clip-text text-transparent" to="/">
          ProctorAI
        </Link>
        {user ? (
          <div className="flex items-center gap-4">
            {user.role === "examiner" ? (
              <>
                <Link className="text-sm text-black/70 hover:text-sky-600 transition-colors" to="/dashboard">
                  Dashboard
                </Link>
                <Link className="text-sm text-black/70 hover:text-sky-600 transition-colors" to="/tests">
                  Tests
                </Link>
              </>
            ) : (
              <Link className="text-sm text-black/70 hover:text-sky-600 transition-colors" to="/home">
                My Tests
              </Link>
            )}
            <span className="text-sm text-black/50 border-l border-black/10 pl-4">
              {user.name} <span className="text-xs bg-sky-100 text-sky-700 px-2 py-1 rounded ml-2">{user.role}</span>
            </span>
            <button className="text-sm text-black/70 hover:text-red-600 transition-colors" onClick={logout}>
              Logout
            </button>
          </div>
        ) : (
          <div className="flex gap-3">
            <Link className="text-sm text-black/70 hover:text-sky-600 transition-colors" to="/login">
              Login
            </Link>
            <Link className="bg-gradient-to-r from-sky-500 to-sky-600 text-white text-sm px-4 py-2 rounded-lg hover:shadow-md transition-shadow" to="/register">
              Register
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
