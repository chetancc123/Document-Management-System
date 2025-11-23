// src/pages/dashboard/FileSearchAndList.jsx
import React, { useEffect, useState } from "react";
import api from "../../api/api";
import JSZip from "jszip";
import { saveAs } from "file-saver";

/**
 * FileSearchAndList
 * - Search form: major/minor, tags (comma sep), from/to date, free text
 * - Uses POST /searchDocumentEntry (body as required by your API) with header `token`
 * - Shows results in table with View / Download buttons
 * - Preview modal (images & PDFs). For demo, uses fallback local image path if file URL is missing:
 *     /mnt/data/699753e4-dbbd-4376-8f5b-242eb1fc77a3.png
 */

export default function FileSearchAndList() {
  const [filters, setFilters] = useState({
    major_head: "",
    minor_head: "",
    from_date: "",
    to_date: "",
    tagsText: "", // user enters comma-separated tags
    searchText: ""
  });

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState({ open: false, url: "", type: "" });
  const [message, setMessage] = useState(null);
  const [pageStart, setPageStart] = useState(0);
  const [pageLength] = useState(10);

  // fallback demo image (developer-provided local path)
  const DEMO_FALLBACK = "/mnt/data/699753e4-dbbd-4376-8f5b-242eb1fc77a3.png";

  useEffect(() => {
    // initial load
    fetchDocs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const token = localStorage.getItem("dms_token") || "";

  function buildBody(start = pageStart, length = pageLength) {
    const tagNames = filters.tagsText
      .split(",")
      .map(t => t.trim())
      .filter(Boolean)
      .map(t => ({ tag_name: t }));

    return {
      major_head: filters.major_head || "",
      minor_head: filters.minor_head || "",
      from_date: filters.from_date || "",
      to_date: filters.to_date || "",
      tags: tagNames,
      uploaded_by: "",
      start,
      length,
      filterId: "",
      search: { value: filters.searchText || "" }
    };
  }

  const fetchDocs = async (start = 0, length = pageLength) => {
    setLoading(true);
    setMessage(null);
    try {
      const body = buildBody(start, length);
      const res = await api.post("/searchDocumentEntry", body, { headers: { token } });
      const data = res?.data;
      // Common shapes -> try to read rows
      const rowsFromServer = data?.data?.data || data?.data || data?.rows || data?.documents || [];
      setRows(Array.isArray(rowsFromServer) ? rowsFromServer : []);
    } catch (err) {
      console.error("search error", err);
      setMessage({ type: "danger", text: err?.response?.data?.data || err?.message || "Search failed." });
    } finally {
      setLoading(false);
    }
  };

  // fetch single file as blob (authenticated) and return blob URL
  const fetchFileBlobUrl = async (fileUrlOrPath, fallbackName = "file") => {
    try {
      // If fileUrlOrPath is missing, use demo fallback local path
      const url = fileUrlOrPath || DEMO_FALLBACK;

      // If url is a local public path (starts with /) and doesn't need auth, open directly
      // But to ensure token is sent when backend requires it, fetch via api (axios)
      const res = await api.get(url, { responseType: "blob", headers: { token } });
      const blob = res.data;
      const blobUrl = URL.createObjectURL(blob);
      return { blobUrl, filename: extractFilenameFromUrl(url) || fallbackName, blob };
    } catch (err) {
      console.error("fetchFileBlobUrl error", err);
      // Last-resort: if direct fetch fails and the url looks like local public file, try direct window.open
      return null;
    }
  };

  const extractFilenameFromUrl = (url) => {
    try {
      const parts = String(url).split("/");
      return parts[parts.length - 1].split("?")[0];
    } catch {
      return "file";
    }
  };

  const handleView = async (row) => {
    setMessage(null);
    // try common fields (adapt if API uses different key)
    const url = row.document_url || row.file_url || row.file_path || row.document_path || row.fileUrl || null;
    const maybe = await fetchFileBlobUrl(url, row.file_name || "document");
    if (!maybe) {
      setMessage({ type: "danger", text: "Unable to fetch preview for this file." });
      return;
    }
    const mime = maybe.blob.type || guessMimeFromName(maybe.filename);
    if (mime.startsWith("image/")) {
      setPreview({ open: true, url: maybe.blobUrl, type: "image" });
    } else if (mime === "application/pdf" || maybe.filename.toLowerCase().endsWith(".pdf")) {
      setPreview({ open: true, url: maybe.blobUrl, type: "pdf" });
    } else {
      // unsupported: show message inside modal
      setPreview({ open: true, url: "", type: "unsupported" });
    }
  };

  const guessMimeFromName = (name) => {
    const n = (name || "").toLowerCase();
    if (n.endsWith(".pdf")) return "application/pdf";
    if (n.match(/\.(jpg|jpeg|png|gif|bmp)$/)) return "image/png";
    return "application/octet-stream";
  };

  const handleDownloadSingle = async (row) => {
    setMessage(null);
    // similar to view but save file
    const url = row.document_url || row.file_url || row.file_path || row.document_path || row.fileUrl || null;
    try {
      const maybe = await fetchFileBlobUrl(url, row.file_name || "document");
      if (!maybe) {
        setMessage({ type: "danger", text: "Download failed." });
        return;
      }
      saveAs(maybe.blob, maybe.filename);
    } catch (err) {
      console.error("download single err", err);
      setMessage({ type: "danger", text: "Download failed." });
    }
  };

  // Download all visible rows as a zip
  const handleDownloadAllAsZip = async () => {
    if (!rows.length) { setMessage({ type: "danger", text: "No files to download." }); return; }
    setMessage(null);
    try {
      const zip = new JSZip();
      let added = 0;
      for (const r of rows) {
        const url = r.document_url || r.file_url || r.file_path || r.document_path || r.fileUrl || null;
        try {
          const maybe = await fetchFileBlobUrl(url, r.file_name || `file_${added + 1}`);
          if (maybe && maybe.blob) {
            zip.file(maybe.filename, maybe.blob);
            added++;
          }
        } catch (err) {
          console.warn("skip file", err);
        }
      }
      if (added === 0) { setMessage({ type: "danger", text: "No downloadable files found." }); return; }
      const content = await zip.generateAsync({ type: "blob" }, (meta) => {
        // optionally update progress: meta.percent
      });
      saveAs(content, `documents-${Date.now()}.zip`);
    } catch (err) {
      console.error("zip error", err);
      setMessage({ type: "danger", text: "Failed to create ZIP." });
    }
  };

  const onSearchSubmit = (e) => {
    e?.preventDefault();
    setPageStart(0);
    fetchDocs(0, pageLength);
  };

  const guessDisplayFilename = (row) => {
    return row.file_name || row.document_name || extractFilenameFromUrl(row.document_url || row.file_url || row.file_path || "") || "file";
  };

  return (
    <div className="container my-4">
      <div className="card shadow-sm">
        <div className="card-body">

          <h5 className="mb-3">Search Documents</h5>

          {message && <div className={`alert alert-${message.type}`}>{message.text}</div>}

          {/* Search form */}
          <form className="row g-2 align-items-end mb-3" onSubmit={onSearchSubmit}>
            <div className="col-md-2">
              <label className="form-label small">Category</label>
              <select className="form-select" value={filters.major_head} onChange={(e) => setFilters({...filters, major_head: e.target.value})}>
                <option value="">All</option>
                <option value="Personal">Personal</option>
                <option value="Professional">Professional</option>
              </select>
            </div>

            <div className="col-md-2">
              <label className="form-label small">{filters.major_head === "Professional" ? "Department" : "Name"}</label>
              <input className="form-control" value={filters.minor_head} onChange={(e)=>setFilters({...filters, minor_head: e.target.value})} placeholder="Name/Department"/>
            </div>

            <div className="col-md-2">
              <label className="form-label small">Tags (comma separated)</label>
              <input className="form-control" value={filters.tagsText} onChange={(e)=>setFilters({...filters, tagsText: e.target.value})} placeholder="invoice, id"/>
            </div>

            <div className="col-md-2">
              <label className="form-label small">From</label>
              <input type="date" className="form-control" value={filters.from_date} onChange={(e)=>setFilters({...filters, from_date: e.target.value})}/>
            </div>

            <div className="col-md-2">
              <label className="form-label small">To</label>
              <input type="date" className="form-control" value={filters.to_date} onChange={(e)=>setFilters({...filters, to_date: e.target.value})}/>
            </div>

            <div className="col-md-2">
              <label className="form-label small">Search</label>
              <div className="d-flex">
                <input className="form-control me-2" placeholder="free text" value={filters.searchText} onChange={(e)=>setFilters({...filters, searchText: e.target.value})}/>
                <button className="btn btn-primary" type="submit">Search</button>
              </div>
            </div>
          </form>

          {/* Actions */}
          <div className="mb-3 d-flex justify-content-end">
            <button className="btn btn-outline-secondary me-2" onClick={() => fetchDocs(0, pageLength)}>Refresh</button>
            <button className="btn btn-outline-success" onClick={handleDownloadAllAsZip}>Download All as ZIP</button>
          </div>

          {/* Results table */}
          <div className="table-responsive">
            <table className="table table-striped table-sm align-middle">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Date</th>
                  <th>Major</th>
                  <th>Minor</th>
                  <th>Remarks</th>
                  <th>Tags</th>
                  <th>Uploaded By</th>
                  <th style={{ minWidth: 160 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="8" className="text-center py-4">Loading...</td></tr>
                ) : rows.length === 0 ? (
                  <tr><td colSpan="8" className="text-center py-4">No documents found.</td></tr>
                ) : rows.map((r, i) => {
                  const date = r.document_date || r.documentDate || r.created_at || "";
                  const tags = r.tags || r.tag || [];
                  const tagText = Array.isArray(tags) ? tags.map(t => t.tag_name || t).join(", ") : String(tags);

                  return (
                    <tr key={i}>
                      <td>{pageStart + i + 1}</td>
                      <td style={{ whiteSpace: "nowrap" }}>{date}</td>
                      <td>{r.major_head || r.major || ""}</td>
                      <td>{r.minor_head || r.minor || r.department || ""}</td>
                      <td style={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis" }}>{r.document_remarks || r.remarks || ""}</td>
                      <td style={{ maxWidth: 160 }}>{tagText}</td>
                      <td>{r.user_id || r.uploaded_by || ""}</td>
                      <td>
                        <div className="btn-group" role="group">
                          <button className="btn btn-sm btn-outline-primary" onClick={() => handleView(r)}>View</button>
                          <button className="btn btn-sm btn-outline-success" onClick={() => handleDownloadSingle(r)}>Download</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div>
      </div>

      {/* Preview modal (simple) */}
      {preview.open && (
        <div className="modal show d-block" tabIndex="-1" role="dialog" onClick={() => setPreview({open:false, url:"", type:""})}>
          <div className="modal-dialog modal-xl" role="document" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">File Preview</h5>
                <button type="button" className="btn-close" onClick={() => setPreview({open:false, url:"", type:""})} />
              </div>
              <div className="modal-body text-center" style={{ minHeight: 300 }}>
                {preview.type === "image" && <img src={preview.url} alt="preview" style={{ maxWidth: "100%", maxHeight: "70vh" }} />}
                {preview.type === "pdf" && (
                  <iframe title="pdf-preview" src={preview.url} style={{ width: "100%", height: "70vh", border: "none" }} />
                )}
                {preview.type === "unsupported" && (
                  <div className="p-4">
                    <p className="lead">Preview not supported for this file type.</p>
                    <p>Use the Download button to get the file.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
