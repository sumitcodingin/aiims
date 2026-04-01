# 🎓 IIT Ropar Academic Portal (AIMS-micro)

An institutional-grade platform designed to digitalize and automate complex academic workflows—from OTP-based secure onboarding and multi-tier course registration to research collaboration and automated grade analytics.



## 🚀 Advanced Academic Workflows

### 1. **Automated Academic Analytics**
* **GPA Calculation Engine**: Implements real-time logic to calculate **SGPA** for individual sessions and **CGPA** cumulatively by mapping institutional grade points.
* **Workload Enforcement**: Automatically validates enrollment requests against a strict **24-credit limit** per semester to ensure academic balance.
* **Earned vs. Registered Credits**: Dynamically tracks progress by filtering non-passing grades (F, NP, NF, I, W, U) from the cumulative earned credit total.

### 2. **Course Registration & Scheduling**
* **Collision Detection**: Prevents students from enrolling in courses with overlapping **Time Slots** (e.g., PC-1, PCE-2) within the same session.
* **Multi-Tier Enrollment State Machine**: Orchestrates a secure status flow: `Pending Instructor` $\rightarrow$ `Pending Advisor` $\rightarrow$ `Enrolled`.
* **Dynamic Registration Modes**: Supports diverse paths including **CREDIT**, **AUDIT**, **CONCENTRATION**, and **MINOR**.

### 3. **Academic Events & Scheduling Tools**
* **Centralized Academic Calendar**: Provides a synchronized repository for official academic events, Senate meeting schedules, and registration dates, all available for offline use via PDF download.
* **Dynamic Timetable Generator**: A tool that automatically maps a student's specific enrolled course slots onto a weekly visual schedule, allowing users to toggle between their personalized timetable and the general institute template.

### 4. **Research & Project Lifecycle**
* **Faculty Project Portal**: Instructors can "float" projects with specific visibility (Private/Public), student modes (Limited/Open), and prerequisite skill sets.
* **Integrated Application System**: Students browse institute-wide projects and submit join requests with personalized statements.
* **Automated Slot Control**: The system maintains real-time availability by decrementing slots immediately upon instructor acceptance.

---

## 👥 Stakeholder Features



### **Students**
* **Registration**: Add/drop courses and apply for specialized programs like Minors, Concentrations, or Internships.
* **Analytics**: Access real-time session-wise SGPA and cumulative CGPA records.
* **Engagement**: Submit quantitative and qualitative feedback for instructors across multiple performance metrics.
* **Tools**: Access personalized weekly timetables and browse available research projects.

### **Instructors**
* **Course Management**: Float new courses and manage enrollment approvals or student removals.
* **Grading**: Award grades individually or through efficient mass-grading via CSV uploads.
* **Communication**: Export class lists to CSV and send bulk emails to all enrolled students directly from the portal.
* **Research**: Manage the full lifecycle of research projects, including student join requests and member oversight.

### **Advisors**
* **Approvals**: Perform final checks and record decisions on student course enrollments and floated courses.
* **Oversight**: View the complete academic history, current workload, and profile details of assigned advisees.
* **Meeting Scheduler**: Coordinate with students via an integrated tool that generates and emails **.ics calendar invitations**.

### **Administrators**
* **User Management**: Oversee the user lifecycle, including approving, rejecting, or blocking accounts.
* **Governance**: Globally toggle system-wide windows for course registration and grade submission.
* **Course Validation**: Provide final review and approval for all courses floated by instructors.

---

## 🏗️ Technical Architecture & Security

### **Infrastructure & Reliability**
* **IPv4 SMTP Priority**: Solves Gmail SMTP latency issues by forcing IPv4 first in DNS resolution at the server level.
* **Secure OTP Auth**: Implementation of a dual-stage OTP verification system (Login & Signup) restricted strictly to institutional domains (`@iitrpr.ac.in`).
* **Session Persistence**: Utilizes `localStorage` for cross-tab session synchronization, ensuring a unified session across multiple browser windows.

### **Database Design (Supabase / PostgreSQL)**
* **Relational Integrity**: Leverages complex foreign key relationships across `users`, `student_profile`, `enrollments`, and `courses`.
* **Least-Loaded Assignment**: Employs a specific algorithm to automatically assign students to the advisor with the minimum current engagements in their department.

---

## 📂 Project Structure

```text
├── backend
│   ├── config/             # Supabase & Email Transporter settings
│   ├── controllers/        # Logic for Academic, Project, and Admin flows
│   ├── middleware/         # Session validation (authSession.js)
│   ├── routes/             # API Endpoints
│   ├── utils/              # Emailer & CSV Validation utilities
│   ├── server.js           # Express server with DNS optimization
│   └── supabaseClient.js   # Database connection
└── frontend
    └── src
        ├── components/     # ProtectedRoute, UI Wrappers
        ├── pages/          # Dashboards (Student, Instructor, Advisor, Admin)
        ├── services/       # Axios API configurations
        └── assets/         # Institutional logos and images
```

## 🛠️ Setup & Installation

### 1. Prerequisites
* Node.js (v16+)
* Supabase Account & Project

### 2. Environment Variables
Create a `.env` file in the `backend/` directory:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
EMAIL_USER=your_institute_email@iitrpr.ac.in
EMAIL_PASS=your_app_password
```

### 3. Installation

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 4. Running the Application

```bash
# Start the backend (from /backend)
node server.js

# Start the frontend (from /frontend)
npm start
```

## 👥 Team Members:-

* **Shaurya Anant** - 2023CSB1313
* **Venkata Praneeth J** - 2023CSB1296
* **Sumit Sharma** - 2023CSB1165
* **Aryan Sodhi** - 2023CSB1288
