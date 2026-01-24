import { useEffect, useMemo, useState } from "react";
import api from "../../services/api";

/* ================= CONSTANTS ================= */

const YES_NO_OPTIONS = ["Yes", "No"];

const LIKERT5_OPTIONS = [
  "Strongly agree",
  "Agree",
  "Neither agree nor disagree",
  "Disagree",
  "Strongly disagree",
];

const QUESTIONS = [
  { key: "q1", label: "Q1: Instructor informed the evaluation criteria within the first two weeks of the semester.", type: "yesno" },
  { key: "q2", label: "Q2: Number of lectures taken were equal to or more than scheduled.", type: "yesno" },
  { key: "q3", label: "Q3: Instructor followed professional practices.", type: "likert5" },
  { key: "q4", label: "Q4: Instructor was sincere in evaluation.", type: "likert5" },
  { key: "q5", label: "Q5: Instructor had command over the subject.", type: "likert5" },
  { key: "q6", label: "Q6: Course objectives were achieved.", type: "likert5" },
  { key: "q7", label: "Q7: Instructor was effective in delivery.", type: "likert5" },
  { key: "q8", label: "Q8: Quality of questions was adequate.", type: "likert5" },
  { key: "q9", label: "Q9: Instructor encouraged discussion.", type: "likert5" },
  { key: "q10", label: "Q10: Instructor answered queries satisfactorily.", type: "likert5" },
];

const LIKERT_SCORE = {
  "Strongly agree": 5,
  Agree: 4,
  "Neither agree nor disagree": 3,
  Disagree: 2,
  "Strongly disagree": 1,
};

/* ================= COMPONENT ================= */

export default function InstructorFeedback() {
  const storedUser = localStorage.getItem("user");
  const userId = storedUser ? JSON.parse(storedUser)?.id : null;

  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState("");
  const [feedbackType, setFeedbackType] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showRaw, setShowRaw] = useState(true);

  /* ================= FETCH COURSES ================= */

  useEffect(() => {
    if (!userId) return;

    api
      .get("/instructor/courses", {
        params: { instructor_id: userId },
      })
      .then((res) => setCourses(res.data || []))
      .catch(() => setCourses([]));
  }, [userId]);

  /* ================= FETCH FEEDBACK ================= */

  useEffect(() => {
    if (!userId) return;

    setLoading(true);
    api
      .get("/instructor/feedback", {
        params: {
          instructor_id: userId,
          course_id: courseId || undefined,
          feedback_type: feedbackType || undefined,
        },
      })
      .then((res) => setRows(res.data || []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [userId, courseId, feedbackType]);

  /* ================= ANALYSIS ================= */

  const analysis = useMemo(() => {
    const byQuestion = QUESTIONS.map((q) => {
      const options = q.type === "yesno" ? YES_NO_OPTIONS : LIKERT5_OPTIONS;
      const counts = Object.fromEntries(options.map((o) => [o, 0]));
      let scoreSum = 0;
      let scoreCount = 0;

      rows.forEach((r) => {
        const val = r?.[q.key];
        if (!val) return;
        if (counts[val] !== undefined) counts[val]++;
        if (q.type === "likert5" && LIKERT_SCORE[val]) {
          scoreSum += LIKERT_SCORE[val];
          scoreCount++;
        }
      });

      return {
        ...q,
        options,
        counts,
        avgScore: scoreCount ? scoreSum / scoreCount : null,
      };
    });

    const comments = rows.map((r) => r?.q11?.trim()).filter(Boolean);

    return { byQuestion, comments };
  }, [rows]);

  /* ================= RENDER ================= */

  if (!userId) {
    return (
      <div className="p-10 text-red-600 font-semibold text-center">
        Session expired. Please login again.
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto bg-white border border-gray-400 p-8">
      <h2 className="text-xl font-bold mb-6">Instructor Feedback Summary</h2>

      {/* FILTERS */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <Select label="Course" value={courseId} onChange={setCourseId}>
          <option value="">All</option>
          {courses.map((c) => (
            <option key={c.course_id} value={c.course_id}>
              {c.course_code} – {c.title}
            </option>
          ))}
        </Select>

        <Select label="Feedback Type" value={feedbackType} onChange={setFeedbackType}>
          <option value="">All</option>
          <option value="Mid-sem">Mid-sem</option>
        </Select>
      </div>

      {loading ? (
        <p className="text-gray-600">Loading feedback...</p>
      ) : rows.length === 0 ? (
        <p className="text-gray-600">No feedback found.</p>
      ) : (
        <>
          {analysis.byQuestion.map((q) => (
            <div key={q.key} className="mb-6 border p-4">
              <div className="flex justify-between mb-2">
                <p className="font-semibold">{q.label}</p>
                {q.avgScore !== null && (
                  <span className="text-sm text-gray-600">
                    Avg: {q.avgScore.toFixed(2)} / 5
                  </span>
                )}
              </div>

              <table className="w-full text-sm border">
                <tbody>
                  {q.options.map((opt) => (
                    <tr key={opt}>
                      <td className="px-3 py-2 bg-gray-100 w-1/2">{opt}</td>
                      <td className="px-3 py-2">{q.counts[opt]} responses</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

          <div className="border p-4">
            <h3 className="font-semibold mb-2">Student Comments</h3>
            {analysis.comments.length === 0 ? (
              <p className="text-sm text-gray-600">No comments.</p>
            ) : (
              <ul className="list-disc pl-5 text-sm space-y-2">
                {analysis.comments.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-6">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={showRaw}
                onChange={(e) => setShowRaw(e.target.checked)}
              />
              Show raw responses
            </label>
          </div>

          {showRaw &&
            rows.map((r) => (
              <div key={r.feedback_id} className="border p-4 mt-4">
                <p className="font-semibold">
                  {r.course?.course_code} – {r.course?.title}
                </p>
                <p className="text-xs text-gray-500">
                  {r.feedback_type} · {new Date(r.created_at).toLocaleString()}
                </p>
              </div>
            ))}
        </>
      )}
    </div>
  );
}

/* ================= SELECT ================= */

function Select({ label, value, onChange, children }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-gray-400 px-3 py-2 text-sm"
      >
        {children}
      </select>
    </div>
  );
}
