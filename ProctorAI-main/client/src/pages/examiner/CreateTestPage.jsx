import { useState } from "react";
import { useNavigate } from "react-router-dom";
import TestForm from "../../components/exam/TestForm.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import api from "../../services/api.js";

const emptyQuestion = {
  type: "mcq",
  text: "",
  options: ["", "", "", ""],
  correctAnswer: "",
  marks: 1,
};

export default function CreateTestPage() {
  const [payload, setPayload] = useState({
    title: "",
    description: "",
    duration: "",
    startTime: "",
    endTime: "",
    shuffleQuestions: false,
    maxViolationsAllowed: "",
    passMarks: "",
    targetBatches: "",
    assignedToEmails: "",
    questions: [emptyQuestion],
  });

  const navigate = useNavigate();
  const { pushToast } = useToast();

  async function submit(_e, normalizedPayload) {
    try {
      await api.post("/tests", normalizedPayload);
      pushToast("Test created", "You can now monitor or edit it", "success");
      navigate("/tests");
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to create test";
      pushToast("Create failed", msg, "error");
    }
  }

  return (
    <main className="shell">
      <TestForm
        value={payload}
        setValue={setPayload}
        onSubmit={submit}
        submitLabel="Create Test"
      />
    </main>
  );
}
