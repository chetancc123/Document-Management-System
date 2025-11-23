import React, { useState, useEffect } from "react";
import api from "../api/api";
import { useNavigate, useLocation } from "react-router-dom";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function ValidateOtp() {
  const query = useQuery();
  const navigate = useNavigate();
  const [mobile, setMobile] = useState(query.get("mobile") || "");
  const [otp, setOtp] = useState("");
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!mobile && query.get("mobile")) setMobile(query.get("mobile"));
  }, [query, mobile]);

  const validate = async (e) => {
    e?.preventDefault();
    setMsg(null);
    if (!otp) return setMsg({ type: "danger", text: "Enter OTP." });

    try {
      setLoading(true);
      const res = await api.post("/validateOTP", { mobile_number: mobile, otp });
      
      const token = res?.data?.token || res?.data?.data?.token || res?.data?.data?.authToken;
      if (!token) {
        setMsg({ type: "danger", text: res?.data?.data || "Token not returned." });
        return;
      }
      localStorage.setItem("dms_token", token);
      setMsg({ type: "success", text: "Login successful. Redirecting..." });
      setTimeout(() => navigate("/dashboard"), 700);
    } catch (err) {
      console.error(err);
      setMsg({ type: "danger", text: err?.response?.data?.data || err?.message || "Validation failed" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-start" style={{ minHeight: "85vh" }}>
      <div className="card shadow-sm mt-5" style={{ width: 520 }}>
        <div className="card-body">
          <h4 className="card-title mb-3">Validate OTP</h4>

          {msg && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

          <form onSubmit={validate}>
            <div className="mb-3">
              <label className="form-label">Mobile</label>
              <input className="form-control" value={mobile} onChange={(e) => setMobile(e.target.value)} />
            </div>

            <div className="mb-3">
              <label className="form-label">OTP</label>
              <input className="form-control" value={otp} onChange={(e) => setOtp(e.target.value)} />
            </div>

            <div className="d-flex justify-content-between">
              <button className="btn btn-secondary" onClick={() => window.history.back()} type="button">Back</button>
              <button className="btn btn-success" type="submit" disabled={loading}>
                {loading ? "Verifying..." : "Validate OTP"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
