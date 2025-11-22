// src/pages/dashboard/DashboardShell.jsx
import React from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";

export default function DashboardShell() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("dms_token");
    navigate("/login");
  };

  // path to your uploaded screenshot (assignment) - developer-provided local path:
  const screenshotUrl = "/mnt/data/061d7a53-d89a-48dc-9db1-656e7528e2da.png";

  return (
    <div className="d-flex" style={{ minHeight: "100vh" }}>
      {/* Sidebar */}
      <div className="bg-light border-end" style={{ width: 240 }}>
        <div className="p-3">
          <h5 className="mb-3">DocMgmt Admin</h5>
          <ul className="nav flex-column">
            <li className="nav-item"><Link className="nav-link" to="/dashboard">Overview</Link></li>
            <li className="nav-item"><Link className="nav-link" to="/dashboard/create-user">Create User</Link></li>
            {/* add more links here */}
          </ul>
        </div>
      </div>

      {/* Main */}
      <div className="flex-grow-1">
        <nav className="navbar navbar-expand navbar-white bg-white border-bottom">
          <div className="container-fluid">
            <span className="navbar-brand">Admin Dashboard</span>
            <div className="d-flex align-items-center">
              <button className="btn btn-outline-secondary btn-sm me-2" onClick={logout}>Logout</button>
            </div>
          </div>
        </nav>

        <main className="p-4">
          <div className="container-fluid">
            <Outlet />
            <div className="mt-4">
              <h6>Assignment screenshot (API test)</h6>
              <div className="card" style={{ maxWidth: 700 }}>
                <img
                  src={screenshotUrl}
                  alt="API screenshot"
                  style={{ width: "100%", objectFit: "cover" }}
                />
                <div className="card-body">
                  <small className="text-muted">Screenshot: generateOTP response showing "not registered".</small>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
