import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import StudentCard from "../../components/dashboard/StudentCard.jsx";
import api from "../../services/api.js";
import { useSocket } from "../../hooks/useSocket.js";

export default function MonitorPage() {
  const { id } = useParams();
  const [sessions, setSessions] = useState([]);
  const [liveEvents, setLiveEvents] = useState([]);
  const socket = useSocket();

  useEffect(() => {
    api
      .get(`/sessions/test/${id}`)
      .then((res) => setSessions(res.data))
      .catch(() => setSessions([]));
  }, [id]);

  useEffect(() => {
    if (!socket) return;

    socket.emit("join_exam_room", { examId: id });

    function onViolation(data) {
      setLiveEvents((prev) => {
        const next = [data, ...prev];
        return next.slice(0, 40);
      });

      setSessions((prev) =>
        prev.map((session) =>
          String(session.student?._id || session.student) ===
          String(data.studentId)
            ? {
                ...session,
                suspicionScore: data.suspicionScore,
                violations: [...(session.violations || []), data],
              }
            : session,
        ),
      );
    }

    function onStudentSubmitted(data) {
      setSessions((prev) =>
        prev.map((session) =>
          String(session.student?._id || session.student) ===
          String(data.studentId)
            ? { ...session, status: "submitted" }
            : session,
        ),
      );
    }

    socket.on("violation_broadcast", onViolation);
    socket.on("student_submitted", onStudentSubmitted);
    return () => {
      socket.off("violation_broadcast", onViolation);
      socket.off("student_submitted", onStudentSubmitted);
    };
  }, [socket, id]);

  return (
    <main className="shell space-y-4">
      <h1 className="font-heading text-3xl font-bold">Live Monitor</h1>
      <div className="grid gap-3 md:grid-cols-3">
        <article className="card">
          <p className="text-sm text-black/60">Students in Session</p>
          <p className="font-heading text-3xl font-bold">{sessions.length}</p>
        </article>
        <article className="card">
          <p className="text-sm text-black/60">Active</p>
          <p className="font-heading text-3xl font-bold">
            {sessions.filter((s) => s.status === "active").length}
          </p>
        </article>
        <article className="card">
          <p className="text-sm text-black/60">High Risk</p>
          <p className="font-heading text-3xl font-bold">
            {sessions.filter((s) => (s.suspicionScore || 0) > 60).length}
          </p>
        </article>
      </div>
      <section className="grid gap-3 md:grid-cols-3">
        {sessions.map((session) => (
          <StudentCard key={session._id} session={session} />
        ))}
      </section>
      <section className="card">
        <h2 className="font-heading text-xl font-semibold">Live Activity Feed</h2>
        <p className="mt-1 text-xs text-black/60">
          Latest flagged activity with proof frames from student webcam.
        </p>
        <ul className="mt-3 space-y-2">
          {liveEvents.length ? (
            liveEvents.map((event, idx) => {
              const matched = sessions.find(
                (session) =>
                  String(session.student?._id || session.student) ===
                  String(event.studentId),
              );

              return (
                <li
                  key={`${event.studentId || "unknown"}-${event.timestamp || idx}-${idx}`}
                  className="rounded-xl border border-black/10 p-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold">
                      {matched?.student?.name || "Student"} • {event.type?.replaceAll("_", " ") || "violation"}
                    </p>
                    <p className="text-xs text-black/60">
                      {event.timestamp
                        ? new Date(event.timestamp).toLocaleString()
                        : "Just now"}
                    </p>
                  </div>
                  {event.snapshot ? (
                    <img
                      src={event.snapshot}
                      alt="Violation evidence"
                      className="mt-2 h-36 w-full rounded-lg border border-black/10 object-cover md:w-64"
                    />
                  ) : (
                    <p className="mt-2 text-xs text-black/60">No frame captured for this event.</p>
                  )}
                </li>
              );
            })
          ) : (
            <li className="text-sm text-black/60">No live activity yet.</li>
          )}
        </ul>
      </section>
    </main>
  );
}
