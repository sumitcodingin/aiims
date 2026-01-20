import { useEffect, useMemo, useState } from "react";
import api from "../../services/api";

export default function InstructorFeedback() {
  const user = JSON.parse(sessionStorage.getItem("user"));

  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState("");
  const [feedbackType, setFeedbackType] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api
      .get("/instructor/courses", { params: { instructor_id: user.id } })
      .then((res) => setCourses(res.data || []))
      .catch(() => setCourses([]));
  }, [user.id]);

  const fetchRows = async () => {
    setLoading(true);
    try {
      const res = await api.get("/instructor/feedback", {
        params: {
          instructor_id: user.id,
          course_id: courseId || undefined,
          feedback_type: feedbackType || undefined,
        },
      });
      setRows(res.data || []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, feedbackType, user.id]);

  const summary = useMemo(() => {
    const total = rows.length;
    const byType = {};
    rows.forEach((r) => {
      byType[r.feedback_type] = (byType[r.feedback_type] || 0) + 1;
    });
    return { total, byType };
  }, [rows]);

  return (
    <div className="bg-white p-6 shadow rounded max-w-6xl">
      <h2 className="text-2xl font-bold mb-4">Anonymous Feedback Responses</h2>

      <div className="grid md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-sm font-semibold mb-1">Course</label>
          <select
            className="border px-3 py-2 rounded w-full"
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
          >
            <option value="">All</option>
            {courses.map((c) => (
              <option key={c.course_id} value={c.course_id}>
                {c.course_code} - {c.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">Feedback type</label>
          <select
            className="border px-3 py-2 rounded w-full"
            value={feedbackType}
            onChange={(e) => setFeedbackType(e.target.value)}
          >
            <option value="">All</option>
            <option value="Mid-sem">Mid-sem</option>
          </select>
        </div>

        <div className="flex items-end">
          <button
            onClick={fetchRows}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="text-sm text-gray-700 mb-4">
        <p className="font-semibold">Summary</p>
        <p>Total responses: {summary.total}</p>
        {Object.keys(summary.byType).length > 0 && (
          <p>
            By type:{" "}
            {Object.entries(summary.byType)
              .map(([k, v]) => `${k}: ${v}`)
              .join(", ")}
          </p>
        )}
      </div>

      {loading ? (
        <p className="text-gray-600">Loading feedback...</p>
      ) : rows.length === 0 ? (
        <p className="text-gray-600">No feedback found.</p>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.feedback_id} className="border rounded p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div>
                  <p className="font-semibold">
                    {r.course?.title || "Course"}{" "}
                    {r.course?.course_code ? `(${r.course.course_code})` : ""}
                  </p>
                  <p className="text-xs text-gray-500">
                    Type: {r.feedback_type} · Submitted:{" "}
                    {r.created_at ? new Date(r.created_at).toLocaleString() : "—"}
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-2 text-sm">
                <Answer label="Q1" value={r.q1} />
                <Answer label="Q2" value={r.q2} />
                <Answer label="Q3" value={r.q3} />
                <Answer label="Q4" value={r.q4} />
                <Answer label="Q5" value={r.q5} />
                <Answer label="Q6" value={r.q6} />
                <Answer label="Q7" value={r.q7} />
                <Answer label="Q8" value={r.q8} />
                <Answer label="Q9" value={r.q9} />
                <Answer label="Q10" value={r.q10} />
              </div>

              {r.q11 && (
                <div className="mt-3 text-sm">
                  <p className="font-semibold">Q11 Comment</p>
                  <p className="text-gray-700 whitespace-pre-wrap">{r.q11}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Answer({ label, value }) {
  return (
    <div className="flex gap-2">
      <span className="font-semibold text-gray-700">{label}:</span>
      <span className="text-gray-800">{value || "—"}</span>
    </div>
  );
}

