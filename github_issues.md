# Asteriq - GitHub Issues List (Planned for Tomorrow)

This document contains detailed templates for the five tasks to be resolved tomorrow. You can copy and paste these templates directly into GitHub Issues.

---

## 1. Bug: Question Bank Management returns empty question list

### Description
The Question Bank Management UI displays `"No questions match your filters or found for this subject."` even though questions exist in the database. 

### Steps to Reproduce
1. Log in as an Administrator/Super Admin.
2. Navigate to **Question Bank** from the sidebar.
3. Select any subject from the dropdown (e.g., `CS502 - Computer Networks`).
4. Observe that the table is empty and no questions list is fetched.

### Expected Behavior
The table should fetch and list all questions associated with the selected subject.

### Action Items
- Verify the network response payload for the request:
  `GET /api/questions?subjectId=<UUID>&includeUsed=false&page=1&limit=10`
- Check the server error logs for database exceptions (e.g., connection timeouts or dialect errors).
- Confirm the `subject_id` UUID values in the `questions` table match the subject table UUIDs exactly.

---

## 2. Bug: Admin Dashboard statistics show zero value metrics

### Description
The newly enhanced Admin Dashboard displays `0` for all key statistics cards (Mapped Subjects, Active Faculty, Question Bank Volume, Approved Questions) even though data exists in the Postgres database.

### Expected Behavior
The stats cards should query the database and display real-time counters.

### Action Items
- Check the response of `/api/dashboard/academic` on the production server.
- Verify why the `hodStats` dictionary is returning empty or zeros in `backend/app/routes/dashboard.py`.
- Confirm that the database user credentials used by Flask have query permissions for the `users`, `subjects`, and `questions` tables.

---

## 3. UI/UX: Overlapping layout and readability issues in Assignment Manager creation dialog

### Description
In `src/pages/admin/AssignmentManager.jsx`, when opening the form to create or edit a subject assignment, elements (text fields, date pickers, dropdowns, and submit buttons) overlap and are not formatted correctly.

### Expected Behavior
A clean, responsive, and readable form modal with sufficient spacing and vertical alignment.

### Action Items
- Review layout wrappers (`Box`, `Grid`, `DialogContent`) in `AssignmentManager.jsx`.
- Standardize all inline styling, replacing legacy margins with Material-UI spacing utilities (`sx={{ mb: 2 }}`).
- Test the dialog layout on various viewport resolutions (desktop, tablet, mobile).

---

## 4. Refactor: Remove redundant 'Assign Subjects' button/route from Admin Dashboard

### Description
The legacy "Assign Subjects" panel (`src/pages/admin/AssignSubjects.jsx`) is redundant because the new `AssignmentManager.jsx` provides a complete, role-based assignment solution that handles subject mapping, HOD mapping, and COE mapping.

### Action Items
- Remove the "Assign Subjects" option from the sidebar in `src/components/Sidebar.jsx`.
- Remove the "Map Course Role" quick action button in `src/pages/admin/Dashboard.jsx`.
- Safely delete `src/pages/admin/AssignSubjects.jsx`.
- Clean up the corresponding routes inside `src/App.jsx`.

---

## 5. Feature: Add Terms, Privacy, and Documentation pages and enable section-wise scroll navigation

### Description
Develop comprehensive static information routes for Asteriq (Docs, Terms, Privacy Policy) and configure navbar menu items to scroll smoothly to sections on the landing home page.

### Action Items
- Build detailed documentation contents in `src/pages/About.jsx`.
- Create new pages `TermsOfService.jsx` and `PrivacyPolicy.jsx` under `src/pages/`.
- Update the layout footer links to direct to these new pages.
- Add anchor tags (`#features`, `#security`, `#why-us`) on the landing page in `src/pages/Home.jsx`.
- Modify navbar links to perform smooth scroll animations to those anchors on click.
