import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import api from "../services/api.js";

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { pushToast } = useToast();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", form);
      login(data);
      pushToast("Login successful", `Welcome ${data.user.name}`, "success");
      navigate(data.user.role === "examiner" ? "/dashboard" : "/home");
    } catch (err) {
      const msg = err.response?.data?.message || "Login failed";
      setError(msg);
      pushToast("Login failed", msg, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="shell min-h-screen bg-gradient-to-b from-sky-50 to-white pb-12">
      <div className="mx-auto max-w-md pt-8">
        <form className="card space-y-4 shadow-lg" onSubmit={handleSubmit}>
          <div>
            <h1 className="font-heading text-3xl font-bold text-ink">Login</h1>
            <p className="mt-1 text-sm text-black/60">
              Sign in to access your account
            </p>
          </div>

          <input
            className="w-full rounded-lg border border-black/10 px-3 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
            placeholder="Email Address"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
          />

          <input
            className="w-full rounded-lg border border-black/10 px-3 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
            placeholder="Password"
            type="password"
            required
            value={form.password}
            onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
          />

          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          ) : null}

          <button
            className="btn btn-primary w-full bg-gradient-to-r from-sky-500 to-sky-600 font-semibold text-white shadow-md hover:shadow-lg disabled:opacity-50"
            type="submit"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <div className="space-y-2 pt-2 text-center text-sm text-black/60">
            <p>
              No account?{" "}
              <Link className="font-semibold text-sky-600 hover:underline" to="/register">
                Register as Student
              </Link>
            </p>
          </div>
        </form>
      </div>
    </main>
  );
}
