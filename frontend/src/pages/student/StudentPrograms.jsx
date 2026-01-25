/* file: frontend/src/pages/student/StudentPrograms.jsx */
import { useEffect, useState } from "react";
import api from "../../services/api";

const PROGRAM_TYPES = [
    "General B.Tech",
    "B.Tech with Concentration",
    "B.Tech with Minor",
    "B.Tech with Additional Internship"
];

const DEPARTMENTS = [
    "Computer Science", "Electrical", "Mechanical", "Civil", "Chemical", "Artificial Intelligence"
];

export default function StudentPrograms() {
    const [myPrograms, setMyPrograms] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Inputs for Minor and Internship
    const [selectedBranch, setSelectedBranch] = useState("");
    const [selectedSemester, setSelectedSemester] = useState("8th");

    const user = JSON.parse(localStorage.getItem("user"));

    useEffect(() => {
        fetchPrograms();
    }, []);

    const fetchPrograms = async () => {
        try {
            const res = await api.get("/student/my-programs", { params: { student_id: user.id } });
            setMyPrograms(res.data || []);
        } catch (err) {
            console.error("Failed to fetch programs", err);
        }
    };

    const apply = async (program_type) => {
        // Validation for inputs
        if (program_type === "B.Tech with Minor" && !selectedBranch) {
            alert("Please select a branch for your Minor.");
            return;
        }
        if (program_type === "B.Tech with Additional Internship" && !selectedSemester) {
            alert("Please select a semester for your Internship.");
            return;
        }

        if (!window.confirm(`Apply for ${program_type}?`)) return;
        setLoading(true);
        try {
            await api.post("/student/apply-program", {
                student_id: user.id,
                program_type,
                target_branch: program_type === "B.Tech with Minor" ? selectedBranch : null,
                semester: program_type === "B.Tech with Additional Internship" ? selectedSemester : null
            });
            alert("Application Submitted!");
            fetchPrograms();
            // Reset selections
            setSelectedBranch("");
            setSelectedSemester("8th");
        } catch (err) {
            alert(err.response?.data?.error || "Failed to apply.");
        } finally {
            setLoading(false);
        }
    };

    // Restore "General B.Tech" if user drops special program
    const dropProgram = async (programId) => {
        if (!window.confirm("Are you sure you want to drop this application? You will revert to General B.Tech.")) return;
        try {
            await api.post("/admin/update-program-status", { programId, action: "REJECT" }); 
            alert("Application Dropped. Reverted to General B.Tech.");
            
            // Optionally manually add General B.Tech entry back if needed, 
            // but usually having NO entry implies General or we can rely on backend logic.
            // For UI consistency, we just re-fetch.
            fetchPrograms();
        } catch (err) {
            alert("Failed to drop application.");
        }
    };

    const getStatusStyle = (status) => {
        if (status === 'APPROVED') return "bg-green-100 text-green-800 border-green-200";
        if (status === 'REJECTED') return "bg-red-100 text-red-800 border-red-200";
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
    };

    return (
        <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Degree Programs</h2>
            
            <div className="grid md:grid-cols-2 gap-6 mb-10">
                {PROGRAM_TYPES.map((type) => {
                    const existing = myPrograms.find(p => p.program_type === type && (p.status === 'PENDING' || p.status === 'APPROVED'));
                    
                    // Check if user has ANY special program (not General)
                    const hasSpecialProgram = myPrograms.some(p => 
                        p.program_type !== 'General B.Tech' && (p.status === 'PENDING' || p.status === 'APPROVED')
                    );

                    // Logic for General B.Tech
                    if (type === 'General B.Tech') {
                        const isDefault = !hasSpecialProgram;
                        return (
                            <div key={type} className={`p-6 shadow-sm border rounded-none transition ${isDefault ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200 opacity-60'}`}>
                                <h3 className="font-bold text-lg mb-2">{type}</h3>
                                <p className="text-sm text-gray-600 mb-4">Default degree program.</p>
                                {isDefault ? (
                                    <div className="inline-block px-3 py-1 text-xs font-bold border rounded-none bg-green-100 text-green-800 border-green-200">
                                        Status: ACTIVE
                                    </div>
                                ) : (
                                    <span className="text-xs text-gray-500 font-medium">Inactive (Special program selected)</span>
                                )}
                            </div>
                        );
                    }

                    // Logic for Other Programs
                    return (
                        <div key={type} className="bg-white p-6 shadow-sm border border-gray-200 rounded-none hover:shadow-md transition">
                            <h3 className="font-bold text-lg mb-2">{type}</h3>
                            <p className="text-sm text-gray-600 mb-4">
                                Specialized track requiring approval.
                            </p>

                            {/* Dropdowns for inputs */}
                            {!existing && !hasSpecialProgram && type === 'B.Tech with Minor' && (
                                <div className="mb-4">
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Select Branch</label>
                                    <select 
                                        className="w-full border p-2 text-sm rounded-none"
                                        value={selectedBranch}
                                        onChange={(e) => setSelectedBranch(e.target.value)}
                                    >
                                        <option value="">-- Select Branch --</option>
                                        {DEPARTMENTS.map(d => (
                                            <option key={d} value={d}>{d}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {!existing && !hasSpecialProgram && type === 'B.Tech with Additional Internship' && (
                                <div className="mb-4">
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Select Semester</label>
                                    <select 
                                        className="w-full border p-2 text-sm rounded-none"
                                        value={selectedSemester}
                                        onChange={(e) => setSelectedSemester(e.target.value)}
                                    >
                                        <option value="7th">7th Semester</option>
                                        <option value="8th">8th Semester</option>
                                    </select>
                                </div>
                            )}
                            
                            {existing ? (
                                <div className="flex flex-col gap-2">
                                    <div className="flex justify-between items-center">
                                        <div className={`inline-block px-3 py-1 text-xs font-bold border rounded-none ${getStatusStyle(existing.status)}`}>
                                            Status: {existing.status}
                                        </div>
                                        {existing.status === 'PENDING' && (
                                            <button 
                                                onClick={() => dropProgram(existing.program_id)}
                                                className="text-red-600 text-xs font-bold underline hover:text-red-800"
                                            >
                                                Drop
                                            </button>
                                        )}
                                    </div>
                                    {/* Show details if any */}
                                    {existing.target_branch && <p className="text-xs text-gray-600">Branch: <b>{existing.target_branch}</b></p>}
                                    {existing.semester && <p className="text-xs text-gray-600">Sem: <b>{existing.semester}</b></p>}
                                </div>
                            ) : (
                                <button 
                                    onClick={() => apply(type)}
                                    disabled={loading || hasSpecialProgram}
                                    className={`px-4 py-2 text-sm font-medium transition w-full ${
                                        hasSpecialProgram 
                                        ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200" 
                                        : "bg-neutral-800 text-white hover:bg-neutral-700"
                                    }`}
                                >
                                    {hasSpecialProgram ? "Unavailable (Already Applied)" : "Apply Now"}
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>

            <h3 className="text-xl font-bold mb-4 border-b pb-2">My Applications History</h3>
            <div className="bg-white border rounded-none overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-3">Program</th>
                            <th className="p-3">Details</th>
                            <th className="p-3">Applied Date</th>
                            <th className="p-3">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {myPrograms.length === 0 ? (
                            <tr><td colSpan="4" className="p-4 text-center text-gray-500">No applications yet.</td></tr>
                        ) : (
                            myPrograms.map(p => (
                                <tr key={p.program_id} className="border-b last:border-0 hover:bg-gray-50">
                                    <td className="p-3 font-medium">{p.program_type}</td>
                                    <td className="p-3 text-gray-600">
                                        {p.target_branch ? `Branch: ${p.target_branch}` : ""}
                                        {p.semester ? `Sem: ${p.semester}` : ""}
                                        {!p.target_branch && !p.semester ? "—" : ""}
                                    </td>
                                    <td className="p-3 text-gray-600">{new Date(p.applied_at).toLocaleDateString()}</td>
                                    <td className="p-3">
                                        <span className={`px-2 py-1 text-xs font-bold rounded-none border ${getStatusStyle(p.status)}`}>
                                            {p.status}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}