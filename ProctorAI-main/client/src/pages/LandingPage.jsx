import { Link } from "react-router-dom";

const FEATURES = [
  {
    icon: "👁",
    title: "Real-Time Gaze Tracking",
    desc: "MediaPipe face mesh detects when students look away from the screen, flagging suspicious movement.",
  },
  {
    icon: "📱",
    title: "Object Detection",
    desc: "YOLOv8 + COCO-SSD run locally in the browser to detect phones and reference materials in the camera feed.",
  },
  {
    icon: "🔒",
    title: "Privacy-First Design",
    desc: "All AI inference runs on the student's device. No video is stored on the server — only violation snapshots.",
  },
  {
    icon: "⚡",
    title: "Live Invigilator Dashboard",
    desc: "Examiners monitor all students in real time, viewing suspicion scores and violation evidence as it happens.",
  },
  {
    icon: "🛡",
    title: "Multi-Signal Detection",
    desc: "Tab switches, copy-paste, fullscreen exits, multiple faces, and window blur are all tracked automatically.",
  },
  {
    icon: "📊",
    title: "Detailed Reports",
    desc: "Every session produces a full violation log with timestamps, severity, and snapshot evidence.",
  },
];

export default function LandingPage() {
  return (
    <main className="bg-white">
      {/* Hero */}
      <section className="bg-slate-900 text-white">
        <div className="shell py-20 md:py-28">
          <div className="max-w-2xl">
            <span className="badge badge-green text-xs mb-6 inline-flex">
              Browser-Native · Privacy-First · Production Ready
            </span>
            <h1 className="font-heading text-5xl md:text-6xl font-bold leading-tight">
              Exam integrity,{" "}
              <span className="text-emerald-400">powered by AI</span>
            </h1>
            <p className="mt-5 text-lg text-slate-300 leading-relaxed max-w-xl">
              ProctorAI runs gaze tracking, object detection, and behavioral
              monitoring entirely in the browser — no plugins, no server-side
              video, no privacy compromise.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                className="btn btn-success px-6 py-3 text-base shadow-lg hover:shadow-xl"
                to="/register"
              >
                Start as Student
              </Link>
              <Link
                className="btn btn-ghost px-6 py-3 text-base border-white/20 text-white hover:bg-white/10"
                to="/login"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-slate-200 bg-slate-50">
        <div className="shell py-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { value: "< 2s", label: "Detection latency" },
            { value: "10+", label: "Violation signals" },
            { value: "0 MB", label: "Server video storage" },
            { value: "100%", label: "Client-side inference" },
          ].map(({ value, label }) => (
            <div key={label}>
              <p className="font-heading text-2xl font-bold text-slate-900">{value}</p>
              <p className="text-sm text-slate-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features grid */}
      <section className="shell py-20 space-y-12">
        <div className="text-center max-w-xl mx-auto">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-slate-900">
            Everything you need to run secure exams
          </h2>
          <p className="mt-3 text-slate-500 text-base">
            Built for educators who need reliable, low-friction online proctoring
            without third-party video surveillance.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {FEATURES.map(({ icon, title, desc }) => (
            <div
              key={title}
              className="card hover:shadow-md transition-shadow duration-200 space-y-3"
            >
              <span className="text-3xl">{icon}</span>
              <h3 className="font-heading font-semibold text-slate-900">{title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-slate-900 text-white">
        <div className="shell py-20 space-y-12">
          <div className="text-center max-w-xl mx-auto">
            <h2 className="font-heading text-3xl font-bold">How it works</h2>
            <p className="mt-2 text-slate-400">
              From exam creation to results — in four steps.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-4">
            {[
              { step: "1", title: "Create an Exam", desc: "Add questions, set duration, and configure violation limits." },
              { step: "2", title: "Students Join", desc: "Students enter the lobby, allow camera access, and wait for the exam to open." },
              { step: "3", title: "AI Monitors", desc: "Detection runs every 1.2 seconds — gaze, objects, face count, and browser events." },
              { step: "4", title: "Review Results", desc: "Examiners see full reports with scores, violations, and snapshot evidence." },
            ].map(({ step, title, desc }) => (
              <div key={step} className="space-y-3">
                <span className="w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center font-bold text-lg">
                  {step}
                </span>
                <h3 className="font-heading font-semibold text-white">{title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="shell py-20 text-center space-y-6">
        <h2 className="font-heading text-3xl font-bold text-slate-900">
          Ready to run your first secure exam?
        </h2>
        <p className="text-slate-500 max-w-md mx-auto">
          Set up your account in minutes. No installation required — runs entirely in the browser.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link className="btn btn-primary px-8 py-3 text-base shadow-md hover:shadow-lg" to="/register">
            Create Student Account
          </Link>
          <Link className="btn btn-ghost px-8 py-3 text-base" to="/onboard/examiner">
            Register as Examiner
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="shell py-6 flex flex-wrap items-center justify-between gap-4 text-sm text-slate-400">
          <span className="font-heading font-semibold text-slate-900">ProctorAI</span>
          <span>Browser-native proctoring · Privacy-first architecture</span>
        </div>
      </footer>
    </main>
  );
}
