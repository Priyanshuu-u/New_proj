import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import QuestionPanel from "./QuestionPanel.jsx";
import Timer from "./Timer.jsx";
import ViolationOverlay from "./ViolationOverlay.jsx";
import WebcamFeed from "../proctor/WebcamFeed.jsx";
import api from "../../services/api.js";
import { useExamTimer } from "../../hooks/useExamTimer.js";
import { useDetection } from "../../hooks/useDetection.js";
import { useSocket } from "../../hooks/useSocket.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";

function ScoreBar({ score, showLabel = true }) {
  let fillColor = "#10b981"; // green
  if (score > 60) fillColor = "#ef4444"; // red
  else if (score > 30) fillColor = "#f59e0b"; // amber

  return (
    <div>
      {showLabel && (
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs text-slate-400 font-medium">Risk Score</span>
          <span
            className="text-xs font-bold"
            style={{ color: fillColor }}
          >
            {score}/100
          </span>
        </div>
      )}
      <div className="score-bar">
        <div
          className="score-bar-fill"
          style={{ width: `${score}%`, background: fillColor }}
        />
      </div>
    </div>
  );
}

function DetectorStatusBadge({ status }) {
  const isReady = !["initializing", "loading", "retrying", "degraded"].includes(status);
  const isLoading = ["initializing", "loading", "retrying"].includes(status);

  if (isLoading) {
    return (
      <span className="badge badge-amber">
        <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        {status === "retrying" ? "Retrying..." : "Loading AI..."}
      </span>
    );
  }
  if (status === "degraded") {
    return <span className="badge badge-red">Degraded</span>;
  }
  if (isReady) {
    return <span className="badge badge-green">AI Active</span>;
  }
  return <span className="badge badge-slate">{status}</span>;
}

export default function ExamWindow() {
  const { id: testId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const socket = useSocket();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const submittingRef = useRef(false);
  const testRequestedRef = useRef(false);

  const [test, setTest] = useState(null);
  const [session, setSession] = useState(null);
  const [answers, setAnswers] = useState({});
  const [lastViolation, setLastViolation] = useState(null);
  const [error, setError] = useState("");
  const [cameraReady, setCameraReady] = useState(false);
  const [startingSession, setStartingSession] = useState(false);
  const [detectorInfo, setDetectorInfo] = useState("initializing");
  const [isFullscreen, setIsFullscreen] = useState(
    Boolean(document.fullscreenElement),
  );
  const { pushToast } = useToast();

  useEffect(() => {
    if (testRequestedRef.current) return;
    testRequestedRef.current = true;
    setError("");
    api
      .get(`/tests/${testId}`)
      .then((res) => setTest(res.data))
      .catch((err) => {
        const msg = err.response?.data?.message || "Unable to load exam details";
        setError(msg);
        pushToast("Exam load failed", msg, "error");
      });
  }, [testId, pushToast]);

  useEffect(() => {
    if (!test) return;
    let isMounted = true;

    async function setupCam() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
          audio: false,
        });
        if (!isMounted) return;
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play?.().catch(() => null);
          if (videoRef.current.readyState >= 2) {
            setCameraReady(true);
          } else {
            videoRef.current.onloadedmetadata = () => {
              if (isMounted) setCameraReady(true);
            };
          }
        }
      } catch {
        if (!isMounted) return;
        setError("Camera access is required before the exam can begin");
        pushToast("Camera required", "Please allow camera access to continue", "error");
      }
    }

    setupCam();
    return () => {
      isMounted = false;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setCameraReady(false);
    };
  }, [test, pushToast]);

  useEffect(() => {
    if (!streamRef.current || !videoRef.current) return;
    const video = videoRef.current;
    const stream = streamRef.current;
    if (video.srcObject !== stream) {
      video.srcObject = stream;
      video.play?.().catch(() => null);
    }
  }, [session]);

  useEffect(() => {
    const handler = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", handler);
    handler();
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  useEffect(() => {
    if (!socket || !session || !user) return;
    socket.emit("join_exam_room", { examId: testId, studentId: user.id });

    const onForceSubmit = async () => {
      pushToast("Exam submitted", "Invigilator forced submission", "info");
      await submitExam("force_submit");
    };
    const onExamTerminated = async () => {
      pushToast("Exam terminated", "Session ended by invigilator", "error");
      await submitExam("terminated");
    };

    socket.on("force_submit", onForceSubmit);
    socket.on("exam_terminated", onExamTerminated);
    return () => {
      socket.off("force_submit", onForceSubmit);
      socket.off("exam_terminated", onExamTerminated);
    };
  }, [socket, session, user, testId, pushToast]);

  async function submitExam(_reason = "manual") {
    if (!session || !test) return;
    if (submittingRef.current) return;
    submittingRef.current = true;
    try {
      const answerList = test.questions.map((q) => ({
        questionId: q._id,
        response: answers[q._id] || "",
      }));
      await api.post(`/sessions/${session._id}/submit`, { answers: answerList });
      socket?.emit("student_submitted", { examId: testId, studentId: user.id });
      pushToast("Exam submitted", "Your answers were saved", "success");
      navigate(`/exam/${testId}/result`);
    } finally {
      submittingRef.current = false;
    }
  }

  async function handleViolation(payload) {
    if (!session) return;
    setLastViolation({ ...payload, _ts: Date.now() });
    try {
      const { data } = await api.post(`/sessions/${session._id}/violation`, payload);
      if (data.status === "auto-submitted") {
        pushToast("Auto submitted", "Maximum violations exceeded", "error");
        await submitExam();
      }
    } catch {
      // Keep exam running even if one violation request fails.
    }
  }

  const { seconds, label } = useExamTimer(
    test?.duration || 0,
    submitExam,
    Boolean(test && session),
  );

  const { suspicionScore, violationsCount, detectorStatus, debugMeta } = useDetection({
    videoRef,
    active: Boolean(test && session && cameraReady),
    preload: Boolean(test && !session && cameraReady),
    maxViolationsAllowed: test?.maxViolationsAllowed || 8,
    onViolation: handleViolation,
    onForceSubmit: submitExam,
    onStatus: setDetectorInfo,
  });

  const questions = useMemo(() => test?.questions || [], [test]);
  const statusLabel = detectorInfo || detectorStatus;
  const detectorReady = !["initializing", "loading", "retrying"].includes(statusLabel);
  const secureEnvironmentReady = cameraReady && detectorReady;
  const maxViolations = Math.max(
    4,
    Math.min(test?.maxViolationsAllowed ?? 8, 15),
  );

  async function enterFullscreen() {
    try {
      await document.documentElement.requestFullscreen();
    } catch {
      pushToast("Fullscreen blocked", "Click the page and try again.", "error");
    }
  }

  useEffect(() => {
    if (!session || isFullscreen) return;
    const id = window.setTimeout(() => {
      document.documentElement.requestFullscreen().catch(() => null);
    }, 200);
    return () => window.clearTimeout(id);
  }, [session, isFullscreen]);

  async function startSecureSession() {
    if (!test || session || startingSession || !secureEnvironmentReady) return;
    setStartingSession(true);
    try {
      const { data } = await api.post("/sessions/start", { testId });
      setSession(data);
      pushToast("Session started", "Secure environment ready", "success");
    } catch (err) {
      const msg = err.response?.data?.message || "Unable to start exam session";
      setError(msg);
      pushToast("Session error", msg, "error");
    } finally {
      setStartingSession(false);
    }
  }

  // ─── Error state ───────────────────────────────────────────────────────────
  if (error) {
    return (
      <main className="shell flex items-center justify-center min-h-[60vh]">
        <div className="card max-w-md w-full text-center space-y-4">
          <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto text-2xl">
            ⚠
          </div>
          <h1 className="font-heading text-2xl font-bold text-slate-900">Could not start exam</h1>
          <p className="text-red-600 text-sm">{error}</p>
          <button className="btn btn-ghost w-full" onClick={() => navigate(-1)}>
            Go Back
          </button>
        </div>
      </main>
    );
  }

  // ─── Loading state ─────────────────────────────────────────────────────────
  if (!test) {
    return (
      <main className="shell flex items-center justify-center min-h-[60vh]">
        <div className="card text-center space-y-3 max-w-xs w-full">
          <svg className="w-8 h-8 animate-spin text-slate-400 mx-auto" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <p className="text-slate-600 font-medium">Loading exam details...</p>
        </div>
      </main>
    );
  }

  // ─── Setup / pre-session ───────────────────────────────────────────────────
  if (!session) {
    return (
      <main className="shell py-8 space-y-6 max-w-2xl">
        <div>
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest mb-1">
            Secure Setup
          </p>
          <h1 className="font-heading text-3xl font-bold text-slate-900">{test.title}</h1>
          <p className="text-slate-500 mt-1 text-sm">
            {test.duration} minutes &nbsp;·&nbsp; {questions.length} questions
          </p>
        </div>

        {/* Status checklist */}
        <div className="card space-y-3">
          <h2 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">
            System Check
          </h2>
          <CheckItem
            label="Camera Access"
            ok={cameraReady}
            loading={!cameraReady}
          />
          <CheckItem
            label="AI Detection Engine"
            ok={detectorReady}
            loading={!detectorReady}
            detail={statusLabel}
          />
          <CheckItem label="Secure Environment" ok={secureEnvironmentReady} loading={!secureEnvironmentReady} />
        </div>

        {/* Camera preview */}
        <div className="card space-y-3">
          <h2 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">
            Camera Preview
          </h2>
          <p className="text-sm text-slate-500">
            Position your face clearly in the frame. Ensure good lighting.
          </p>
          <WebcamFeed videoRef={videoRef} showLive={cameraReady} />
        </div>

        {/* Rules */}
        <div className="card space-y-2">
          <h2 className="font-semibold text-slate-700 text-sm uppercase tracking-wide mb-1">
            Exam Rules
          </h2>
          {[
            "Keep your face visible and well-lit at all times",
            "Do not switch tabs or minimize the browser window",
            "No phones, books, or reference materials",
            "Stay in fullscreen mode throughout the exam",
            "Only one person should be visible in the camera",
          ].map((rule) => (
            <div key={rule} className="flex items-start gap-2 text-sm text-slate-700">
              <span className="text-slate-400 mt-0.5 flex-shrink-0">•</span>
              {rule}
            </div>
          ))}
        </div>

        <button
          className="btn btn-primary w-full py-3 text-base"
          type="button"
          onClick={startSecureSession}
          disabled={!secureEnvironmentReady || startingSession}
        >
          {startingSession ? (
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Starting secure session...
            </span>
          ) : (
            "Begin Secure Exam"
          )}
        </button>
      </main>
    );
  }

  // ─── Active exam session ───────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <ViolationOverlay
        lastViolation={lastViolation}
        violationsCount={violationsCount}
        maxViolations={maxViolations}
      />

      {/* Top bar */}
      <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-40">
        <div className="shell flex items-center justify-between py-3 gap-4">
          <div className="min-w-0">
            <p className="text-xs text-slate-500 font-medium">In Progress</p>
            <h1 className="font-heading font-bold text-slate-900 text-lg leading-tight truncate">
              {test.title}
            </h1>
          </div>
          <Timer label={label} secondsLeft={seconds} />
        </div>
      </div>

      {/* Fullscreen banner */}
      {!isFullscreen && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between gap-4">
          <p className="text-amber-800 text-sm font-medium">
            Fullscreen mode is required during the exam.
          </p>
          <button
            className="btn btn-primary text-xs py-1.5 px-3 flex-shrink-0"
            onClick={enterFullscreen}
          >
            Enter Fullscreen
          </button>
        </div>
      )}

      {/* Main content */}
      <div className="shell flex-1 py-6">
        <div className="grid gap-6 xl:gap-8 lg:grid-cols-[minmax(520px,1fr),520px]">
          {/* Questions */}
          <QuestionPanel
            questions={questions}
            answers={answers}
            setAnswers={setAnswers}
          />

          {/* Proctor sidebar */}
          <div className="space-y-4">
            {/* Webcam card */}
            <div className="card-dark space-y-4 w-full">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.14em] text-white/60 font-semibold">
                    Proctor Feed
                  </p>
                  <p className="text-xs text-white/50">Face, gaze, objects, tab-focus</p>
                </div>
                <DetectorStatusBadge status={statusLabel} />
              </div>

              <div className="relative overflow-hidden rounded-xl ring-1 ring-white/10 shadow-lg">
                <WebcamFeed
                  videoRef={videoRef}
                  showLive={cameraReady}
                  statusLabel=""
                />
                <div className="absolute left-3 bottom-3 bg-black/65 text-white text-[11px] px-3 py-1.5 rounded-full backdrop-blur flex items-center gap-2">
                  <span className="live-dot" />
                  <span className="font-semibold tracking-wide">AI Guard On</span>
                </div>
              </div>

              <div className="space-y-2">
                <ScoreBar score={suspicionScore} showLabel={false} />
                <div className="flex items-center justify-between text-[11px] text-white/60 mt-1">
                  <span>Risk Score</span>
                  <span className="font-semibold text-white">{suspicionScore}/100</span>
                </div>
              </div>

              {/* Violations & progress */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <StatPill
                  label="Violations"
                  value={violationsCount}
                  hint={`limit ${maxViolations}`}
                  tone={
                    violationsCount >= maxViolations * 0.75
                      ? "red"
                      : violationsCount >= maxViolations * 0.5
                        ? "amber"
                        : "slate"
                  }
                />
                <StatPill
                  label="Answered"
                  value={questions.filter((q) => answers[q._id] && answers[q._id] !== "").length}
                  hint={`/ ${questions.length}`}
                  tone="slate"
                />
                <StatPill
                  label="Fullscreen"
                  value={isFullscreen ? "On" : "Off"}
                  hint={statusLabel.includes("degraded") ? "degraded" : "secure"}
                  tone={isFullscreen ? "green" : "amber"}
                />
              </div>

              {import.meta.env.VITE_PROCTOR_DEBUG === "true" && (
                <div className="rounded-lg bg-white/10 text-white/80 text-[11px] px-3 py-2 space-y-1">
                  <p className="font-semibold uppercase tracking-[0.18em] text-white/60">Debug</p>
                  <div className="grid grid-cols-2 gap-x-2">
                    <span>Detector:</span><span className="font-semibold">{statusLabel}</span>
                    <span>Faces:</span><span>{debugMeta?.faces ?? "n/a"}</span>
                    <span>Phone:</span><span>{debugMeta?.phone ? "yes" : "no"}</span>
                    <span>Book:</span><span>{debugMeta?.book ? "yes" : "no"}</span>
                    <span>Face mode:</span><span>{debugMeta?.faceMode || "n/a"}</span>
                    <span>Object mode:</span><span>{debugMeta?.objectMode || "n/a"}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Submit button */}
            <button
              className="btn btn-danger w-full py-3 text-base font-semibold shadow-md hover:shadow-lg"
              onClick={() => submitExam("manual")}
            >
              Submit Exam
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CheckItem({ label, ok, loading, detail }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
          ok ? "bg-emerald-100" : loading ? "bg-amber-100" : "bg-slate-100"
        }`}
      >
        {ok ? (
          <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ) : loading ? (
          <svg className="w-3.5 h-3.5 text-amber-500 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        ) : (
          <span className="w-2 h-2 rounded-full bg-slate-300 block" />
        )}
      </div>
      <div>
        <p className={`text-sm font-medium ${ok ? "text-slate-800" : "text-slate-500"}`}>
          {label}
        </p>
        {detail && !ok && (
          <p className="text-xs text-slate-400">{detail}</p>
        )}
      </div>
    </div>
  );
}

function StatPill({ label, value, hint = "", tone = "slate" }) {
  const colors = {
    red: "bg-red-100 text-red-800 ring-red-200",
    amber: "bg-amber-100 text-amber-800 ring-amber-200",
    green: "bg-emerald-100 text-emerald-800 ring-emerald-200",
    slate: "bg-white/10 text-white ring-white/10",
  }[tone] || "bg-white/10 text-white ring-white/10";

  return (
    <div className={`rounded-xl px-3 py-2.5 ring-1 ${colors} shadow-inner`}>
      <p className="text-[11px] uppercase tracking-[0.18em] font-semibold opacity-70">
        {label}
      </p>
      <div className="flex items-baseline justify-center gap-1 mt-0.5">
        <span className="text-lg font-bold tabular-nums">{value}</span>
        {hint && <span className="text-[11px] font-semibold opacity-60">{hint}</span>}
      </div>
    </div>
  );
}
