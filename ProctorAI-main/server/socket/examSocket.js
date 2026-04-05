export function registerExamSocket(io) {
  io.on("connection", (socket) => {
    socket.on("join_exam_room", ({ examId, studentId }) => {
      if (!examId) return;
      socket.join(`test_${examId}`);
      if (studentId) {
        socket.join(`student_${studentId}`);
      }
    });

    socket.on("violation_event", (payload) => {
      const {
        examId,
        studentId,
        type,
        severity,
        snapshot,
        timestamp,
        suspicionScore,
      } = payload || {};

      if (!examId || !studentId || !type) return;

      io.to(`test_${examId}`).emit("violation_broadcast", {
        studentId,
        type,
        severity,
        snapshot,
        timestamp,
        suspicionScore,
      });
    });

    socket.on("student_submitted", ({ examId, studentId }) => {
      io.to(`test_${examId}`).emit("student_submitted", { studentId, examId });
    });

    socket.on("force_submit", ({ studentId, reason }) => {
      io.to(`student_${studentId}`).emit("force_submit", { reason });
    });

    socket.on("exam_terminated", ({ studentId, reason }) => {
      io.to(`student_${studentId}`).emit("exam_terminated", { reason });
    });
  });
}
