import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../api/api"; 
import "../assets/css/validate-otp.css";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function ValidateOtpStyled() {
  const query = useQuery();
  const navigate = useNavigate();
  const initialMobile = query.get("mobile") || "";
  const [mobile, setMobile] = useState(initialMobile);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(""); 
  const [infoMsg, setInfoMsg] = useState("");

  useEffect(() => {
    if (!mobile && query.get("mobile")) setMobile(query.get("mobile"));
  }, [query, mobile]);

  const handleVerify = async (e) => {
    e?.preventDefault();
    setErrorMsg("");
    setInfoMsg("");

    if (!mobile) {
      setErrorMsg("Mobile number is required.");
      return;
    }
    if (!otp) {
      setErrorMsg("Please enter the OTP.");
      return;
    }

    try {
      setLoading(true);
      const res = await api.post("/validateOTP", { mobile_number: mobile, otp });

      const token = res?.data?.token || res?.data?.data?.token || res?.data?.data?.authToken;

      if (!token) {
        const backendMsg = res?.data?.data || res?.data?.message || null;
        if (backendMsg) setErrorMsg(backendMsg);
        else setErrorMsg("OTP verification failed — token not received.");
        return;
      }

      localStorage.setItem("dms_token", token);
      setInfoMsg("OTP verified — redirecting to dashboard...");
      setTimeout(() => navigate("/dashboard"), 700);
    } catch (err) {
      console.error("OTP verify error:", err);
      const backendErr =
        err?.response?.data?.data ||
        err?.response?.data?.message ||
        err?.response?.data ||
        err.message ||
        "OTP verification failed.";
      setErrorMsg(backendErr);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="otp-page d-flex align-items-start justify-content-center">
      <div className="otp-card card shadow-lg">
        <div className="card-body p-5 text-center">
          
          <img
            src={"/mnt/data/699753e4-dbbd-4376-8f5b-242eb1fc77a3.png"}
            alt="Logo"
            className="mb-3 otp-logo"
          />

        
          <h3 className="mb-4 fw-bold">Document Management System</h3>

          {mobile && <p className="text-muted small">Logging in with: <strong>{mobile}</strong></p>}

          <form onSubmit={handleVerify}>
            <div className="mb-3 text-start">
              <label className="form-label">One Time Password (OTP)</label>
              <input
                type="text"
                className="form-control form-control-lg text-center otp-input"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={8}
              />
            </div>

            
            <div className="d-grid mb-2">
              <button className="btn btn-primary btn-lg" type="submit" disabled={loading}>
                {loading ? "Verifying..." : "Verify OTP"}
              </button>
            </div>

            
            {errorMsg && (
              <div className="text-center mt-2">
                <small className="text-danger fw-semibold">{errorMsg}</small>
              </div>
            )}

            {infoMsg && (
              <div className="text-center mt-2">
                <small className="text-success">{infoMsg}</small>
              </div>
            )}

            <div className="mt-4 text-center">
              <button
                type="button"
                className="btn btn-link"
                onClick={() => window.location.replace("/login")}
              >
                Back to Login
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
