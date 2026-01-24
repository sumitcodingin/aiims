export default function AcademicEvents() {
  const handleDownload = () => {
    window.location.href = "/academic-calendar-2026.pdf";
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* ================= HEADER ================= */}
      <div className="relative mb-4">
        {/* DOWNLOAD BUTTON */}
        <button
          onClick={handleDownload}
          className="
            absolute right-0 top-0
            bg-gray-800 text-white
            text-sm
            px-4 py-1.5
            rounded
            border border-gray-700
            hover:bg-gray-700
            transition
          "
        >
          Download PDF
        </button>

        <h1 className="text-xl font-bold text-center mb-1">
          INDIAN INSTITUTE OF TECHNOLOGY ROPAR
        </h1>
        <h2 className="text-center font-semibold mb-4">
          Academic Calendar January 2026 to December 2026 for UG / PG / PhD
          (continuing batch)
        </h2>
      </div>

      {/* ================= TABLE 1 ================= */}
      <div className="overflow-x-auto bg-white shadow rounded mb-8">
        <table className="min-w-full border border-black text-sm">
          <thead>
            <tr className="font-bold text-center">
              <th className="border border-black p-2">
                2nd semester of AY 2025-26
              </th>
              <th className="border border-black p-2">Academic Events</th>
              <th className="border border-black p-2">
                1st semester of AY 2026-27
              </th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td className="border border-black p-2 align-top">
                Jan 02 (Fri)
              </td>
              <td className="border border-black p-2 align-top">
                Reporting & Registration of new PG/Ph.D/UG students
              </td>
              <td
                className="border border-black p-2 align-top"
                rowSpan={3}
              >
                <strong>For new PG / Ph.D / UG students</strong>
                <br />
                July 3rd week or 4th week – dates will be notified later.
              </td>
            </tr>

            <tr>
              <td className="border border-black p-2 align-top" rowSpan={2}>
                <strong>For new Ph.D students</strong>
                <br />
                1st week of Jan – will be notified separately
              </td>
              <td className="border border-black p-2 align-top">
                Induction / Orientation of new PG/Ph.D/UG students
              </td>
            </tr>

            <tr>
              <td className="border border-black p-2 align-top">
                Last date of Late registration (for new PG/Ph.D/UG students)
              </td>
            </tr>

            <Tr
              left="Dec 15 (Mon) – Dec 31 (Wed)"
              event="Pre-registration of courses for 2nd semester of AY 2025-26 (for all continuing students) on AIMS portal"
              right="July 09 (Thu) – July 22 (Wed)"
            />
            <Tr
              left="Jan 01 and Jan 02 (Thu and Fri)"
              event="Registration of continuing UG/PG/PhD students"
              right="Jul 21 (Tue) – Jul 22 (Wed)"
            />
            <Tr
              left="Jan 05 (Mon)"
              event="Commencement of classes"
              right="Jul 23 (Thu)"
            />
            <Tr
              left="Jan 09 (Fri)"
              event="Last date of Late registration (for continuing students)"
              right="Jul 29 (Wed)"
            />
            <Tr
              left="Jan 19 (Mon)"
              event="Last date for course ADD / DROP"
              right="Aug 03 (Mon)"
            />
            <Tr
              left="Jan 20 (Tue)"
              event="Last date for adding courses (in lieu of dropped courses)"
              right="Aug 04 (Tue)"
            />
            <Tr
              left="Jan 27 (Tue) – Jan 30 (Fri)"
              event="Student-Faculty Advisor Meeting-I"
              right="Aug 17 (Mon) – Aug 21 (Fri)"
            />
            <Tr
              left="Feb 25 (Wed) – Mar 03 (Tue)"
              event="Mid Semester Examination"
              right="Sep 15 (Tue) – Sep 21 (Mon)"
              bold
            />
            <Tr
              left="Mar 05 (Thu)"
              event="Mid Semester Project Evaluation (No Class day)"
              right="Sep 22 (Tue)"
              bold
            />
            <Tr
              left="Mar 09 (Mon)"
              event="Last date for showing of marked answer scripts"
              right="Sep 24 (Thu)"
            />
            <Tr
              left="Mar 09 (Mon) – Mar 23 (Mon)"
              event="Floating of courses by the Departments for next semester – 1st semester of AY 2026-27 / 2nd semester of AY 2025-26"
              right="Sep 28 (Mon) – Oct 12 (Mon)"
            />
            <Tr
              left="Mar 13 (Fri)"
              event="Last date for Audit and Withdrawal"
              right="Sep 30 (Wed)"
            />
            <Tr
              left="Mar 16 (Mon) – Mar 20 (Fri)"
              event="Student-Faculty Advisor Meeting-II"
              right="Oct 05 (Mon) – Oct 09 (Fri)"
            />
            <Tr
              left="Apr 30 (Thu)"
              event="Last date for getting course evaluation form filled / submission of preliminary project reports / Display of attendance / Display of Pre-Major Totals (PMT) / Last day of classes"
              right="Nov 13 (Fri)"
            />
            <Tr
              left="May 04 (Mon) – May 13 (Wed)"
              event="End Semester Examination"
              right="Nov 16 (Mon) – Nov 26 (Thu)"
              bold
            />
            <Tr
              left="May 14 (Thu) and May 15 (Fri)"
              event="Project viva-vice & submission of final project reports for UG students"
              right="Nov 27 (Fri) – Nov 28 (Sat)"
            />
            <Tr
              left="May 18 (Mon)"
              event="Viewing of answer sheets by the students"
              right="Nov 30 (Mon)"
            />
            <Tr
              left="May 19 (Tue)"
              event="Last date for grades to reach to the Academics Section (on-line submission, including moderation etc)"
              right="Dec 03 (Thu)"
            />
            <Tr
              left="May 21 (Thu) – May 22 (Fri)"
              event="Make-up examination (for medical exigencies, strictly with prior approval by Dean (Academics))"
              right="Dec 17 (Thu) – Dec 18 (Fri)"
            />
            <Tr
              left="Will be notified later"
              event="Supplementary exam"
              right="Will be notified later"
            />
            <Tr
              left="May 16 (Sat) – Jul 20 (Mon)"
              event="Vacation (for UG & M.Sc. only)"
              right="Nov 29 (Sun) – Dec 31 (Thu)"
              bold
            />
            <Tr
              left="July 09 (Thu) – July 22 (Wed)"
              event="Pre-registration of courses for 1st semester of AY 2026-27 / 2nd semester of AY 2025-26 (for all continuing students) on AIMS portal"
              right="Dec 11 (Fri) – Dec 29 (Tue)"
            />
            <Tr
              left="May 20 (Wed) – Jul 17 (Fri) (Tentative)"
              event="Summer Semester (Registration / Classes / Mid and Major exam dates included in the given dates)"
              right="-"
              bold
            />
          </tbody>
        </table>
      </div>

      {/* ================= IMPORTANT NOTE ================= */}
      <div className="bg-white shadow rounded p-4 text-sm">
        <h3 className="font-bold mb-2">Important Note:</h3>
        {/* (rest unchanged) */}
      </div>
    </div>
  );
}

/* ================= ROW COMPONENT ================= */
function Tr({ left, event, right, bold }) {
  return (
    <tr className={bold ? "font-bold" : ""}>
      <td className="border border-black p-2 align-top">{left}</td>
      <td className="border border-black p-2 align-top">{event}</td>
      <td className="border border-black p-2 align-top">{right}</td>
    </tr>
  );
}
