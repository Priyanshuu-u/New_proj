import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../context/ToastContext.jsx";
import api from "../services/api.js";

export default function ExaminerRegisterPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    institution: "",
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { pushToast } = useToast();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/auth/register", {
        ...form,
        role: "examiner",
      });
      pushToast(
        "Examiner account created",
        "Please login to access your dashboard",
        "success",
      );
      navigate("/login");
    } catch (err) {
      const msg = err.response?.data?.message || "Registration failed";
      setError(msg);
      pushToast("Registration failed", msg, "error");
    }
  }

  return (
    <main className="shell min-h-screen bg-gradient-to-b from-sky-50 to-white pb-12">
      <div className="mx-auto max-w-md pt-8">
        <form className="card space-y-4 shadow-lg" onSubmit={handleSubmit}>
          <div>
            <h1 className="font-heading text-3xl font-bold text-ink">
              Examiner Registration
            </h1>
            <p className="mt-1 text-sm text-black/60">
              Create your examiner account to manage tests and monitor students
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
            placeholder="Institution / School"
            required
            value={form.institution}
            onChange={(e) => setForm((p) => ({ ...p, institution: e.target.value }))}
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
            className="btn btn-primary w-full bg-gradient-to-r from-sky-500 to-sky-600 font-semibold text-white shadow-md hover:shadow-lg"
            type="submit"
          >
            Create Examiner Account
          </button>

          <p className="text-center text-sm text-black/60">
            Already have an account?{" "}
            <a href="/login" className="font-semibold text-sky-600 hover:underline">
              Login here
            </a>
          </p>
        </form>
      </div>
    </main>
  );
}
