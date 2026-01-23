import { useEffect, useState } from "react";
import api from "../../services/api";
import { Mail, Video, Calendar, CheckSquare, Square, Clock } from "lucide-react";

export default function MyStudents() {
  const user = JSON.parse(sessionStorage.getItem("user"));

  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [courses, setCourses] = useState([]);

  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [loading, setLoading] = useState(false);

  /* ============ SELECTION STATE ============ */
  const [selectedEmails, setSelectedEmails] = useState([]);

  /* ============ MODAL STATES ============ */
  const [showMail, setShowMail] = useState(false);
  const [mailData, setMailData] = useState({
    to: "",
    cc: "",
    bcc: "",
    subject: "",
    message: "",
  });

  const [showMeet, setShowMeet] = useState(false);
  
  // Time Selection State (AM/PM)
  const [meetData, setMeetData] = useState({
    date: "",
    startHour: "10",
    startMinute: "00",
    startPeriod: "AM",
    endHour: "11",
    endMinute: "00",
    endPeriod: "AM",
    topic: "",
    link: "",
    description: ""
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
    try {
      const res = await api.get("/advisor/student-details", {
        params: {
          advisor_id: user.id,
          student_id: student.user_id,
        },
      });

      setSelectedStudent(res.data.student);
      setCourses(res.data.courses || []);
    } catch {
      setCourses([]);
    }
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

  /* ================= SELECTION LOGIC ================= */

  const toggleSelectAll = () => {
    if (selectedEmails.length === filtered.length) {
      setSelectedEmails([]);
    } else {
      setSelectedEmails(filtered.map(s => s.email));
    }
  };

  const toggleStudent = (email) => {
    if (selectedEmails.includes(email)) {
      setSelectedEmails(selectedEmails.filter(e => e !== email));
    } else {
      setSelectedEmails([...selectedEmails, email]);
    }
  };

  /* ================= ACTIONS ================= */

  const sendMail = async () => {
    try {
      await api.post("/advisor/send-student-email", {
        advisor_id: user.id,
        to: mailData.to,
        cc: mailData.cc.split(",").filter(Boolean),
        bcc: mailData.bcc.split(",").filter(Boolean),
        subject: mailData.subject,
        message: mailData.message,
      });

      alert("Mail sent successfully");
      setShowMail(false);
    } catch (error) {
      alert("Failed to send mail");
    }
  };

  const scheduleMeeting = async () => {
    if (!meetData.date || !meetData.topic) {
      alert("Please fill in Date and Topic");
      return;
    }

    const startTime = `${meetData.startHour}:${meetData.startMinute} ${meetData.startPeriod}`;
    const endTime = `${meetData.endHour}:${meetData.endMinute} ${meetData.endPeriod}`;

    const targets = selectedEmails.length > 0 ? selectedEmails : [];
    
    if (targets.length === 0) {
      alert("Please select at least one student to schedule a meeting.");
      return;
    }

    try {
      await api.post("/advisor/schedule-meeting", {
        advisor_id: user.id,
        student_emails: targets,
        date: meetData.date,
        start_time: startTime,
        end_time: endTime,
        topic: meetData.topic,
        meet_link: meetData.link || "https://meet.google.com/new",
        description: meetData.description
      });

      alert("Meeting scheduled! Invites sent.");
      setShowMeet(false);
      setSelectedEmails([]); 
    } catch (error) {
      console.error(error);
      alert("Failed to schedule meeting.");
    }
  };

  /* ================= UI ================= */

  return (
    <div className="max-w-6xl">

      {/* ================= LIST VIEW ================= */}
      {!selectedStudent && (
        <>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">My Students</h2>
            
            {/* ORGANIZE MEET BUTTON */}
            <button
              onClick={() => {
                if(selectedEmails.length === 0) {
                    alert("Select students from the list first!");
                    return;
                }
                setShowMeet(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 text-sm hover:bg-blue-700 transition"
            >
              <Video size={16} />
              Organize a Meet ({selectedEmails.length})
            </button>
          </div>

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

          {loading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : (
            <div className="bg-white border rounded overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    {/* SELECT ALL CHECKBOX */}
                    <th className="px-4 py-3 w-10">
                        <button onClick={toggleSelectAll} className="text-gray-600 hover:text-black">
                            {filtered.length > 0 && selectedEmails.length === filtered.length ? (
                                <CheckSquare size={18} className="text-blue-600"/>
                            ) : (
                                <Square size={18}/>
                            )}
                        </button>
                    </th>
                    <th className="px-4 py-3 text-left">Student</th>
                    <th className="px-4 py-3">Entry No</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Email</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => {
                    const isSelected = selectedEmails.includes(s.email);
                    return (
                        <tr key={s.user_id} className={`border-t ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                        {/* INDIVIDUAL CHECKBOX */}
                        <td className="px-4 py-3 text-center">
                            <button onClick={() => toggleStudent(s.email)} className="text-gray-500 hover:text-blue-600">
                                {isSelected ? <CheckSquare size={18} className="text-blue-600"/> : <Square size={18}/>}
                            </button>
                        </td>
                        <td className="px-4 py-3 font-medium">{s.full_name}</td>
                        <td className="px-4 py-3">{s.entry_no || "—"}</td>
                        <td className="px-4 py-3">{s.department}</td>
                        <td className="px-4 py-3 text-xs">{s.email}</td>

                        <td className="px-4 py-3 text-right flex gap-2 justify-end">
                            {/* MAIL */}
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

                            {/* VIEW DETAILS */}
                            <button
                            onClick={() => fetchStudentDetails(s)}
                            className="border px-3 py-1 text-xs rounded hover:bg-gray-100"
                            >
                            View Details
                            </button>
                        </td>
                        </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ================= STUDENT DETAIL VIEW ================= */}
      {selectedStudent && (
        <>
          <button
            onClick={() => {
              setSelectedStudent(null);
              setCourses([]);
            }}
            className="text-blue-600 text-sm mb-4"
          >
            ← Back to Students
          </button>

          <div className="bg-white border p-8 mb-6">
            <h1 className="text-center text-2xl font-bold mb-1">
              INDIAN INSTITUTE OF TECHNOLOGY ROPAR
            </h1>
            <p className="text-center text-gray-600 mb-8">
              Student Information Record
            </p>

            <h3 className="font-bold mb-2">STUDENT DETAILS</h3>

            <table className="w-full text-sm border">
              <tbody>
                <Row label="Full Name" value={selectedStudent.full_name} />
                <Row label="Email Address" value={selectedStudent.email} />
                <Row label="Department" value={selectedStudent.department} />
                <Row label="Entry Number" value={selectedStudent.entry_no || "—"} />
                <Row label="Role" value="Student" />
              </tbody>
            </table>
          </div>

          <div className="bg-white border p-6">
            <h3 className="font-bold mb-4">ACADEMIC INFORMATION</h3>

            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 py-2 text-left">Course Code</th>
                  <th className="px-3 py-2 text-left">Title</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Grade</th>
                </tr>
              </thead>
              <tbody>
                {courses.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-4 text-gray-500">
                      No courses found
                    </td>
                  </tr>
                ) : (
                  courses.map((c, i) => (
                    <tr key={i} className="border-t">
                      <td className="px-3 py-2">{c.course.course_code}</td>
                      <td className="px-3 py-2">{c.course.title}</td>
                      <td className="px-3 py-2">
                        <Status status={c.status} />
                      </td>
                      <td className="px-3 py-2">{c.grade || "—"}</td>
                    </tr>
                  ))
                )}
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

      {/* ================= MEET SCHEDULER MODAL (UPDATED) ================= */}
      {showMeet && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-lg p-6 shadow-xl">
            <div className="flex items-center gap-2 mb-4 text-blue-700">
                <Video size={24} />
                <h3 className="font-bold text-lg">Organize a Google Meet</h3>
            </div>
            
            <p className="text-xs text-gray-500 mb-4">
                Scheduling for <span className="font-bold">{selectedEmails.length}</span> student(s).
                A Calendar Invite will be sent to everyone.
            </p>

            <Input type="date" label="Date" value={meetData.date} onChange={(v) => setMeetData({...meetData, date: v})} />

            {/* TIME SELECTORS WITH AM/PM */}
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label className="text-xs text-gray-500 font-semibold mb-1 block">Start Time</label>
                    <div className="flex gap-1">
                        <select className="border rounded p-2 text-sm" value={meetData.startHour} onChange={(e) => setMeetData({...meetData, startHour: e.target.value})}>
                            {[...Array(12)].map((_, i) => <option key={i} value={String(i+1).padStart(2,'0')}>{String(i+1).padStart(2,'0')}</option>)}
                        </select>
                        <span className="self-center">:</span>
                        <select className="border rounded p-2 text-sm" value={meetData.startMinute} onChange={(e) => setMeetData({...meetData, startMinute: e.target.value})}>
                            <option value="00">00</option>
                            <option value="15">15</option>
                            <option value="30">30</option>
                            <option value="45">45</option>
                        </select>
                        <select className="border rounded p-2 text-sm" value={meetData.startPeriod} onChange={(e) => setMeetData({...meetData, startPeriod: e.target.value})}>
                            <option value="AM">AM</option>
                            <option value="PM">PM</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="text-xs text-gray-500 font-semibold mb-1 block">End Time</label>
                    <div className="flex gap-1">
                        <select className="border rounded p-2 text-sm" value={meetData.endHour} onChange={(e) => setMeetData({...meetData, endHour: e.target.value})}>
                            {[...Array(12)].map((_, i) => <option key={i} value={String(i+1).padStart(2,'0')}>{String(i+1).padStart(2,'0')}</option>)}
                        </select>
                        <span className="self-center">:</span>
                        <select className="border rounded p-2 text-sm" value={meetData.endMinute} onChange={(e) => setMeetData({...meetData, endMinute: e.target.value})}>
                            <option value="00">00</option>
                            <option value="15">15</option>
                            <option value="30">30</option>
                            <option value="45">45</option>
                        </select>
                        <select className="border rounded p-2 text-sm" value={meetData.endPeriod} onChange={(e) => setMeetData({...meetData, endPeriod: e.target.value})}>
                            <option value="AM">AM</option>
                            <option value="PM">PM</option>
                        </select>
                    </div>
                </div>
            </div>

            <Input 
                label="Topic" 
                value={meetData.topic} 
                onChange={(v) => setMeetData({...meetData, topic: v})} 
                placeholder="e.g., Weekly Project Update"
            />

            <Input 
                label="Google Meet Link (Optional)" 
                value={meetData.link} 
                onChange={(v) => setMeetData({...meetData, link: v})} 
                placeholder="e.g. meet.google.com/abc-defg-hij"
            />
            <p className="text-[10px] text-gray-400 -mt-2 mb-3">Leave empty to suggest generating one, or paste your Personal Room link.</p>

            <textarea
              rows={3}
              placeholder="Description / Agenda"
              className="border rounded w-full px-3 py-2 text-sm mb-4"
              value={meetData.description}
              onChange={(e) => setMeetData({ ...meetData, description: e.target.value })}
            />

            <div className="flex justify-end gap-3 border-t pt-4">
              <button onClick={() => setShowMeet(false)} className="border px-4 py-2 rounded hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={scheduleMeeting} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2">
                <Calendar size={14} />
                Schedule & Send
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

/* ================= HELPERS ================= */

function Row({ label, value }) {
  return (
    <tr className="border-t">
      <td className="bg-gray-50 px-4 py-2 font-medium w-1/3">{label}</td>
      <td className="px-4 py-2">{value}</td>
    </tr>
  );
}

function Status({ status }) {
  let cls = "px-2 py-1 text-xs rounded font-medium ";
  if (status === "ENROLLED") cls += "bg-green-100 text-green-700";
  else if (status?.includes("PENDING")) cls += "bg-yellow-100 text-yellow-700";
  else if (status?.includes("REJECTED") || status?.includes("DROPPED"))
    cls += "bg-red-100 text-red-700";
  else cls += "bg-gray-100 text-gray-700";

  return <span className={cls}>{status.replace(/_/g, " ")}</span>;
}

function Input({ label, value, onChange, disabled, type = "text", placeholder }) {
  return (
    <div className="mb-3">
      <label className="text-xs text-gray-500 font-semibold">{label}</label>
      <input
        type={type}
        className="border rounded w-full px-3 py-2 text-sm focus:outline-blue-500"
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => onChange?.(e.target.value)}
      />
    </div>
  );
}