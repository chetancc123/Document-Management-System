import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import ValidateOtp from "./pages/ValidateOtp";
import DashboardShell from "./pages/dashboard/DashboardShell";
import AdminCreateUser from "./pages/dashboard/AdminCreateUser";
import ProtectedRoute from "./components/ProtectedRoute";
import ValidateOtpStyled from "./pages/ValidateOtpStyled";
import FileSearchAndList from "./pages/dashboard/FileSearchAndList";
import FileUpload from "./pages/dashboard/FileUpload";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/validate-otp" element={<ValidateOtp />} />
        <Route path="/validate-otp" element={<ValidateOtpStyled />} />
        <Route path="/upload" element={<FileUpload />} />

        <Route
          path="/dashboard/*"
          element={
            <ProtectedRoute>
              <DashboardShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="documents" replace />} />

          <Route path="create-user" element={<AdminCreateUser />} />
          <Route path="upload" element={<FileUpload />} />
          <Route path="documents" element={<FileSearchAndList />} />

        </Route>

        <Route path="*" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}
