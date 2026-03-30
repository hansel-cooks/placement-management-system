import { createBrowserRouter, Navigate } from "react-router";
import { DashboardLayout } from "./components/DashboardLayout";
import { StudentDashboard } from "./components/StudentDashboard";

import { ApplicationsPage } from "./components/ApplicationsPage";
import { CompanyDashboard } from "./components/CompanyDashboard";
import { CompanyJobsPage } from "./components/CompanyJobsPage";
import { NewJobPage } from "./components/NewJobPage";
import { CompanyApplicantsPage } from "./components/CompanyApplicantsPage";
import { DocumentsPage } from "./components/DocumentsPage";
import { Home } from "./components/Home";
import { LoginPage } from "./components/LoginPage";
import { MessagesPage, AnalyticsPage, SettingsPage } from "./components/PlaceholderPages";
import { InterviewsPage } from "./components/InterviewsPage";
import { AdminDashboard } from "./components/admin/AdminDashboard";
import { AdminCompaniesPage } from "./components/admin/AdminCompaniesPage";
import { AdminJobsPage } from "./components/admin/AdminJobsPage";
import { AdminReportsPage } from "./components/admin/AdminReportsPage";
import { OffersPage } from "./components/OffersPage";

export const router = createBrowserRouter([
  // Public routes
  { path: "/login", Component: LoginPage },

  // Protected app shell
  {
    path: "/",
    Component: DashboardLayout,
    children: [
      { index: true, Component: Home },
      { path: "dashboard", Component: StudentDashboard },

      { path: "applications", Component: ApplicationsPage },
      { path: "documents", Component: DocumentsPage },
      { path: "interviews", Component: InterviewsPage },
      { path: "offers", Component: OffersPage },
      { path: "messages", Component: MessagesPage },
      { path: "analytics", Component: AnalyticsPage },
      { path: "settings", Component: SettingsPage },
      // Company Routes
      { path: "company/dashboard", Component: CompanyDashboard },
      { path: "company/jobs", Component: CompanyJobsPage },
      { path: "company/jobs/new", Component: NewJobPage },
      { path: "company/applicants", Component: CompanyApplicantsPage },
      // Admin Routes
      { path: "admin/dashboard", Component: AdminDashboard },
      { path: "admin/companies", Component: AdminCompaniesPage },
      { path: "admin/jobs", Component: AdminJobsPage },
      { path: "admin/reports", Component: AdminReportsPage },
    ],
  },

  // Catch-all — redirect unknown paths to login
  { path: "*", element: <Navigate to="/login" replace /> },
]);
