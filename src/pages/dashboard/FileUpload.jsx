import React, { useEffect, useState, useRef } from "react";
import api from "../../api/api";

const DEMO_PREVIEW = "/mnt/data/699753e4-dbbd-4376-8f5b-242eb1fc77a3.png";

export default function FileUpload() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [major, setMajor] = useState("Personal");
  const [minorOptions, setMinorOptions] = useState([]);
  const [minor, setMinor] = useState("");
  const [tags, setTags] = useState([]); 
  const [availableTags, setAvailableTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [remarks, setRemarks] = useState("");
  const [file, setFile] = useState(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState(DEMO_PREVIEW);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState(null);
  const tagInputRef = useRef();

  useEffect(() => {
    loadMinorOptions(major);
    fetchTags("");
    return () => {
      if (file && file.preview) URL.revokeObjectURL(file.preview);
    };
  }, []);

  const getToken = () => localStorage.getItem("dms_token") || "";

  const fetchTags = async (term = "") => {
    try {
      const token = getToken();
      const res = await api.post("/documentTags", { term }, { headers: { token } });
      const data = res?.data?.data || res?.data || [];
      setAvailableTags(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("fetchTags err:", err);
      setAvailableTags([]);
    }
  };

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

  const addTag = (value) => {
    const t = String(value || "").trim();
    if (!t) return;
    if (tags.includes(t)) {
      setTagInput("");
      return;
    }
    setTags((prev) => [...prev, t]);
    setTagInput("");
  };

  const removeTag = (t) => setTags((prev) => prev.filter((x) => x !== t));

  const onTagKeyDown = (e) => {
    if (e.key === "Enter" || e.key === "Tab" || e.key === ",") {
      e.preventDefault();
      if (tagInput.trim()) addTag(tagInput);
    } else if (e.key === "Backspace" && !tagInput) {
      setTags((prev) => prev.slice(0, -1));
    }
  };

  // File handling
  const onFileChange = (e) => {
    setMessage(null);
    const f = e.target.files[0];
    if (!f) return;

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

  const convertToDDMMYYYY = (isoDate) => {
    if (!isoDate) return "";
    if (isoDate.includes("-") && isoDate.split("-")[0].length === 2) return isoDate;
    const [yyyy, mm, dd] = isoDate.split("-");
    return `${dd}-${mm}-${yyyy}`;
  };

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

    const tagsPayload = tags.map((t) => ({ tag_name: t }));

    const dataObj = {
      major_head: major,
      minor_head: minor,
      document_date: convertToDDMMYYYY(date),
      document_remarks: remarks,
      tags: tagsPayload,
      user_id: localStorage.getItem("user_id") || "nitin",
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
          token,
        },
        onUploadProgress: (ev) => {
          if (ev.total) {
            const p = Math.round((ev.loaded * 100) / ev.total);
            setProgress(p);
          }
        },
      });

      if (res?.data?.status === false) {
        setMessage({ type: "danger", text: res.data.data || res.data.message || "Upload failed." });
      } else {
        setMessage({ type: "success", text: res?.data?.data || "Uploaded successfully." });
        setDate(new Date().toISOString().slice(0, 10));
        setMajor("Personal");
        loadMinorOptions("Personal");
        setTags([]);
        setRemarks("");
        setFile(null);
        setFilePreviewUrl(DEMO_PREVIEW);
      }
    } catch (err) {
      console.error("upload err:", err);
      const txt = err?.response?.data?.data || err?.response?.data?.message || err?.message || "Upload failed.";
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
                  {tags.map((t) => (
                    <span key={t} className="badge bg-primary me-2">
                      {t}{" "}
                      <span style={{ cursor: "pointer", marginLeft: 6 }} onClick={() => removeTag(t)}>&times;</span>
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
                    <option key={t.id || t.label} value={t.label} />
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
                  file && file.type && file.type.match("image/") ? (
                    <img src={filePreviewUrl} alt="preview" style={{ maxWidth: 160, maxHeight: 120 }} />
                  ) : file && file.name ? (
                    <div className="text-center small">{file.name}</div>
                  ) : (
                    <img src={filePreviewUrl} alt="example" style={{ maxWidth: 160, maxHeight: 120 }} />
                  )
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
