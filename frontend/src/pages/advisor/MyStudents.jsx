import { useEffect, useState } from "react";
import api from "../../services/api";
import { Mail } from "lucide-react"; // icon

export default function MyStudents() {
  const user = JSON.parse(sessionStorage.getItem("user"));

  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [courses, setCourses] = useState([]);

  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [loading, setLoading] = useState(false);

  /* ============ MAIL MODAL STATE ============ */
  const [showMail, setShowMail] = useState(false);
  const [mailData, setMailData] = useState({
    to: "",
    cc: "",
    bcc: "",
    subject: "",
    message: "",
  });

  /* ================= FETCH STUDENTS ================= */

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await api.get("/advisor/all-students", {
        params: { advisor_id: user.id },
      });
      setStudents(res.data || []);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentDetails = async (student) => {
    const res = await api.get("/advisor/student-details", {
      params: {
        advisor_id: user.id,
        student_id: student.user_id,
      },
    });

    setSelectedStudent(res.data.student);
    setCourses(res.data.courses || []);
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  /* ================= FILTER ================= */

  const filtered = students.filter((s) => {
    const q = search.toLowerCase();
    return (
      (!search ||
        s.full_name.toLowerCase().includes(q) ||
        s.entry_no?.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q)) &&
      (!department || s.department === department)
    );
  });

  const departments = [
    ...new Set(students.map((s) => s.department).filter(Boolean)),
  ];

  /* ================= SEND MAIL ================= */

  const sendMail = async () => {
    await api.post("/advisor/send-student-email", {
      advisor_id: user.id, // ✅ REQUIRED
      to: mailData.to,
      cc: mailData.cc.split(",").filter(Boolean),
      bcc: mailData.bcc.split(",").filter(Boolean),
      subject: mailData.subject,
      message: mailData.message,
    });

    alert("Mail sent successfully");
    setShowMail(false);
  };

  /* ================= UI ================= */

  return (
    <div className="max-w-6xl">

      {/* ================= LIST ================= */}
      {!selectedStudent && (
        <>
          <h2 className="text-2xl font-bold mb-4">My Students</h2>

          <div className="grid md:grid-cols-3 gap-3 mb-4">
            <input
              placeholder="Search name / entry no / email"
              className="border rounded px-4 py-2 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select
              className="border rounded px-4 py-2 text-sm"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </div>

          <div className="bg-white border rounded overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left">Student</th>
                  <th className="px-4 py-3">Entry No</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Email</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.user_id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{s.full_name}</td>
                    <td className="px-4 py-3">{s.entry_no || "—"}</td>
                    <td className="px-4 py-3">{s.department}</td>
                    <td className="px-4 py-3 text-xs">{s.email}</td>

                    <td className="px-4 py-3 text-right flex gap-2 justify-end">
                      {/* MAIL ICON */}
                      <button
                        onClick={() => {
                          setMailData({
                            to: s.email,
                            cc: "",
                            bcc: "",
                            subject: "",
                            message: "",
                          });
                          setShowMail(true);
                        }}
                        className="border p-2 rounded hover:bg-gray-100"
                        title="Send Mail"
                      >
                        <Mail size={14} />
                      </button>

                      <button
                        onClick={() => fetchStudentDetails(s)}
                        className="border px-3 py-1 text-xs rounded hover:bg-gray-100"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ================= MAIL MODAL ================= */}
      {showMail && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-lg p-6">
            <h3 className="font-bold text-lg mb-4">Send Email</h3>

            <Input label="To" value={mailData.to} disabled />
            <Input label="CC" value={mailData.cc} onChange={(v) => setMailData({ ...mailData, cc: v })} />
            <Input label="BCC" value={mailData.bcc} onChange={(v) => setMailData({ ...mailData, bcc: v })} />
            <Input label="Subject" value={mailData.subject} onChange={(v) => setMailData({ ...mailData, subject: v })} />

            <textarea
              rows={4}
              placeholder="Message"
              className="border rounded w-full px-3 py-2 text-sm mb-4"
              value={mailData.message}
              onChange={(e) => setMailData({ ...mailData, message: e.target.value })}
            />

            <div className="flex justify-end gap-3">
              <button onClick={() => setShowMail(false)} className="border px-4 py-2 rounded">
                Cancel
              </button>
              <button onClick={sendMail} className="bg-neutral-900 text-white px-4 py-2 rounded">
                Send
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

/* ================= INPUT ================= */

function Input({ label, value, onChange, disabled }) {
  return (
    <div className="mb-3">
      <label className="text-xs text-gray-500">{label}</label>
      <input
        className="border rounded w-full px-3 py-2 text-sm"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.value)}
      />
    </div>
  );
}
