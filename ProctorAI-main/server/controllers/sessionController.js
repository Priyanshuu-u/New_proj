import mongoose from "mongoose";
import ExamSession from "../models/ExamSession.js";
import Test from "../models/Test.js";
import User from "../models/User.js";
import { addSuspicionPoints } from "../utils/scoring.js";

function normalizeBatch(batch) {
  return String(batch || "")
    .trim()
    .toLowerCase();
}

function gradeAnswers(test, answers = []) {
  const byQuestionId = new Map(
    answers.map((a) => [String(a.questionId), a.response]),
  );
  let score = 0;

  const graded = test.questions.map((q) => {
    const response = byQuestionId.get(String(q._id)) || "";
    const normalizedResponse = response.trim().toLowerCase();
    const normalizedCorrect = (q.correctAnswer || "").trim().toLowerCase();
    const marksAwarded = normalizedResponse === normalizedCorrect ? q.marks : 0;
    score += marksAwarded;

    return {
      questionId: q._id,
      response,
      marksAwarded,
    };
  });

  return { score, graded };
}

export async function startSession(req, res) {
  const { testId } = req.body;

  const test = await Test.findById(testId);
  if (!test) {
    return res.status(404).json({ message: "Test not found" });
  }

  const now = new Date();
  if (test.startTime && now < new Date(test.startTime)) {
    return res.status(400).json({ message: "Exam has not started yet" });
  }

  if (test.endTime && now > new Date(test.endTime)) {
    return res.status(400).json({ message: "Exam window has ended" });
  }

  const student = await User.findById(req.user.id).select("batch");
  const normalizedBatch = normalizeBatch(student?.batch || "");
  const isOpen =
    (!test.assignedTo || test.assignedTo.length === 0) &&
    (!test.targetBatches || test.targetBatches.length === 0);
  const isAssigned = (test.assignedTo || []).some(
    (studentId) => String(studentId) === req.user.id,
  );
  const isBatchTargeted =
    normalizedBatch && (test.targetBatches || []).includes(normalizedBatch);

  if (!isOpen && !isAssigned && !isBatchTargeted) {
    return res
      .status(403)
      .json({ message: "You are not assigned to this test" });
  }

  const existing = await ExamSession.findOne({
    test: test._id,
    student: req.user.id,
  }).sort({ createdAt: -1 });

  if (existing) {
    if (existing.status === "active") {
      return res.status(200).json(existing);
    }
    return res.status(409).json({
      message: "You have already completed this test",
      sessionId: String(existing._id),
    });
  }

  try {
    const session = await ExamSession.create({
      student: req.user.id,
      test: test._id,
      status: "active",
    });

    return res.status(201).json(session);
  } catch (error) {
    if (error?.code === 11000) {
      const duplicate = await ExamSession.findOne({
        test: test._id,
        student: req.user.id,
      }).sort({ createdAt: -1 });

      if (duplicate) {
        if (duplicate.status === "active") {
          return res.status(200).json(duplicate);
        }
        return res.status(409).json({
          message: "You have already completed this test",
          sessionId: String(duplicate._id),
        });
      }
    }
    throw error;
  }
}

export async function submitSession(req, res) {
  const { answers = [] } = req.body;
  const session = await ExamSession.findById(req.params.id).select(
    "student test status answers",
  );

  if (!session) {
    return res.status(404).json({ message: "Session not found" });
  }

  if (String(session.student) !== req.user.id) {
    return res.status(403).json({ message: "Not your session" });
  }

  if (session.status !== "active") {
    return res.json(session);
  }

  const test = await Test.findById(session.test);
  if (!test) {
    return res.status(404).json({ message: "Associated test not found" });
  }

  const { score, graded } = gradeAnswers(test, answers);
  const submittedAt = new Date();

  const updated = await ExamSession.findOneAndUpdate(
    { _id: session._id, status: "active" },
    {
      $set: {
        answers: graded,
        score,
        status: "submitted",
        submittedAt,
      },
    },
    { new: true },
  );

  if (!updated) {
    const latest = await ExamSession.findById(session._id);
    return res.json(latest || session);
  }

  return res.json(updated);
}

export async function getSessionById(req, res) {
  const session = await ExamSession.findById(req.params.id)
    .populate("student", "name email")
    .populate("test", "title questions");

  if (!session) {
    return res.status(404).json({ message: "Session not found" });
  }

  if (
    req.user.role === "student" &&
    String(session.student._id) !== req.user.id
  ) {
    return res.status(403).json({ message: "Forbidden" });
  }

  if (req.user.role === "examiner") {
    const test = await Test.findById(session.test._id).select("createdBy");
    if (!test || String(test.createdBy) !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }
  }

  return res.json(session);
}

export async function getSessionsByTest(req, res) {
  const testId = req.params.testId;
  if (!mongoose.isValidObjectId(testId)) {
    return res.status(400).json({ message: "Invalid test id" });
  }

  const test = await Test.findById(testId).select("createdBy");
  if (!test) {
    return res.status(404).json({ message: "Test not found" });
  }

  if (String(test.createdBy) !== req.user.id) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const sessions = await ExamSession.find({ test: testId })
    .populate("student", "name email")
    .sort({ createdAt: -1 });

  return res.json(sessions);
}

export async function getMySessionByTest(req, res) {
  const { testId } = req.params;
  if (!mongoose.isValidObjectId(testId)) {
    return res.status(400).json({ message: "Invalid test id" });
  }

  const session = await ExamSession.findOne({
    test: testId,
    student: req.user.id,
  })
    .sort({ createdAt: -1 })
    .populate("test", "title questions passMarks");

  if (!session) {
    return res.status(404).json({ message: "No session found for this test" });
  }

  return res.json(session);
}

export async function getExaminerReport(req, res) {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: "Invalid session id" });
  }

  const session = await ExamSession.findById(id)
    .populate("student", "name email")
    .populate("test", "title passMarks questions");

  if (!session) {
    return res.status(404).json({ message: "Session not found" });
  }

  if (req.user.role === "examiner") {
    const test = await Test.findById(session.test._id).select("createdBy");
    if (!test || String(test.createdBy) !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }
  } else if (String(session.student._id) !== req.user.id) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const totalMarks = (session.test.questions || []).reduce(
    (sum, q) => sum + (q.marks || 0),
    0,
  );
  const grouped = session.violations.reduce((acc, violation) => {
    acc[violation.type] = (acc[violation.type] || 0) + 1;
    return acc;
  }, {});

  return res.json({
    sessionId: String(session._id),
    status: session.status,
    startedAt: session.startedAt,
    submittedAt: session.submittedAt,
    suspicionScore: session.suspicionScore,
    student: session.student,
    test: {
      id: String(session.test._id),
      title: session.test.title,
      passMarks: session.test.passMarks || 0,
      totalMarks,
    },
    score: session.score,
    violations: session.violations,
    violationSummary: grouped,
    answers: session.answers,
  });
}

export async function logViolation(req, res) {
  const { type, snapshot = "", severity = "low", timestamp } = req.body;

  if (!type) {
    return res.status(400).json({ message: "Violation type is required" });
  }

  const session = await ExamSession.findById(req.params.id).select(
    "student test status violations suspicionScore",
  );
  if (!session) {
    return res.status(404).json({ message: "Session not found" });
  }

  if (String(session.student) !== req.user.id) {
    return res.status(403).json({ message: "Not your session" });
  }

  const violation = {
    type,
    snapshot,
    severity,
    timestamp: timestamp ? new Date(timestamp) : new Date(),
  };

  const test = await Test.findById(session.test);
  const nextSuspicionScore = addSuspicionPoints(session.suspicionScore, type);
  const nextViolationCount = (session.violations || []).length + 1;
  const shouldAutoSubmit =
    test && nextViolationCount > test.maxViolationsAllowed;

  const updated = await ExamSession.findByIdAndUpdate(
    session._id,
    {
      $push: { violations: violation },
      $set: {
        suspicionScore: nextSuspicionScore,
        ...(shouldAutoSubmit
          ? { status: "auto-submitted", submittedAt: new Date() }
          : {}),
      },
    },
    { new: true },
  );

  if (!updated) {
    return res.status(409).json({ message: "Unable to update session" });
  }

  const io = req.app.get("io");
  io.to(`test_${updated.test}`).emit("violation_broadcast", {
    studentId: String(updated.student),
    sessionId: String(updated._id),
    suspicionScore: updated.suspicionScore,
    ...violation,
  });

  return res.status(201).json({
    suspicionScore: updated.suspicionScore,
    status: updated.status,
  });
}
