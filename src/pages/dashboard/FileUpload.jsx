// src/pages/dashboard/FileUpload.jsx
import React, { useEffect, useState, useRef } from "react";
import api from "../../api/api";

/**
 * FileUpload component updated to use Postman API shapes:
 * - POST /saveDocumentEntry (multipart/form-data) with fields:
 *    file (file) and data (stringified JSON)
 * - POST /documentTags  (body: { term: "" }) to fetch tags
 * - Uses header 'token' (value from localStorage 'dms_token') as required by Postman
 *
 * Drop this file into: src/pages/dashboard/FileUpload.jsx
 */

export default function FileUpload() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10)); // YYYY-MM-DD
  const [major, setMajor] = useState("Personal");
  const [minorOptions, setMinorOptions] = useState([]);
  const [minor, setMinor] = useState("");
  const [tags, setTags] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [remarks, setRemarks] = useState("");
  const [file, setFile] = useState(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState(null);
  const tagInputRef = useRef();

  // set initial minor options (fallback)
  useEffect(() => {
    loadMinorOptions(major);
    fetchTags(""); // fetch all tags (empty term)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Get token from localStorage (set by Validate OTP)
  const getToken = () => localStorage.getItem("dms_token") || "";

  // Fetch tags from /documentTags (Postman uses POST with { term: "" })
  const fetchTags = async (term = "") => {
    try {
      const token = getToken();
      const res = await api.post(
        "/documentTags",
        { term },
        { headers: { token } }
      );
      // response shape in Postman unknown; try to read sensible paths
      const data = res?.data?.data || res?.data || [];
      setAvailableTags(Array.isArray(data) ? data.map(t => (t.tag_name ?? t)) : []);
    } catch (err) {
      console.error("fetchTags err:", err);
      setAvailableTags([]); // fallback
    }
  };

  // Load minor options (no API in Postman for minor-heads; using fallback lists)
  const loadMinorOptions = (selectedMajor) => {
    setMinor("");
    if (selectedMajor === "Personal") {
      const fallback = ["John", "Tom", "Emily", "Sarah"];
      setMinorOptions(fallback);
      setMinor(fallback[0]);
    } else {
      const fallback = ["Accounts", "HR", "IT", "Finance"];
      setMinorOptions(fallback);
      setMinor(fallback[0]);
    }
  };

  const handleMajorChange = (e) => {
    const val = e.target.value;
    setMajor(val);
    loadMinorOptions(val);
  };

  // Tag handling: add tag (keeps tag_name shape for later data)
  const addTag = (t) => {
    if (!t) return;
    const norm = t.trim();
    if (!norm) return;
    if (!tags.includes(norm)) setTags(prev => [...prev, norm]);
    setTagInput("");
    // optionally refresh available tags
    fetchTags("");
  };
  const removeTag = (t) => setTags(prev => prev.filter(x => x !== t));

  const onTagKeyDown = (e) => {
    if (e.key === "Enter" || e.key === "Tab" || e.key === ",") {
      e.preventDefault();
      if (tagInput.trim()) addTag(tagInput);
    } else if (e.key === "Backspace" && !tagInput) {
      setTags(prev => prev.slice(0, -1));
    }
  };

  const onFileChange = (e) => {
    setMessage(null);
    const f = e.target.files[0];
    if (!f) return;
    // validate type
    if (!f.type.match("image/") && f.type !== "application/pdf") {
      setMessage({ type: "danger", text: "Only images and PDF files are allowed." });
      e.target.value = null;
      return;
    }
    const maxBytes = 10 * 1024 * 1024;
    if (f.size > maxBytes) {
      setMessage({ type: "danger", text: "File too large. Max 10MB." });
      e.target.value = null;
      return;
    }
    if (f.type.match("image/")) {
      const preview = URL.createObjectURL(f);
      setFilePreviewUrl(preview);
      setFile(Object.assign(f, { preview }));
    } else {
      setFilePreviewUrl("");
      setFile(f);
    }
  };

  // Build the `data` JSON string expected by the API and post as form-data
  const handleUpload = async (e) => {
    e?.preventDefault();
    setMessage(null);

    if (!file) {
      setMessage({ type: "danger", text: "Please select a file." });
      return;
    }
    if (!minor) {
      setMessage({ type: "danger", text: "Please select Name/Department." });
      return;
    }

    // Build tags array as objects { tag_name: "..." } as Postman shows
    const tagsPayload = tags.map(t => ({ tag_name: t }));

    // Build data object exactly like Postman example
    const dataObj = {
      major_head: major,                        // e.g., "Personal" or "Professional" or "Company"
      minor_head: minor,                        // selected name/department
      document_date: date,                      // format YYYY-MM-DD (server may accept)
      document_remarks: remarks,
      tags: tagsPayload,
      user_id: localStorage.getItem("user_id") || "unknown" // change if you store user id differently
    };

    const form = new FormData();
    form.append("file", file);
    form.append("data", JSON.stringify(dataObj));

    try {
      setUploading(true);
      setProgress(0);
      const token = getToken();

      const res = await api.post("/saveDocumentEntry", form, {
        headers: {
          "Content-Type": "multipart/form-data",
          token, // Postman expects header key 'token'
        },
        onUploadProgress: (ev) => {
          if (ev.total) {
            const p = Math.round((ev.loaded * 100) / ev.total);
            setProgress(p);
          }
        },
      });

      // inspect response
      if (res?.data?.status === false) {
        setMessage({ type: "danger", text: res.data.data || "Upload failed." });
      } else {
        setMessage({ type: "success", text: res?.data?.data || "Uploaded successfully." });
        // reset a few things
        setDate(new Date().toISOString().slice(0, 10));
        setMajor("Personal");
        loadMinorOptions("Personal");
        setTags([]);
        setRemarks("");
        setFile(null);
        setFilePreviewUrl("");
      }
    } catch (err) {
      console.error("upload err:", err);
      const txt = err?.response?.data?.data || err?.message || "Upload failed.";
      setMessage({ type: "danger", text: txt });
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="container my-4">
      <div className="card shadow-sm">
        <div className="card-body">
          <h5 className="card-title mb-3">Upload Document</h5>

          {message && (
            <div className={`alert alert-${message.type}`} role="alert">
              {message.text}
            </div>
          )}

          <form onSubmit={handleUpload}>
            <div className="row g-3">
              {/* Date */}
              <div className="col-md-4">
                <label className="form-label">Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              {/* Major head */}
              <div className="col-md-4">
                <label className="form-label">Category (major_head)</label>
                <select className="form-select" value={major} onChange={handleMajorChange}>
                  <option>Personal</option>
                  <option>Professional</option>
                </select>
              </div>

              {/* Minor head */}
              <div className="col-md-4">
                <label className="form-label">{major === "Personal" ? "Name" : "Department"} (minor_head)</label>
                <select className="form-select" value={minor} onChange={(e) => setMinor(e.target.value)}>
                  {minorOptions.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              {/* Tags */}
              <div className="col-12">
                <label className="form-label">Tags</label>
                <div className="mb-2">
                  {tags.map(t => (
                    <span key={t} className="badge bg-primary me-2">
                      {t} <span style={{ cursor: "pointer", marginLeft: 6 }} onClick={() => removeTag(t)}>&times;</span>
                    </span>
                  ))}
                </div>

                <input
                  ref={tagInputRef}
                  list="available-tags"
                  type="text"
                  className="form-control"
                  placeholder="Add tag and press Enter"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={onTagKeyDown}
                />
                <datalist id="available-tags">
                  {availableTags.map((t) => (
                    <option key={t} value={t} />
                  ))}
                </datalist>
                <div className="form-text">Existing tags are suggested. New tags will be included in upload.</div>
              </div>

              {/* Remarks */}
              <div className="col-12">
                <label className="form-label">Remarks</label>
                <textarea className="form-control" value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={3} />
              </div>

              {/* File input + preview */}
              <div className="col-md-8">
                <label className="form-label">File (Image or PDF)</label>
                <input
                  type="file"
                  className="form-control"
                  accept="image/*,application/pdf"
                  onChange={onFileChange}
                />
                <div className="form-text">Only images and PDF files allowed. Max 10MB.</div>
              </div>

              <div className="col-md-4 d-flex align-items-center justify-content-center">
                {filePreviewUrl ? (
                  <img src={filePreviewUrl} alt="preview" style={{ maxWidth: 160, maxHeight: 120 }} />
                ) : file && file.name ? (
                  <div className="text-center small">{file.name}</div>
                ) : (
                  <div className="text-muted small">No preview</div>
                )}
              </div>

              <div className="col-12 d-flex align-items-center">
                <button className="btn btn-success me-3" type="submit" disabled={uploading}>
                  {uploading ? `Uploading... ${progress}%` : "Upload Document"}
                </button>

                {uploading && (
                  <div style={{ width: "40%" }}>
                    <div className="progress">
                      <div className="progress-bar" role="progressbar" style={{ width: `${progress}%` }}>{progress}%</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}
