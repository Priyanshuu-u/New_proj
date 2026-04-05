export default function QuestionPanel({ questions, answers, setAnswers }) {
  return (
    <div className="space-y-4">
      {questions.map((q, i) => (
        <div className="card" key={q._id || i}>
          <p className="font-semibold">
            {i + 1}. {q.text}
          </p>
          {q.type === "mcq" ? (
            <div className="mt-2 space-y-2">
              {q.options?.map((option) => (
                <label className="flex items-center gap-2" key={option}>
                  <input
                    type="radio"
                    name={`q-${i}`}
                    value={option}
                    checked={answers[q._id] === option}
                    onChange={(e) =>
                      setAnswers((prev) => ({
                        ...prev,
                        [q._id]: e.target.value,
                      }))
                    }
                  />
                  {option}
                </label>
              ))}
            </div>
          ) : (
            <textarea
              className="mt-2 w-full rounded-xl border p-2"
              rows={3}
              value={answers[q._id] || ""}
              onChange={(e) =>
                setAnswers((prev) => ({ ...prev, [q._id]: e.target.value }))
              }
            />
          )}
        </div>
      ))}
    </div>
  );
}
