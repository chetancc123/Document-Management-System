
import React, { useEffect, useState } from "react";

export default function AdminCreateUser() {
  
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [mobile, setMobile] = useState("");

  const [errors, setErrors] = useState({});

  const [msg, setMsg] = useState(null);

  const [loading, setLoading] = useState(false);

  const [users, setUsers] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("local_users")) || [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("local_users", JSON.stringify(users));
  }, [users]);

  const validate = () => {
    const e = {};

    if (!username.trim()) e.username = "Username is required.";
    else if (username.trim().length < 3)
      e.username = "Minimum 3 characters required.";
    else if (!/^[a-zA-Z0-9._-]+$/.test(username))
      e.username = "Only letters, digits, dot, underscore allowed.";

    if (!displayName.trim()) e.displayName = "Name is required.";
    else if (displayName.trim().length < 2)
      e.displayName = "Name too short.";

    if (!password.trim()) e.password = "Password is required.";
    else if (password.length < 6) e.password = "Minimum 6 characters required.";

    if (!mobile) e.mobile = "Mobile is required.";
    else if (mobile.length !== 10)
      e.mobile = "Mobile number must be exactly 10 digits.";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleMobileChange = (value) => {
    const digits = value.replace(/\D/g, "").slice(0, 10);
    setMobile(digits);
  };

  const createUser = async (e) => {
    e.preventDefault();
    setMsg(null);

    if (!validate()) {
      setMsg({ type: "danger", text: "Please fix the errors and try again." });
      return;
    }

    try {
      setLoading(true);

      const newUser = {
        id: `u_${Date.now()}`,
        username: username.trim(),
        name: displayName.trim(),
        mobile,
        createdAt: new Date().toISOString(),
      };

      setUsers((prev) => [newUser, ...prev]);

      setMsg({
        type: "success",
        text: "User created locally (saved in localStorage).",
      });

      setUsername("");
      setDisplayName("");
      setPassword("");
      setMobile("");
      setErrors({});
    } catch (err) {
      setMsg({ type: "danger", text: "Unexpected error occurred." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="d-flex justify-content-center"
      style={{ minHeight: "100vh", background: "#f5f7fa" }}
    >
      <div style={{ width: "850px" }}>
        <div className="text-center mb-4">
          <h2 className="mt-3">Admin – Create User</h2>
        </div>


        <div className="card shadow-sm mb-4">
          <div className="card-body p-4">
            <h5 className="card-title mb-3">User Details</h5>

            {msg && (
              <div className={`alert alert-${msg.type}`} role="alert">
                {msg.text}
              </div>
            )}

            <form onSubmit={createUser} noValidate>
              <div className="row g-3">
                {/* Username */}
                <div className="col-md-6">
                  <label className="form-label">Username *</label>
                  <input
                    className={`form-control ${
                      errors.username ? "is-invalid" : username ? "is-valid" : ""
                    }`}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                  {errors.username && (
                    <div className="invalid-feedback">{errors.username}</div>
                  )}
                </div>

                {/* Display Name */}
                <div className="col-md-6">
                  <label className="form-label">Full Name *</label>
                  <input
                    className={`form-control ${
                      errors.displayName
                        ? "is-invalid"
                        : displayName
                        ? "is-valid"
                        : ""
                    }`}
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                  {errors.displayName && (
                    <div className="invalid-feedback">{errors.displayName}</div>
                  )}
                </div>

                {/* Password */}
                <div className="col-md-6">
                  <label className="form-label">Password *</label>
                  <input
                    type="password"
                    className={`form-control ${
                      errors.password ? "is-invalid" : password ? "is-valid" : ""
                    }`}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  {errors.password && (
                    <div className="invalid-feedback">{errors.password}</div>
                  )}
                </div>

                {/* Mobile */}
                <div className="col-md-6">
                  <label className="form-label">Mobile Number *</label>
                  <input
                    type="tel"
                    className={`form-control ${
                      errors.mobile ? "is-invalid" : mobile ? "is-valid" : ""
                    }`}
                    value={mobile}
                    onChange={(e) => handleMobileChange(e.target.value)}
                  />
                  {errors.mobile && (
                    <div className="invalid-feedback">{errors.mobile}</div>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <button
                  className="btn btn-primary px-4"
                  disabled={loading}
                  type="submit"
                >
                  {loading ? "Creating..." : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* TABLE OF USERS */}
        <div className="card shadow-sm">
          <div className="card-body">
            <h5 className="card-title mb-3">Recently Added Users</h5>

            {users.length === 0 ? (
              <div className="text-muted">No users added yet.</div>
            ) : (
              <div className="table-responsive">
                <table className="table table-sm table-striped">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Username</th>
                      <th>Mobile</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td>{u.id}</td>
                        <td>{u.name}</td>
                        <td>{u.username}</td>
                        <td>{u.mobile}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
