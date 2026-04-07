import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "../context/ToastContext.jsx";
import api from "../services/api.js";

function InputField({ label, type = "text", value, onChange, placeholder, required, hint }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      <input
        className="w-full rounded-xl border-2 border-slate-200 px-3.5 py-2.5 text-sm focus:border-slate-500 focus:outline-none transition-colors"
        type={type}
        placeholder={placeholder}
        required={required}
        value={value}
        onChange={onChange}
      />
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

export default function RegisterPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "", batch: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { pushToast } = useToast();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/register", form);
      pushToast("Account created", "Please sign in to continue", "success");
      navigate("/login");
    } catch (err) {
      const msg = err.response?.data?.message || "Registration failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[calc(100vh-65px)] bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-bold text-lg mx-auto mb-4">
            P
          </div>
          <h1 className="font-heading text-2xl font-bold text-slate-900">Create your account</h1>
          <p className="text-slate-500 text-sm mt-1">Join ProctorAI as a student</p>
        </div>

        <form className="card shadow-sm space-y-4" onSubmit={handleSubmit}>
          <InputField
            label="Full name"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="Jane Smith"
            required
          />
          <InputField
            label="Email address"
            type="email"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            placeholder="you@example.com"
            required
          />
          <InputField
            label="Password"
            type="password"
            value={form.password}
            onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
            placeholder="Choose a strong password"
            required
          />
          <InputField
            label="Batch / Class"
            value={form.batch}
            onChange={(e) => setForm((p) => ({ ...p, batch: e.target.value }))}
            placeholder="e.g. CSE-2026-A"
            hint="Optional — used for grouping by your examiner"
          />

          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs text-slate-500">
              Are you an examiner?{" "}
              <Link className="font-semibold text-slate-800 hover:underline" to="/onboard/examiner">
                Register here instead →
              </Link>
            </p>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <button
            className="btn btn-primary w-full py-3 text-sm"
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Creating account...
              </span>
            ) : "Create Account"}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500">
          Already registered?{" "}
          <Link className="font-semibold text-slate-900 hover:underline" to="/login">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
