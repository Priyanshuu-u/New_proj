import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { jsPDF } from "jspdf";
import ViolationLog from "../../components/dashboard/ViolationLog.jsx";
import api from "../../services/api.js";

export default function ResultsPage() {
  const { id } = useParams();
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    api
      .get(`/sessions/test/${id}`)
      .then((res) => setSessions(res.data))
      .catch(() => setSessions([]));
  }, [id]);

  async function fetchReport(sessionId) {
    const { data } = await api.get(`/sessions/${sessionId}/report`);
    return data;
  }

  async function exportJson(sessionId) {
    const report = await fetchReport(sessionId);
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report-${sessionId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function exportPdf(sessionId) {
    const report = await fetchReport(sessionId);
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("ProctorAI Exam Report", 14, 16);
    doc.setFontSize(11);
    doc.text(`Student: ${report.student?.name || "Unknown"}`, 14, 28);
    doc.text(`Test: ${report.test?.title || "Unknown"}`, 14, 35);
    doc.text(`Score: ${report.score}/${report.test?.totalMarks || 0}`, 14, 42);
    doc.text(`Suspicion Score: ${report.suspicionScore}`, 14, 49);
    doc.text(`Status: ${report.status}`, 14, 56);

    let line = 66;
    doc.setFontSize(12);
    doc.text("Violation Summary", 14, line);
    line += 7;
    doc.setFontSize(10);

    Object.entries(report.violationSummary || {}).forEach(([type, count]) => {
      doc.text(`${type}: ${count}`, 14, line);
      line += 6;
    });

    if (line > 260) {
      doc.addPage();
      line = 20;
    }

    doc.setFontSize(12);
    doc.text("Timeline", 14, line);
    line += 7;
    doc.setFontSize(9);

    (report.violations || []).slice(0, 20).forEach((v) => {
      doc.text(
        `${new Date(v.timestamp).toLocaleString()} - ${v.type} (${v.severity})`,
        14,
        line,
      );
      line += 5;
      if (line > 280) {
        doc.addPage();
        line = 20;
      }
    });

    doc.save(`report-${sessionId}.pdf`);
  }

  return (
    <main className="shell space-y-4">
      <h1 className="font-heading text-3xl font-bold">Results</h1>
      {sessions.map((session) => (
        <div className="card" key={session._id}>
          <h2 className="font-heading text-xl font-semibold">
            {session.student?.name}
          </h2>
          <p className="text-sm">Score: {session.score}</p>
          <p className="text-sm">Suspicion: {session.suspicionScore}</p>
          <div className="mt-2 flex gap-2">
            <button
              className="btn btn-ghost"
              onClick={() => exportJson(session._id)}
            >
              Export JSON
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => exportPdf(session._id)}
            >
              Export PDF
            </button>
          </div>
          <div className="mt-2">
            <ViolationLog violations={session.violations} />
          </div>
        </div>
      ))}
    </main>
  );
}
