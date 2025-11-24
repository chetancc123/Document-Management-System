
import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import "../../assets/css/dashboard-shell.css";

import logoUrl from "../../assets/images/pngegg.png";
const FALLBACK_LOGO = "/mnt/data/0fc69dac-ed08-4f49-82b7-4b8899ff8e03.png";

export default function DashboardShell() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("dms_token");
    navigate("/login");
  };

  const navItems = [
    { to: "/dashboard/documents", label: "Documents" },
    { to: "/dashboard/upload", label: "Upload Document" },
    { to: "/dashboard/create-user", label: "Create User" },
  ];

  const logoSrc = logoUrl || FALLBACK_LOGO;

  return (
    <div className="d-flex dashboard-root">
      <aside className="sidebar p-3 flex-column align-items-stretch">
        <div className="sidebar-brand text-center mb-3">
          <img src={logoSrc} alt="Logo" className="brand-logo" />
          <div className="brand-text">DocMgmt Admin</div>
        </div>

        <nav className="nav flex-column gap-2">
          {navItems.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              className={({ isActive }) =>
                `btn sidebar-btn text-start ${isActive ? "active" : "btn-light"}`
              }
            >
              {it.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* MAIN AREA */}
      <div className="flex-grow-1 main-area">
        <header className="top-navbar">
          <div className="container-fluid d-flex align-items-center justify-content-between px-3">
            <div className="d-flex align-items-center gap-3">
              <img src={logoSrc} alt="Logo" className="top-logo" />
              <div className="top-title">Document Management System</div>
            </div>

            <div>
              <button className="btn btn-danger btn-sm" onClick={logout}>Logout</button>
            </div>
          </div>
        </header>

        {/* MOBILE TAB NAV - shown only on very small screens (<=650px) and placed under top-navbar */}
        <div className="mobile-tab-nav">
          <div className="mobile-nav-scroll px-3 py-2">
            {navItems.map((it) => (
              <NavLink
                key={it.to}
                to={it.to}
                className={({ isActive }) => `mobile-nav-btn ${isActive ? "active" : ""}`}
              >
                {it.label}
              </NavLink>
            ))}
          </div>
        </div>

        <main className="p-4">
          <div className="container-fluid">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
