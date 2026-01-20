import { useEffect, useMemo, useState } from "react";
import api from "../../services/api";

const LIKERT5 = [
  "Strongly agree",
  "Agree",
  "Neither agree nor disagree",
  "Disagree",
  "Strongly disagree",
];

export default function CourseInstructorFeedback() {
  const user = JSON.parse(sessionStorage.getItem("user"));

  const [loading, setLoading] = useState(true);
  const [options, setOptions] = useState([]);

  const [feedbackType, setFeedbackType] = useState("Mid-sem");
  const [selectedKey, setSelectedKey] = useState("");

  const [answers, setAnswers] = useState({
    q1: "",
    q2: "",
    q3: "",
    q4: "",
    q5: "",
    q6: "",
    q7: "",
    q8: "",
    q9: "",
    q10: "",
    q11: "",
  });

  const selected = useMemo(() => {
    if (!selectedKey) return null;
    const [course_id, instructor_id] = selectedKey.split("|");
    return options.find(
      (o) =>
        String(o.course_id) === String(course_id) &&
        String(o.instructor_id) === String(instructor_id)
    );
  }, [selectedKey, options]);

  useEffect(() => {
    setLoading(true);
    api
      .get("/student/feedback/options", {
        params: { student_id: user.id },
      })
      .then((res) => setOptions(res.data || []))
      .catch(() => setOptions([]))
      .finally(() => setLoading(false));
  }, [user.id]);

  const setQ = (key, value) => setAnswers((p) => ({ ...p, [key]: value }));

  const validate = () => {
    const requiredKeys = [
      "q1",
      "q2",
      "q3",
      "q4",
      "q5",
      "q6",
      "q7",
      "q8",
      "q9",
      "q10",
    ];
    if (!feedbackType) return "Feedback type is required.";
    if (!selected) return "Please select the course instructor.";
    for (const k of requiredKeys) {
      if (!answers[k]) return "Please answer all mandatory questions (*1 to *10).";
    }
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) return alert(err);

    try {
      await api.post("/student/feedback/submit", {
        student_id: user.id,
        course_id: selected.course_id,
        instructor_id: selected.instructor_id,
        feedback_type: feedbackType,
        q1: answers.q1,
        q2: answers.q2,
        q3: answers.q3,
        q4: answers.q4,
        q5: answers.q5,
        q6: answers.q6,
        q7: answers.q7,
        q8: answers.q8,
        q9: answers.q9,
        q10: answers.q10,
        q11: answers.q11 || null,
      });

      alert("Feedback submitted successfully.");
      setSelectedKey("");
      setAnswers({
        q1: "",
        q2: "",
        q3: "",
        q4: "",
        q5: "",
        q6: "",
        q7: "",
        q8: "",
        q9: "",
        q10: "",
        q11: "",
      });
    } catch (e) {
      alert(e?.response?.data?.message || e?.response?.data?.error || "Submit failed.");
    }
  };

  if (loading) {
    return <p className="text-gray-600">Loading feedback form...</p>;
  }

  return (
    <div className="bg-white p-6 shadow rounded max-w-5xl">
      <h2 className="text-2xl font-bold mb-2">Course Instructor Feedback</h2>

      <div className="text-sm text-gray-700 mb-6">
        <p className="font-semibold mb-2">Please note the following before submitting:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>All fields marked with a &apos;*&apos; are mandatory.</li>
          <li>Feedback for one course instructor can be submitted only once.</li>
          <li>
            When there are more than one instructors teaching a course, please choose only those
            instructors (one at a time) whose classes you attended.
          </li>
          <li>ALL feedback is anonymous.</li>
        </ul>
      </div>

      {options.length === 0 ? (
        <p className="text-gray-600">No enrolled courses found for feedback.</p>
      ) : (
        <>
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold mb-1">
                * Feedback type
              </label>
              <select
                className="border px-3 py-2 rounded w-full"
                value={feedbackType}
                onChange={(e) => setFeedbackType(e.target.value)}
              >
                <option value="Mid-sem">Mid-sem</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">
                * Select the course instructor
              </label>
              <select
                className="border px-3 py-2 rounded w-full"
                value={selectedKey}
                onChange={(e) => setSelectedKey(e.target.value)}
              >
                <option value="">-- Select --</option>
                {options.map((o) => (
                  <option
                    key={`${o.course_id}|${o.instructor_id}`}
                    value={`${o.course_id}|${o.instructor_id}`}
                  >
                    {o.title} ({o.course_code}) -- {o.instructor_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Questions */}
          <QuestionYesNo
            label="*1: Instructor informed the evaluation criteria within the first two weeks of the semester."
            value={answers.q1}
            onChange={(v) => setQ("q1", v)}
          />
          <QuestionYesNo
            label="*2: Number of Lectures taken by course instructor were Equal to (or More than) the total number of scheduled lectures."
            value={answers.q2}
            onChange={(v) => setQ("q2", v)}
          />

          <QuestionLikert
            label="*3: The instructor adapted professional practices such as, covering the whole syllabus, lectures taken by him not by TAs, treating students equally, keeping methods of evaluation consistent and clear etc. in the class."
            value={answers.q3}
            onChange={(v) => setQ("q3", v)}
          />
          <QuestionLikert
            label="*4: The instructor was sincere (timely returning the quizzes/ exam answer-scripts, etc)."
            value={answers.q4}
            onChange={(v) => setQ("q4", v)}
          />
          <QuestionLikert
            label="*5: The instructor had command over the subject and he/she came prepared (e.g. he/she could explain the concepts well, etc.)."
            value={answers.q5}
            onChange={(v) => setQ("q5", v)}
          />
          <QuestionLikert
            label="*6: The objectives of the course were achieved."
            value={answers.q6}
            onChange={(v) => setQ("q6", v)}
          />
          <QuestionLikert
            label="*7: Instructor was effective in delivery of lectures (Board work or Slides used for teaching was effective, clear and audible voice and English comprehension etc.)"
            value={answers.q7}
            onChange={(v) => setQ("q7", v)}
          />
          <QuestionLikert
            label="*8: Quality of questions raised in exams/assignments/classes by the instructor was adequate."
            value={answers.q8}
            onChange={(v) => setQ("q8", v)}
          />
          <QuestionLikert
            label="*9: Instructor made efforts to encourage discussion and class participation in order to enhance students’ learning experience and progress."
            value={answers.q9}
            onChange={(v) => setQ("q9", v)}
          />
          <QuestionLikert
            label="*10: Instructor could explain satisfactorily to the queries raised by the students."
            value={answers.q10}
            onChange={(v) => setQ("q10", v)}
          />

          <div className="mt-6">
            <label className="block text-sm font-semibold mb-1">
              *11: Any further suggestion or comment that you would like to share with respect to the instructor:
            </label>
            <textarea
              className="border p-3 rounded w-full min-h-[120px]"
              value={answers.q11}
              onChange={(e) => setQ("q11", e.target.value)}
              placeholder="Optional comments..."
            />
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={handleSubmit}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded"
            >
              Submit
            </button>
            <button
              onClick={() =>
                setAnswers({
                  q1: "",
                  q2: "",
                  q3: "",
                  q4: "",
                  q5: "",
                  q6: "",
                  q7: "",
                  q8: "",
                  q9: "",
                  q10: "",
                  q11: "",
                })
              }
              className="border border-red-600 text-red-600 hover:bg-red-50 px-6 py-2 rounded"
            >
              Clear
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function QuestionYesNo({ label, value, onChange }) {
  return (
    <div className="border rounded p-4 mb-4">
      <p className="font-semibold mb-2">{label}</p>
      <div className="flex gap-6 text-sm">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name={label}
            checked={value === "Yes"}
            onChange={() => onChange("Yes")}
          />
          Yes
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name={label}
            checked={value === "No"}
            onChange={() => onChange("No")}
          />
          No
        </label>
      </div>
    </div>
  );
}

function QuestionLikert({ label, value, onChange }) {
  return (
    <div className="border rounded p-4 mb-4">
      <p className="font-semibold mb-2">{label}</p>
      <div className="grid md:grid-cols-5 gap-3 text-sm">
        {LIKERT5.map((opt) => (
          <label key={opt} className="flex items-center gap-2">
            <input
              type="radio"
              name={label}
              checked={value === opt}
              onChange={() => onChange(opt)}
            />
            {opt}
          </label>
        ))}
      </div>
    </div>
  );
}

