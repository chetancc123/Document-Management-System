// src/pages/Login.jsx
import React, { useState } from "react";
import api from "../api/api";
import { useNavigate } from "react-router-dom";
import Logo from "../assets/images/pngegg.png"; 

export default function Login() {
  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const navigate = useNavigate();

  const requestOtp = async (e) => {
    e?.preventDefault();
    setMsg(null);
    if (!mobile) return setMsg({ type: "danger", text: "Enter mobile number." });

    try {
      setLoading(true);
      const res = await api.post("/generateOTP", { mobile_number: mobile }); // match Postman path
      if (res?.data?.status === false) {
        setMsg({ type: "danger", text: res.data.data || "Mobile not registered." });
      } else {
        setMsg({ type: "success", text: "OTP sent. Proceed to verify." });
        navigate(`/validate-otp?mobile=${encodeURIComponent(mobile)}`);
      }
    } catch (err) {
      console.error(err);
      setMsg({ type: "danger", text: err?.response?.data?.data || err?.message || "Request failed" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
        className="container d-flex justify-content-center align-items-start"
        style={{ minHeight: "85vh" }}
        >
        <div className="card shadow-sm mt-5 text-center" style={{ width: 520 }}>
            <div className="card-body">
            <img
                src={Logo}
                alt="Logo"
                style={{ height: 80, objectFit: "contain" }}
                className="mb-3"
            />

            <h3 className="fw-bold mb-4">Document Management System</h3>

            <h4 className="card-title mb-3">Login with OTP</h4>

            {msg && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

            <form onSubmit={requestOtp}>

                {/* Mobile field */}
                <div className="mb-3 text-start">
                <label className="form-label">Mobile Number</label>
                <input
                type="tel"
                className="form-control"
                placeholder="Enter your Registered Number"
                value={mobile}
                maxLength={10}                      
                onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");
                    setMobile(value);
                }}
                />
                </div>

                {/* Center Button */}
                <div className="d-flex justify-content-center">
                <button type="submit" className="btn btn-primary px-4" disabled={loading}>
                    {loading ? "Sending..." : "Request OTP"}
                </button>
                </div>

            </form>
            </div>
        </div>
        </div>

  );
}
