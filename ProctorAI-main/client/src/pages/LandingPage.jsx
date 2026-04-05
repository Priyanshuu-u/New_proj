import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-sky-50 to-white">
      <div className="shell space-y-16 py-16">
        {/* Hero Section */}
        <section className="grid gap-8 md:grid-cols-2 md:items-center md:gap-16">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-sky-600">
              Privacy-Preserving Exam Integrity
            </p>
            <h1 className="mt-4 font-heading text-5xl font-bold leading-tight text-ink md:text-6xl">
              ProctorAI
            </h1>
            <p className="mt-4 text-xl text-black/70">
              Browser-native proctoring where AI detections run on student devices and live alerts stream to examiners.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                className="inline-block bg-gradient-to-r from-sky-500 to-sky-600 px-6 py-3 rounded-lg font-semibold text-white shadow-lg hover:shadow-xl transition-shadow"
                to="/register"
              >
                Get Started as Student
              </Link>
              <Link
                className="inline-block border-2 border-sky-500 px-6 py-3 rounded-lg font-semibold text-sky-600 hover:bg-sky-50 transition-colors"
                to="/login"
              >
                Sign In
              </Link>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="space-y-4">
            <div className="rounded-xl border border-sky-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="font-semibold text-ink">📷 Live Monitoring</h3>
              <p className="mt-2 text-sm text-black/60">
                Real-time camera feed and detection alerts for all active exam sessions.
              </p>
            </div>
            <div className="rounded-xl border border-sky-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="font-semibold text-ink">🔍 AI Detection</h3>
              <p className="mt-2 text-sm text-black/60">
                Detect gaze, multiple faces, phones, books, and suspicious browser activity.
              </p>
            </div>
            <div className="rounded-xl border border-sky-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="font-semibold text-ink">🔒 Privacy First</h3>
              <p className="mt-2 text-sm text-black/60">
                Processing happens locally in the browser. No server-side video storage.
              </p>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section>
          <h2 className="font-heading text-3xl font-bold text-ink md:text-4xl">
            Designed for Educators
          </h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            <div className="rounded-xl bg-white p-8 shadow-sm border border-black/5 hover:shadow-md transition-shadow">
              <div className="text-3xl">📊</div>
              <h3 className="mt-4 font-semibold text-ink">Exam Management</h3>
              <p className="mt-2 text-sm text-black/60">
                Create and manage multiple exams with custom questions, durations, and scoring rules.
              </p>
            </div>
            <div className="rounded-xl bg-white p-8 shadow-sm border border-black/5 hover:shadow-md transition-shadow">
              <div className="text-3xl">👁️</div>
              <h3 className="mt-4 font-semibold text-ink">Live Dashboard</h3>
              <p className="mt-2 text-sm text-black/60">
                Monitor all students in real-time with violation logs and evidence snapshots.
              </p>
            </div>
            <div className="rounded-xl bg-white p-8 shadow-sm border border-black/5 hover:shadow-md transition-shadow">
              <div className="text-3xl">📈</div>
              <h3 className="mt-4 font-semibold text-ink">Detailed Reports</h3>
              <p className="mt-2 text-sm text-black/60">
                View comprehensive results with suspicion scores and violation breakdowns.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="rounded-2xl bg-gradient-to-r from-sky-500 to-sky-600 p-8 text-center text-white shadow-lg md:p-12">
          <h2 className="font-heading text-3xl font-bold">Ready to secure your exams?</h2>
          <p className="mt-2 text-sky-100">
            Join educators using ProctorAI to maintain exam integrity and prevent cheating.
          </p>
          <Link
            className="mt-6 inline-block bg-white px-8 py-3 rounded-lg font-semibold text-sky-600 hover:bg-sky-50 transition-colors"
            to="/register"
          >
            Create Your Account
          </Link>
        </section>
      </div>
    </main>
  );
}
