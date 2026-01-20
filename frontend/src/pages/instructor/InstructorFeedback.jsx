import { useEffect, useMemo, useState } from "react";
import api from "../../services/api";

const YES_NO_OPTIONS = ["Yes", "No"];
const LIKERT5_OPTIONS = [
  "Strongly agree",
  "Agree",
  "Neither agree nor disagree",
  "Disagree",
  "Strongly disagree",
];

const QUESTIONS = [
  {
    key: "q1",
    label:
      "Q1: Instructor informed the evaluation criteria within the first two weeks of the semester.",
    type: "yesno",
  },
  {
    key: "q2",
    label:
      "Q2: Number of Lectures taken by course instructor were Equal to (or More than) the total number of scheduled lectures.",
    type: "yesno",
  },
  {
    key: "q3",
    label:
      "Q3: The instructor adapted professional practices such as, covering the whole syllabus, lectures taken by him not by TAs, treating students equally, keeping methods of evaluation consistent and clear etc. in the class.",
    type: "likert5",
  },
  {
    key: "q4",
    label:
      "Q4: The instructor was sincere (timely returning the quizzes/ exam answer-scripts, etc).",
    type: "likert5",
  },
  {
    key: "q5",
    label:
      "Q5: The instructor had command over the subject and he/she came prepared (e.g. he/she could explain the concepts well, etc.).",
    type: "likert5",
  },
  { key: "q6", label: "Q6: The objectives of the course were achieved.", type: "likert5" },
  {
    key: "q7",
    label:
      "Q7: Instructor was effective in delivery of lectures (Board work or Slides used for teaching was effective, clear and audible voice and English comprehension etc.)",
    type: "likert5",
  },
  {
    key: "q8",
    label:
      "Q8: Quality of questions raised in exams/assignments/classes by the instructor was adequate.",
    type: "likert5",
  },
  {
    key: "q9",
    label:
      "Q9: Instructor made efforts to encourage discussion and class participation in order to enhance students’ learning experience and progress.",
    type: "likert5",
  },
  {
    key: "q10",
    label:
      "Q10: Instructor could explain satisfactorily to the queries raised by the students.",
    type: "likert5",
  },
];

const LIKERT_SCORE = {
  "Strongly agree": 5,
  Agree: 4,
  "Neither agree nor disagree": 3,
  Disagree: 2,
  "Strongly disagree": 1,
};

export default function InstructorFeedback() {
  const user = JSON.parse(sessionStorage.getItem("user"));

  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState("");
  const [feedbackType, setFeedbackType] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showRaw, setShowRaw] = useState(true);

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

  const analysis = useMemo(() => {
    const total = rows.length;

    const byQuestion = QUESTIONS.map((q) => {
      const options = q.type === "yesno" ? YES_NO_OPTIONS : LIKERT5_OPTIONS;
      const counts = Object.fromEntries(options.map((o) => [o, 0]));
      let answered = 0;

      let scoreSum = 0;
      let scoreCount = 0;

      for (const r of rows) {
        const raw = r?.[q.key];
        if (!raw) continue;
        const val = String(raw).trim();
        if (!val) continue;

        answered += 1;
        if (counts[val] !== undefined) counts[val] += 1;

        if (q.type === "likert5" && LIKERT_SCORE[val] !== undefined) {
          scoreSum += LIKERT_SCORE[val];
          scoreCount += 1;
        }
      }

      const avgScore =
        q.type === "likert5" && scoreCount > 0 ? scoreSum / scoreCount : null;

      return {
        ...q,
        total,
        answered,
        counts,
        options,
        avgScore,
      };
    });

    const comments = rows
      .map((r) => (r?.q11 ? String(r.q11).trim() : ""))
      .filter(Boolean);

    return { total, byQuestion, comments };
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
        <div className="space-y-6">
          {/* ======= Analysis ======= */}
          <div className="border rounded p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-gray-900">Feedback analysis</p>
                <p className="text-sm text-gray-600">
                  Showing distribution for each question (counts + %).
                </p>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={showRaw}
                  onChange={(e) => setShowRaw(e.target.checked)}
                />
                Show raw responses
              </label>
            </div>

            <div className="mt-4 space-y-5">
              {analysis.byQuestion.map((q) => (
                <div key={q.key} className="border rounded p-4 bg-gray-50">
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                    <p className="font-semibold text-gray-900">{q.label}</p>
                    <div className="text-xs text-gray-600">
                      Answered: {q.answered}/{q.total}
                      {q.avgScore !== null && (
                        <span className="ml-3">
                          Avg: {q.avgScore.toFixed(2)} / 5
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    {q.options.map((opt) => {
                      const count = q.counts[opt] || 0;
                      const denom = q.answered || 0;
                      const pct = denom > 0 ? Math.round((count / denom) * 100) : 0;
                      return (
                        <div key={opt} className="grid grid-cols-12 gap-3 items-center">
                          <div className="col-span-12 md:col-span-4 text-sm text-gray-800">
                            {opt}
                          </div>
                          <div className="col-span-12 md:col-span-6">
                            <div className="w-full h-2 bg-gray-200 rounded">
                              <div
                                className="h-2 bg-blue-600 rounded"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                          <div className="col-span-12 md:col-span-2 text-xs text-gray-700">
                            {count} ({pct}%)
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              <div className="border rounded p-4 bg-gray-50">
                <p className="font-semibold text-gray-900 mb-2">Q11 Comments</p>
                {analysis.comments.length === 0 ? (
                  <p className="text-sm text-gray-600">No comments submitted.</p>
                ) : (
                  <ul className="list-disc pl-5 space-y-2 text-sm text-gray-800">
                    {analysis.comments.map((c, idx) => (
                      <li key={idx} className="whitespace-pre-wrap">
                        {c}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* ======= Raw responses ======= */}
          {showRaw && (
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

