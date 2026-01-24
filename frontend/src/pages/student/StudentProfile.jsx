import { useEffect, useState } from "react";
import api from "../../services/api";
import collegeLogo from "../../assets/images/iit_ropar_logo.jpg";

export default function StudentProfile() {
  const [profile, setProfile] = useState(null);
  
  // CHANGED: sessionStorage -> localStorage
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    if (user && user.id) {
      api
        .get("/student/profile", {
          params: { student_id: user.id },
        })
        .then((res) => setProfile(res.data))
        .catch(() => setProfile(null));
    }
  }, [user?.id]);

  if (!profile) {
    return <p className="text-gray-600">Loading profile...</p>;
  }

  return (
    <div className="max-w-6xl mx-auto bg-white p-10 border border-gray-400">
      {/* ================= HEADER ================= */}
      <div className="mb-14 text-center">
        {/* LOGO */}
        <img
          src={collegeLogo}
          alt="IIT Ropar Logo"
          className="mx-auto mb-4 h-20 w-auto object-contain"
        />

        {/* INSTITUTE NAME */}
        <h1 className="text-2xl font-bold uppercase tracking-wide">
          Indian Institute of Technology Ropar
        </h1>

        {/* SUBTITLE */}
        <p className="mt-2 text-base text-gray-700">
          Student Information Record
        </p>
      </div>

      {/* ================= STUDENT DETAILS ================= */}
      <Section title="Student Details">
        <Table>
          <Row label="Full Name" value={profile.full_name} />
          <Row label="Email Address" value={profile.email} />
          <Row label="Department" value={profile.department || "—"} />
          <Row label="Role" value="Student" />
          <Row
            label="Account Created On"
            value={
              profile.created_at
                ? new Date(profile.created_at).toLocaleDateString()
                : "—"
            }
          />
        </Table>
      </Section>

      {/* ================= ACADEMIC INFORMATION ================= */}
      <Section title="Academic Information">
        <Table>
          <Row
            label="Batch"
            value={profile.student_profile?.batch || "—"}
          />
          <Row
            label="Entry Number"
            value={profile.student_profile?.entry_no || "—"}
          />
          <Row
            label="Program"
            value={profile.student_profile?.program || "—"}
          />
        </Table>
      </Section>

      {/* ================= ADVISOR DETAILS ================= */}
      <Section title="Faculty Advisor Details">
        <Table>
          <Row
            label="Advisor Name"
            value={profile.advisor?.full_name || "Not Assigned"}
          />
          <Row
            label="Advisor Email"
            value={profile.advisor?.email || "—"}
          />
        </Table>
      </Section>

      {/* ================= FOOTER ================= */}
      <div className="mt-16 text-xs text-gray-600 text-center">
        This is a system-generated record from the Academic Management Portal.
      </div>
    </div>
  );
}

/* ================= REUSABLE HELPERS ================= */

function Section({ title, children }) {
  return (
    <div className="mb-12">
      <h2 className="text-sm font-bold uppercase border-b border-gray-500 pb-2 mb-5">
        {title}
      </h2>
      {children}
    </div>
  );
}

function Table({ children }) {
  return (
    <table className="w-full border border-gray-400 text-sm">
      <tbody>{children}</tbody>
    </table>
  );
}

function Row({ label, value }) {
  return (
    <tr className="border-b border-gray-300 last:border-b-0">
      <td className="w-1/3 px-4 py-4 font-medium bg-gray-100">
        {label}
      </td>
      <td className="px-4 py-4">{value}</td>
    </tr>
  );
}