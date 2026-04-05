import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "../context/ToastContext.jsx";
import api from "../services/api.js";

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    batch: "",
  });
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
      pushToast(
        "Registration successful",
        "Please login to continue",
        "success",
      );
      navigate("/login");
    } catch (err) {
      const msg = err.response?.data?.message || "Registration failed";
      setError(msg);
      pushToast("Registration failed", msg, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="shell min-h-screen bg-gradient-to-b from-sky-50 to-white pb-12">
      <div className="mx-auto max-w-md pt-8">
        <form className="card space-y-4 shadow-lg" onSubmit={handleSubmit}>
          <div>
            <h1 className="font-heading text-3xl font-bold text-ink">
              Student Registration
            </h1>
            <p className="mt-1 text-sm text-black/60">
              Create your account to take exams securely
            </p>
          </div>

          <input
            className="w-full rounded-lg border border-black/10 px-3 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
            placeholder="Full Name"
            required
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          />

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

          <input
            className="w-full rounded-lg border border-black/10 px-3 py-2 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
            placeholder="Batch / Class (optional, e.g. cse-2026-a)"
            value={form.batch}
            onChange={(e) => setForm((p) => ({ ...p, batch: e.target.value }))}
          />

          <p className="text-xs text-black/60 bg-sky-50 border border-sky-100 rounded-lg p-2">
            💡 Tip: Examiners can register through a special onboarding link.
          </p>

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
            {loading ? "Creating account..." : "Create Account"}
          </button>

          <p className="text-center text-sm text-black/60">
            Already registered?{" "}
            <Link className="font-semibold text-sky-600 hover:underline" to="/login">
              Login here
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
