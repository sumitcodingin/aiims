import collegeLogo from "../../assets/images/iit_ropar_logo.jpg";


export default function AdvisorProfile() {
  const user = JSON.parse(localStorage.getItem("user"));

  return (
    <div className="max-w-6xl mx-auto bg-white p-10 border border-gray-400">
      {/* ================= HEADER ================= */}
      <div className="mb-14 text-center">
        <img
          src={collegeLogo}
          alt="IIT Ropar Logo"
          className="mx-auto mb-4 h-20 w-auto object-contain"
        />

        <h1 className="text-2xl font-bold uppercase tracking-wide">
          Indian Institute of Technology Ropar
        </h1>

        <p className="mt-2 text-base text-gray-700">
          Advisor Information Record
        </p>
      </div>

      {/* ================= ADVISOR DETAILS ================= */}
      <Section title="Advisor Details">
        <Table>
          <Row label="Full Name" value={user?.name || "—"} />
          <Row label="Email Address" value={user?.email || "—"} />
          <Row
            label="Department"
            value={user?.department || "—"}
          />
          <Row label="Role" value="Advisor" />
        </Table>
      </Section>

      {/* ================= PROFESSIONAL DETAILS ================= */}
      <Section title="Professional Information">
        <Table>
          <Row
            label="Research Interests"
            value={user?.research || "—"}
          />
          <Row
            label="Experience"
            value={user?.experience || "—"}
          />
          <Row
            label="Room Number"
            value={user?.roomNo || "—"}
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

/* ================= HELPERS ================= */

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
