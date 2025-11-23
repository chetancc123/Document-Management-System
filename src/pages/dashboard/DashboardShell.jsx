// src/pages/dashboard/DashboardShell.jsx
import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import "../../assets/css/dashboard-shell.css"; // correct based on your project

import logoUrl from "../../assets/images/pngegg.png";

export default function DashboardShell() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("dms_token");
    navigate("/login");
  };

  return (
    <div className="d-flex dashboard-root">
      {/* Sidebar */}
      <aside className="sidebar p-3 d-flex flex-column align-items-stretch">
        <div className="sidebar-brand text-center mb-3">
          <img src={logoUrl} alt="Logo" className="brand-logo" />
          <div className="brand-text">DocMgmt Admin</div>
        </div>

        <nav className="nav flex-column gap-2">
          {/* Documents FIRST */}
          <NavLink
            to="/dashboard/documents"
            className={({ isActive }) =>
              `btn sidebar-btn text-start ${isActive ? "active" : "btn-light"}`
            }
          >
            Documents
          </NavLink>

          <NavLink
            to="/dashboard/upload"
            className={({ isActive }) =>
              `btn sidebar-btn text-start ${isActive ? "active" : "btn-light"}`
            }
          >
            Upload Document
          </NavLink>

          <NavLink
            to="/dashboard/create-user"
            className={({ isActive }) =>
              `btn sidebar-btn text-start ${isActive ? "active" : "btn-light"}`
            }
          >
            Create User
          </NavLink>
        </nav>

        <div className="mt-auto">
          {/* empty spacer */}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-grow-1 main-area">
        <header className="header-bar">
          <div className="container-fluid d-flex align-items-center justify-content-between">
            <h5 className="mb-0 header-title">Admin Dashboard</h5>

            {/* Logout Button - RED (top right) */}
            <button className="btn btn-danger btn-sm" onClick={logout}>
              Logout
            </button>
          </div>
        </header>

        <main className="p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
