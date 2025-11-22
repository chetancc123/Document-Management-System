// src/pages/dashboard/AdminCreateUser.jsx
import React, { useState } from "react";
import api from "../../api/api";

export default function AdminCreateUser() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [mobile, setMobile] = useState("");
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const createUser = async (e) => {
    e?.preventDefault();
    setMsg(null);
    if (!username || !password) return setMsg({ type: "danger", text: "Fill username and password." });

    try {
      setLoading(true);
      // Replace the path & body to match your Postman registration endpoint
      const res = await api.post("/createUser", {
        username,
        password,
        mobile_number: mobile || undefined,
      });

      if (res?.data?.status === false) {
        setMsg({ type: "danger", text: res.data.data || "Create user failed." });
      } else {
        setMsg({ type: "success", text: res?.data?.data || "User created." });
        setUsername("");
        setPassword("");
        setMobile("");
      }
    } catch (err) {
      console.error(err);
      setMsg({ type: "danger", text: err?.response?.data?.data || err?.message || "Create user failed." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card shadow-sm" style={{ maxWidth: 720 }}>
      <div className="card-body">
        <h5 className="card-title mb-3">Create User (Admin)</h5>
        {msg && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

        <form onSubmit={createUser}>
          <div className="mb-3">
            <label className="form-label">Username</label>
            <input className="form-control" value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>

          <div className="mb-3">
            <label className="form-label">Password</label>
            <input type="password" className="form-control" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          <div className="mb-3">
            <label className="form-label">Mobile (optional)</label>
            <input className="form-control" value={mobile} onChange={(e) => setMobile(e.target.value)} />
          </div>

          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create User"}
          </button>
        </form>
      </div>
    </div>
  );
}
