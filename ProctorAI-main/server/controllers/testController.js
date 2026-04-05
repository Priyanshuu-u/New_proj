import Test from "../models/Test.js";
import User from "../models/User.js";

function normalizeBatch(batch) {
  return String(batch || "")
    .trim()
    .toLowerCase();
}

function parseBatches(input) {
  if (Array.isArray(input)) {
    return [...new Set(input.map(normalizeBatch).filter(Boolean))];
  }
  if (typeof input === "string") {
    return [...new Set(input.split(",").map(normalizeBatch).filter(Boolean))];
  }
  return [];
}

function parseEmails(input) {
  if (Array.isArray(input)) {
    return [
      ...new Set(
        input
          .map((v) =>
            String(v || "")
              .trim()
              .toLowerCase(),
          )
          .filter(Boolean),
      ),
    ];
  }
  if (typeof input === "string") {
    return [
      ...new Set(
        input
          .split(/[,\n]/)
          .map((v) => v.trim().toLowerCase())
          .filter(Boolean),
      ),
    ];
  }
  return [];
}

async function resolveAudience(payload) {
  const targetBatches = parseBatches(payload.targetBatches);
  const emails = parseEmails(payload.assignedToEmails);

  let assignedTo = [];
  if (emails.length) {
    const students = await User.find({
      email: { $in: emails },
      role: "student",
    }).select("_id");
    assignedTo = students.map((s) => s._id);
  }

  return { assignedTo, targetBatches };
}

function studentFilter(userId, batch) {
  const normalizedBatch = normalizeBatch(batch);

  const openForAll = {
    $and: [{ assignedTo: { $size: 0 } }, { targetBatches: { $size: 0 } }],
  };

  const clauses = [{ assignedTo: userId }, openForAll];
  if (normalizedBatch) {
    clauses.push({ targetBatches: normalizedBatch });
  }

  return {
    $or: clauses,
  };
}

function sanitizeForStudent(testDoc) {
  const test = testDoc.toObject ? testDoc.toObject() : testDoc;
  return {
    ...test,
    questions: (test.questions || []).map((q) => ({
      _id: q._id,
      type: q.type,
      text: q.text,
      options: q.options || [],
      marks: q.marks,
    })),
  };
}

export async function getTests(req, res) {
  const { role, id } = req.user;
  const student =
    role === "student" ? await User.findById(id).select("batch") : null;
  const filter =
    role === "examiner"
      ? { createdBy: id }
      : studentFilter(id, student?.batch || "");
  const tests = await Test.find(filter).sort({ createdAt: -1 });
  if (role === "student") {
    return res.json(tests.map(sanitizeForStudent));
  }
  return res.json(tests);
}

export async function getTestById(req, res) {
  const test = await Test.findById(req.params.id);
  if (!test) {
    return res.status(404).json({ message: "Test not found" });
  }

  if (req.user.role === "examiner") {
    if (String(test.createdBy) !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const populated = await Test.findById(test._id).populate(
      "assignedTo",
      "email name batch",
    );
    const result = populated.toObject();
    result.assignedToEmails = (result.assignedTo || []).map((u) => u.email);
    return res.json(result);
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
    return res.status(403).json({ message: "Forbidden" });
  }

  return res.json(sanitizeForStudent(test));
}

export async function createTest(req, res) {
  const audience = await resolveAudience(req.body);
  const payload = {
    ...req.body,
    ...audience,
    createdBy: req.user.id,
  };
  delete payload.assignedToEmails;
  const test = await Test.create(payload);
  return res.status(201).json(test);
}

export async function updateTest(req, res) {
  const audience = await resolveAudience(req.body);
  const nextPayload = {
    ...req.body,
    ...audience,
  };
  delete nextPayload.assignedToEmails;

  const test = await Test.findOneAndUpdate(
    { _id: req.params.id, createdBy: req.user.id },
    nextPayload,
    { new: true },
  );

  if (!test) {
    return res.status(404).json({ message: "Test not found" });
  }

  return res.json(test);
}

export async function deleteTest(req, res) {
  const deleted = await Test.findOneAndDelete({
    _id: req.params.id,
    createdBy: req.user.id,
  });

  if (!deleted) {
    return res.status(404).json({ message: "Test not found" });
  }

  return res.status(204).send();
}
