import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import TestForm from "../../components/exam/TestForm.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import api from "../../services/api.js";

const defaultPayload = {
  title: "",
  description: "",
  duration: 30,
  startTime: "",
  endTime: "",
  shuffleQuestions: false,
  maxViolationsAllowed: 8,
  passMarks: 0,
  targetBatches: "",
  assignedToEmails: "",
  questions: [],
};

export default function EditTestPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [payload, setPayload] = useState(defaultPayload);
  const [loading, setLoading] = useState(true);
  const { pushToast } = useToast();

  useEffect(() => {
    api
      .get(`/tests/${id}`)
      .then((res) =>
        setPayload({
          ...defaultPayload,
          ...res.data,
          targetBatches: (res.data.targetBatches || []).join(", "),
          assignedToEmails: (res.data.assignedToEmails || []).join(", "),
        }),
      )
      .finally(() => setLoading(false));
  }, [id]);

  async function submit(_e, normalizedPayload) {
    try {
      await api.put(`/tests/${id}`, normalizedPayload);
      pushToast("Test updated", "Changes saved", "success");
      navigate("/tests");
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to update test";
      pushToast("Update failed", msg, "error");
    }
  }

  if (loading) {
    return (
      <main className="shell">
        <section className="card">Loading test details...</section>
      </main>
    );
  }

  return (
    <main className="shell">
      <TestForm
        value={payload}
        setValue={setPayload}
        onSubmit={submit}
        submitLabel="Update Test"
      />
    </main>
  );
}
