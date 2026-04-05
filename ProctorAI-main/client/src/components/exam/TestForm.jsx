import { useMemo } from "react";

const questionTemplate = {
  type: "mcq",
  text: "",
  options: ["", "", "", ""],
  correctAnswer: "",
  marks: 1,
};

function toDateInputValue(isoDate) {
  if (!isoDate) return "";
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return "";
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

export default function TestForm({ value, setValue, onSubmit, submitLabel }) {
  const totalMarks = useMemo(
    () => (value.questions || []).reduce((sum, q) => sum + (q.marks || 0), 0),
    [value.questions],
  );

  function setField(key, next) {
    setValue((prev) => ({ ...prev, [key]: next }));
  }

  function setQuestion(index, key, next) {
    setValue((prev) => {
      const questions = [...prev.questions];
      questions[index] = { ...questions[index], [key]: next };
      return { ...prev, questions };
    });
  }

  function setOption(qIndex, optIndex, next) {
    setValue((prev) => {
      const questions = [...prev.questions];
      const opts = [...(questions[qIndex].options || [])];
      opts[optIndex] = next;
      questions[qIndex] = { ...questions[qIndex], options: opts };
      return { ...prev, questions };
    });
  }

  function addQuestion() {
    setValue((prev) => ({
      ...prev,
      questions: [...prev.questions, { ...questionTemplate }],
    }));
  }

  function removeQuestion(index) {
    setValue((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }));
  }

  function normalizePayload(payload) {
    const questions = (payload.questions || []).map((q) => ({
      ...q,
      options: q.type === "mcq" ? (q.options || []).filter(Boolean) : [],
      marks: Number(q.marks) || 1,
    }));

    return {
      ...payload,
      duration: Number(payload.duration) || 30,
      maxViolationsAllowed: Number(payload.maxViolationsAllowed) || 8,
      passMarks: Number(payload.passMarks) || 0,
      targetBatches: payload.targetBatches || "",
      assignedToEmails: payload.assignedToEmails || "",
      startTime: payload.startTime || undefined,
      endTime: payload.endTime || undefined,
      questions,
    };
  }

  return (
    <form
      className="card space-y-4"
      onSubmit={(e) => onSubmit(e, normalizePayload(value))}
    >
      <h1 className="font-heading text-2xl font-bold">{submitLabel}</h1>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm text-black/70">
          Test Title
          <input
            className="mt-1 w-full rounded-xl border p-2"
            placeholder="Title"
            required
            value={value.title}
            onChange={(e) => setField("title", e.target.value)}
          />
        </label>
        <label className="text-sm text-black/70">
          Duration (minutes)
          <input
            className="mt-1 w-full rounded-xl border p-2"
            type="number"
            min="1"
            value={value.duration}
            onChange={(e) => setField("duration", e.target.value)}
            placeholder="Duration (minutes)"
          />
        </label>
        <label className="text-sm text-black/70">
          Start Time
          <input
            className="mt-1 w-full rounded-xl border p-2"
            type="datetime-local"
            value={toDateInputValue(value.startTime)}
            onChange={(e) =>
              setField(
                "startTime",
                e.target.value ? new Date(e.target.value).toISOString() : "",
              )
            }
          />
        </label>
        <label className="text-sm text-black/70">
          End Time
          <input
            className="mt-1 w-full rounded-xl border p-2"
            type="datetime-local"
            value={toDateInputValue(value.endTime)}
            onChange={(e) =>
              setField(
                "endTime",
                e.target.value ? new Date(e.target.value).toISOString() : "",
              )
            }
          />
        </label>
        <label className="text-sm text-black/70">
          Max Violations Allowed
          <input
            className="mt-1 w-full rounded-xl border p-2"
            type="number"
            min="0"
            value={value.maxViolationsAllowed}
            onChange={(e) => setField("maxViolationsAllowed", e.target.value)}
            placeholder="Max violations"
          />
        </label>
        <label className="text-sm text-black/70">
          Pass Marks
          <input
            className="mt-1 w-full rounded-xl border p-2"
            type="number"
            min="0"
            value={value.passMarks}
            onChange={(e) => setField("passMarks", e.target.value)}
            placeholder="Pass marks"
          />
        </label>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={Boolean(value.shuffleQuestions)}
          onChange={(e) => setField("shuffleQuestions", e.target.checked)}
        />
        Shuffle questions for students
      </label>

      <textarea
        className="w-full rounded-xl border p-2"
        rows={3}
        placeholder="Description"
        value={value.description}
        onChange={(e) => setField("description", e.target.value)}
      />

      <div className="grid gap-3 md:grid-cols-2">
        <input
          className="w-full rounded-xl border p-2"
          placeholder="Target batches (comma-separated, e.g. cse-2026-a, cse-2026-b)"
          value={value.targetBatches || ""}
          onChange={(e) => setField("targetBatches", e.target.value)}
        />
        <textarea
          className="w-full rounded-xl border p-2"
          rows={3}
          placeholder="Assign specific student emails (comma or newline separated)"
          value={value.assignedToEmails || ""}
          onChange={(e) => setField("assignedToEmails", e.target.value)}
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-xl font-semibold">Questions</h2>
          <button className="btn btn-ghost" type="button" onClick={addQuestion}>
            Add Question
          </button>
        </div>

        {(value.questions || []).map((q, index) => (
          <div
            className="rounded-2xl border border-black/10 p-3"
            key={q._id || index}
          >
            <div className="grid gap-2 md:grid-cols-[1fr,160px,120px,auto]">
              <input
                className="w-full rounded-xl border p-2"
                placeholder={`Question ${index + 1}`}
                required
                value={q.text}
                onChange={(e) => setQuestion(index, "text", e.target.value)}
              />
              <select
                className="rounded-xl border p-2"
                value={q.type}
                onChange={(e) => setQuestion(index, "type", e.target.value)}
              >
                <option value="mcq">MCQ</option>
                <option value="short">Short Answer</option>
              </select>
              <input
                className="rounded-xl border p-2"
                type="number"
                min="1"
                value={q.marks}
                onChange={(e) => setQuestion(index, "marks", e.target.value)}
              />
              <button
                className="btn btn-ghost"
                type="button"
                onClick={() => removeQuestion(index)}
              >
                Remove
              </button>
            </div>

            {q.type === "mcq" ? (
              <div className="mt-2 grid gap-2 md:grid-cols-2">
                {(q.options || ["", "", "", ""]).map((option, optIndex) => (
                  <input
                    key={optIndex}
                    className="w-full rounded-xl border p-2"
                    placeholder={`Option ${optIndex + 1}`}
                    value={option}
                    onChange={(e) => setOption(index, optIndex, e.target.value)}
                  />
                ))}
              </div>
            ) : null}

            <input
              className="mt-2 w-full rounded-xl border p-2"
              placeholder="Correct answer"
              required
              value={q.correctAnswer}
              onChange={(e) =>
                setQuestion(index, "correctAnswer", e.target.value)
              }
            />
          </div>
        ))}
      </div>

      <p className="text-sm text-black/70">Total marks: {totalMarks}</p>

      <button className="btn btn-primary" type="submit">
        {submitLabel}
      </button>
    </form>
  );
}
