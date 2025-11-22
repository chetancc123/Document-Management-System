// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import ValidateOtp from "./pages/ValidateOtp";
import DashboardShell from "./pages/dashboard/DashboardShell";
import AdminCreateUser from "./pages/dashboard/AdminCreateUser";
import ProtectedRoute from "./components/ProtectedRoute";
import ValidateOtpStyled from "./pages/ValidateOtpStyled";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/validate-otp" element={<ValidateOtp />} />
        <Route path="/validate-otp" element={<ValidateOtpStyled />} />

        {/* Protected dashboard area with nested routes */}
        <Route
          path="/dashboard/*"
          element={
            <ProtectedRoute>
              <DashboardShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<div className="p-3">Welcome to Admin Dashboard</div>} />
          <Route path="create-user" element={<AdminCreateUser />} />
          {/* add other dashboard routes here */}
        </Route>

        <Route path="*" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}
