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
      .then((testRes) => {
        setTest(testRes.data);
      })
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
          video: true,
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
      } catch (err) {
        if (!isMounted) return;
        setError("Camera access is required before the exam can begin");
        pushToast(
          "Camera required",
          "Please allow camera access to continue",
          "error",
        );
      }
    }

    setupCam();

    return () => {
      isMounted = false;
      streamRef.current?.getTracks().forEach((track) => track.stop());
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
    const fullscreenHandler = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", fullscreenHandler);
    fullscreenHandler();

    return () => {
      document.removeEventListener("fullscreenchange", fullscreenHandler);
    };
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

      await api.post(`/sessions/${session._id}/submit`, {
        answers: answerList,
      });
      socket?.emit("student_submitted", { examId: testId, studentId: user.id });
      pushToast("Exam submitted", "Your answers were saved", "success");
      navigate(`/exam/${testId}/result`);
    } finally {
      submittingRef.current = false;
    }
  }

  async function handleViolation(payload) {
    if (!session) return;
    setLastViolation(payload);
    try {
      const { data } = await api.post(`/sessions/${session._id}/violation`, payload);
      pushToast("Warning", payload.type.replaceAll("_", " "), "info");

      if (data.status === "auto-submitted") {
        pushToast("Auto submitted", "Maximum violations exceeded", "error");
        await submitExam();
      }
    } catch (_error) {
      // Keep exam running even if one violation request fails.
    }
  }

  const { label } = useExamTimer(
    test?.duration || 0,
    submitExam,
    Boolean(test && session),
  );

  const { suspicionScore, violationsCount, detectorStatus } = useDetection({
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
  const detectorReady = !["initializing", "loading", "retrying"].includes(
    statusLabel,
  );
  const secureEnvironmentReady = cameraReady && detectorReady;

  async function enterFullscreen() {
    try {
      await document.documentElement.requestFullscreen();
      pushToast("Fullscreen enabled", "Exam view is now locked", "success");
    } catch (_error) {
      pushToast(
        "Fullscreen blocked",
        "Browser denied fullscreen request. Click the page and try again.",
        "error",
      );
    }
  }

  useEffect(() => {
    if (!session || isFullscreen) return;

    const timerId = window.setTimeout(() => {
      document.documentElement.requestFullscreen().catch(() => {
        pushToast(
          "Fullscreen info",
          "Fullscreen mode recommended for secure testing",
          "info",
        );
      });
    }, 200);

    return () => window.clearTimeout(timerId);
  }, [session, isFullscreen, pushToast]);

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

  if (error) {
    return (
      <main className="shell">
        <section className="card">
          <h1 className="font-heading text-2xl font-bold">
            Could not start exam
          </h1>
          <p className="mt-2 text-signal">{error}</p>
        </section>
      </main>
    );
  }

  if (!test) {
    return (
      <main className="shell">
        <section className="card">Preparing exam details...</section>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="shell space-y-4 pb-8">
        <section className="card space-y-3">
          <h1 className="font-heading text-3xl font-bold">Secure Exam Setup</h1>
          <p className="text-sm text-black/70">
            Camera and detection engine are initialized before your test starts.
            Timer begins only after setup completes.
          </p>
          <div className="grid gap-2 text-sm md:grid-cols-2">
            <div className="rounded-lg border border-black/10 p-2">
              <p className="text-black/60">Camera</p>
              <p className="font-semibold">
                {cameraReady ? "Ready" : "Initializing..."}
              </p>
            </div>
            <div className="rounded-lg border border-black/10 p-2">
              <p className="text-black/60">Detector</p>
              <p className="font-semibold">{statusLabel}</p>
            </div>
          </div>
          <div className="max-w-md">
            <WebcamFeed videoRef={videoRef} />
          </div>
          <button
            className="btn btn-primary"
            type="button"
            onClick={startSecureSession}
            disabled={!secureEnvironmentReady || startingSession}
          >
            {startingSession ? "Starting..." : "Start Secure Exam"}
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="shell space-y-4 pb-8">
      <ViolationOverlay lastViolation={lastViolation} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-heading text-3xl font-bold">Exam Session</h1>
        <Timer label={label} />
      </div>
      {!isFullscreen ? (
        <div className="card border-amber-200 bg-amber-50 text-sm text-amber-800">
          Fullscreen is not active. Click below to enter exam mode.
          <div className="mt-2">
            <button className="btn btn-primary" onClick={enterFullscreen}>
              Enter Fullscreen
            </button>
          </div>
        </div>
      ) : null}
      {!cameraReady ? (
        <div className="card border-amber-200 bg-amber-50 text-sm text-amber-800">
          Waiting for camera stream to initialize...
        </div>
      ) : null}
      <div className="grid gap-4 md:grid-cols-[2fr,1fr]">
        <QuestionPanel
          questions={questions}
          answers={answers}
          setAnswers={setAnswers}
        />
        <div className="card space-y-3">
          <h2 className="font-heading text-xl font-semibold">
            Live Proctor Feed
          </h2>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-lg border border-black/10 p-2">
              <p className="text-black/60">Suspicion</p>
              <p className="font-semibold">{suspicionScore}/100</p>
            </div>
            <div className="rounded-lg border border-black/10 p-2">
              <p className="text-black/60">Violations</p>
              <p className="font-semibold">{violationsCount}</p>
            </div>
          </div>
          <p className="text-xs text-black/60">
            Detector: {statusLabel}
          </p>
          <WebcamFeed videoRef={videoRef} />
          <p className="text-xs text-black/60">
            Copy/paste, tab focus loss, fullscreen exit, blur, and context menu
            are monitored.
          </p>
          <button className="btn btn-primary w-full" onClick={submitExam}>
            Submit Exam
          </button>
        </div>
      </div>
    </main>
  );
}
