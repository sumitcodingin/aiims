/* file: frontend/src/pages/instructor/FloatCourse.jsx */
import { useState, useEffect, useRef } from "react";
import api from "../../services/api";

const DEPARTMENTS = [
  "Computer Science",
  "Math",
  "HSS",
  "Electrical",
  "Civil",
  "Artificial Intelligence",
];

const SLOTS = [
  "PC-1", "PC-2", "PC-3", "PC-4", "HSPE",
  "HSME", "PCE-1", "PCE-2", "PCE-3", "PCE-4"
];

export default function FloatCourse({ onSuccess }) {
  const [user, setUser] = useState(null);
  const [allInstructors, setAllInstructors] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); 
  const dropdownRef = useRef(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    fetchInstructors();

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchInstructors = async () => {
    try {
      const res = await api.get("/users", { params: { role: "Instructor", account_status: "ACTIVE" } });
      const instructors = res.data || [];
      setAllInstructors(instructors);
    } catch (err) {
      console.error("Failed to fetch instructors:", err);
      setAllInstructors([]);
    }
  };

  const [form, setForm] = useState({
    course_code: "",
    title: "",
    department: "",
    acad_session: "2025-II",
    credits: "",
    capacity: "",
    slot: "",
    coordinator_id: "",
    co_instructors: [],
  });

  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Helper: Get the full teaching team to populate the Coordinator dropdown
  const getTeachingTeam = () => {
    if (!user) return [];
    const currentUserId = user.user_id || user.id;
    
    // 1. Find authoritative name from the DB list (fallback to local storage)
    const currentUserFromDb = allInstructors.find(i => i.user_id === currentUserId);
    const myName = currentUserFromDb?.full_name || user.full_name || user.email;

    // 2. Always include the Creator (You)
    const team = [{ 
      user_id: currentUserId, 
      full_name: myName, // Now shows actual name
      email: user.email 
    }];

    // 3. Add selected co-instructors
    if (form.co_instructors.length > 0) {
      const selected = allInstructors.filter(ins => form.co_instructors.includes(ins.user_id));
      team.push(...selected);
    }
    
    return team;
  };

  /* ================= HANDLERS ================= */

  const toggleCoInstructor = (instructorId) => {
    const id = Number(instructorId);
    setForm(prev => {
      const isSelected = prev.co_instructors.includes(id);
      let newCoInstructors;

      if (isSelected) {
        newCoInstructors = prev.co_instructors.filter(i => i !== id);
        var newCoordinator = Number(prev.coordinator_id) === id ? "" : prev.coordinator_id;
        return { ...prev, co_instructors: newCoInstructors, coordinator_id: newCoordinator };
      } else {
        newCoInstructors = [...prev.co_instructors, id];
        return { ...prev, co_instructors: newCoInstructors };
      }
    });
  };

  const submit = () => {
    if (!user) {
      alert("You must be logged in to float a course.");
      return;
    }

    if (
      !form.course_code ||
      !form.title ||
      !form.department ||
      !form.credits ||
      !form.capacity ||
      !form.slot ||
      !form.coordinator_id
    ) {
      alert("Please fill all required fields, including designating a course coordinator.");
      return;
    }

    setShowConfirm(true);
  };

  const confirmSubmit = async () => {
    try {
      setLoading(true);
      const instructorId = user.user_id || user.id;

      const allTeachingInstructors = new Set();
      allTeachingInstructors.add(Number(instructorId)); 
      allTeachingInstructors.add(Number(form.coordinator_id)); 
      form.co_instructors.forEach(id => allTeachingInstructors.add(Number(id)));

      await api.post("/instructor/float-course", {
        course_code: form.course_code,
        title: form.title,
        department: form.department,
        acad_session: form.acad_session,
        slot: form.slot,
        instructor_id: instructorId,
        coordinator_id: form.coordinator_id,
        co_instructors: Array.from(allTeachingInstructors),
        credits: Number(form.credits),
        capacity: Number(form.capacity),
      });

      setShowConfirm(false);
      alert("Course floated successfully. Awaiting Admin approval.");
      if (onSuccess) onSuccess();
      
      setForm({
        course_code: "", title: "", department: "", acad_session: "2025-II",
        credits: "", capacity: "", slot: "", coordinator_id: "", co_instructors: [],
      });

    } catch (err) {
      console.error("Float Course Error:", err);
      alert(err.response?.data?.error || "Failed to float course");
    } finally {
      setLoading(false);
    }
  };

  const availableInstructors = allInstructors.filter(
    i => i.user_id !== (user?.user_id || user?.id)
  );

  return (
    <>
      <div className="max-w-5xl mx-auto bg-white border border-gray-400 p-8 shadow-sm">
        <h2 className="text-xl font-bold mb-8">Float New Course</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Course Code"
            value={form.course_code}
            onChange={(v) => setForm({ ...form, course_code: v })}
            placeholder="CS301"
          />

          <Input
            label="Course Title"
            value={form.title}
            onChange={(v) => setForm({ ...form, title: v })}
            placeholder="Operating Systems"
          />

          <Select
            label="Department"
            value={form.department}
            onChange={(v) => setForm({ ...form, department: v })}
            options={DEPARTMENTS}
          />

          <Select
            label="Academic Session"
            value={form.acad_session}
            options={["2025-II"]}
            disabled
          />

          <Select
            label="Course Slot"
            value={form.slot}
            onChange={(v) => setForm({ ...form, slot: v })}
            options={SLOTS}
          />

          <Input
            label="Credits"
            type="number"
            value={form.credits}
            onChange={(v) => setForm({ ...form, credits: v })}
            placeholder="3"
          />

          <Input
            label="Capacity"
            type="number"
            value={form.capacity}
            onChange={(v) => setForm({ ...form, capacity: v })}
            placeholder="60"
          />

          {/* 1. CUSTOM DROPDOWN WITH TICKS (Co-Instructors) */}
          <div className="md:col-span-2 border-t border-gray-200 pt-4 mt-2">
            <h3 className="font-bold text-sm mb-4 text-gray-800">Teaching Team</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative" ref={dropdownRef}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Co-Instructors (Optional)
                </label>
                
                {/* Custom Dropdown Trigger */}
                <div 
                  className="w-full border border-gray-400 px-3 py-2 text-sm bg-white cursor-pointer flex justify-between items-center"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  <span className={form.co_instructors.length ? "text-black" : "text-gray-500"}>
                    {form.co_instructors.length > 0 
                      ? `${form.co_instructors.length} selected` 
                      : "Click to select instructors..."}
                  </span>
                  <span className="text-xs">▼</span>
                </div>

                {/* Dropdown Content (Checkboxes) */}
                {isDropdownOpen && (
                  <div className="absolute z-10 w-full bg-white border border-gray-400 mt-1 max-h-60 overflow-y-auto shadow-lg">
                    {availableInstructors.length === 0 ? (
                      <div className="p-3 text-xs text-gray-500">No other instructors found.</div>
                    ) : (
                      availableInstructors.map(inst => (
                        <label 
                          key={inst.user_id} 
                          className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-0"
                        >
                          <input 
                            type="checkbox"
                            checked={form.co_instructors.includes(inst.user_id)}
                            onChange={() => toggleCoInstructor(inst.user_id)}
                            className="w-4 h-4 accent-black"
                          />
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{inst.full_name}</span>
                            <span className="text-xs text-gray-500">{inst.email}</span>
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                )}
                
                {/* Selected Tags Display */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {form.co_instructors.map(id => {
                    const inst = allInstructors.find(i => i.user_id === id);
                    return (
                      <span key={id} className="inline-flex items-center px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs">
                        {inst?.full_name}
                        <button
                          onClick={() => toggleCoInstructor(id)}
                          className="ml-2 text-gray-500 hover:text-red-600 font-bold"
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* 2. COORDINATOR SELECTION */}
              <div>
                <Select
                  label="Course Coordinator (Required)"
                  value={form.coordinator_id}
                  onChange={(v) => setForm({ ...form, coordinator_id: v })}
                  options={getTeachingTeam().map(i => ({ 
                    value: i.user_id, 
                    label: i.full_name 
                  }))}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Only the Coordinator can award grades and approve student enrollments.
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* ACTION BAR */}
        <div className="mt-10 flex justify-end">
          <button
            onClick={submit}
            className="bg-neutral-800 hover:bg-neutral-700 text-white px-8 py-2 rounded text-sm font-medium transition-colors"
          >
            Float Course
          </button>
        </div>
      </div>

      {/* ================= CONFIRM MODAL ================= */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white border border-gray-400 w-full max-w-lg p-6 shadow-2xl">
            <h3 className="text-lg font-bold mb-4">Confirm Course Details</h3>

            <table className="w-full text-sm border border-gray-300 mb-6">
              <tbody>
                <ConfirmRow label="Course Code" value={form.course_code} />
                <ConfirmRow label="Title" value={form.title} />
                <ConfirmRow label="Department" value={form.department} />
                <ConfirmRow label="Slot" value={form.slot} />
                <ConfirmRow label="Credits" value={form.credits} />
                <ConfirmRow label="Capacity" value={form.capacity} />
                <ConfirmRow 
                  label="Teaching Team" 
                  value={getTeachingTeam().map(i => i.full_name).join(", ")}
                />
                <ConfirmRow 
                  label="COORDINATOR" 
                  value={
                    getTeachingTeam().find(i => String(i.user_id) === String(form.coordinator_id))?.full_name 
                    || "Not Selected"
                  } 
                />
              </tbody>
            </table>

            <div className="flex justify-end gap-3">
              <button onClick={() => setShowConfirm(false)} className="px-4 py-2 border border-gray-400 text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={confirmSubmit} disabled={loading} className="bg-neutral-800 hover:bg-neutral-700 text-white px-6 py-2 text-sm font-medium">
                {loading ? "Submitting..." : "Confirm & Float"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ================= REUSABLE INPUTS ================= */

function Input({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-gray-400 px-3 py-2 text-sm focus:border-black outline-none transition-colors"
      />
    </div>
  );
}

function Select({ label, value, onChange = () => {}, options, disabled }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <select
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className="w-full border border-gray-400 px-3 py-2 text-sm bg-white appearance-none focus:border-black outline-none"
        >
          <option value="">Select</option>
          {options.map((o) => {
            const optValue = typeof o === 'string' ? o : o.value;
            const optLabel = typeof o === 'string' ? o : o.label;
            return <option key={optValue} value={optValue}>{optLabel}</option>;
          })}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
        </div>
      </div>
    </div>
  );
}

function ConfirmRow({ label, value }) {
  return (
    <tr className="border-b border-gray-300 last:border-b-0">
      <td className="px-3 py-2 bg-gray-100 font-medium w-1/2">{label}</td>
      <td className="px-3 py-2">{value}</td>
    </tr>
  );
}