/* file: frontend/src/pages/student/StudentPrograms.jsx */
import { useEffect, useState } from "react";
import api from "../../services/api";

const PROGRAM_TYPES = [
    "General B.Tech",
    "B.Tech with Concentration",
    "B.Tech with Minor",
    "B.Tech with Additional Internship"
];

export default function StudentPrograms() {
    const [myPrograms, setMyPrograms] = useState([]);
    const [loading, setLoading] = useState(false);
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
        // Check frontend side if any active program exists
        const hasActive = myPrograms.some(p => p.status === 'PENDING' || p.status === 'APPROVED');
        if (hasActive) {
            alert("You already have an active program application. Please drop it first.");
            return;
        }

        if (!window.confirm(`Apply for ${program_type}?`)) return;
        setLoading(true);
        try {
            await api.post("/student/apply-program", {
                student_id: user.id,
                program_type
            });
            alert("Application Submitted!");
            fetchPrograms();
        } catch (err) {
            alert(err.response?.data?.error || "Failed to apply.");
        } finally {
            setLoading(false);
        }
    };

    // New Function to Drop a program application
    const dropProgram = async (programId) => {
        if (!window.confirm("Are you sure you want to drop this application?")) return;
        try {
            // Reusing update status endpoint to set it to 'REJECTED' effectively dropping it
            await api.post("/admin/update-program-status", { programId, action: "REJECT" }); 
            alert("Application Dropped.");
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
        <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Degree Programs</h2>
            
            <div className="grid md:grid-cols-2 gap-6 mb-10">
                {PROGRAM_TYPES.map((type) => {
                    const existing = myPrograms.find(p => p.program_type === type && (p.status === 'PENDING' || p.status === 'APPROVED'));
                    
                    // Disable apply buttons if ANY active program exists
                    const hasActive = myPrograms.some(p => p.status === 'PENDING' || p.status === 'APPROVED');

                    return (
                        <div key={type} className="bg-white p-6 shadow-sm border border-gray-200 rounded-none hover:shadow-md transition">
                            <h3 className="font-bold text-lg mb-2">{type}</h3>
                            <p className="text-sm text-gray-600 mb-4">
                                {type === 'General B.Tech' ? 'Default degree program.' : 'Specialized track requiring admin approval.'}
                            </p>
                            
                            {existing ? (
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
                            ) : (
                                <button 
                                    onClick={() => apply(type)}
                                    disabled={loading || hasActive}
                                    className={`px-4 py-2 text-sm font-medium transition ${
                                        hasActive 
                                        ? "bg-gray-300 text-gray-500 cursor-not-allowed" 
                                        : "bg-neutral-800 text-white hover:bg-neutral-700"
                                    }`}
                                >
                                    {hasActive ? "Unavailable" : "Apply Now"}
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
                            <th className="p-3">Program Type</th>
                            <th className="p-3">Applied Date</th>
                            <th className="p-3">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {myPrograms.length === 0 ? (
                            <tr><td colSpan="3" className="p-4 text-center text-gray-500">No applications yet.</td></tr>
                        ) : (
                            myPrograms.map(p => (
                                <tr key={p.program_id} className="border-b last:border-0 hover:bg-gray-50">
                                    <td className="p-3 font-medium">{p.program_type}</td>
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