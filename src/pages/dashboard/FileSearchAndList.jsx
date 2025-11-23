import React, { useEffect, useState } from "react";
import api from "../../api/api";
import JSZip from "jszip";
import { saveAs } from "file-saver";


export default function FileSearchAndList() {
  const [filters, setFilters] = useState({
    major_head: "",
    minor_head: "",
    tagsText: "",
    from_date: "",
    to_date: "",
    searchText: ""
  });

  const [allRows, setAllRows] = useState([]);
  const [pageRows, setPageRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState({ open: false, url: "", type: "" });
  const [message, setMessage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const PAGE_SIZE = 10;
  const DEMO_FALLBACK = "/mnt/data/699753e4-dbbd-4376-8f5b-242eb1fc77a3.png";
  const token = localStorage.getItem("dms_token") || "";

  useEffect(() => {
    fetchDocsAll();
  }, []);

  function buildBodyForAll() {
    const tagNames = (filters.tagsText || "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .map((t) => ({ tag_name: t }));

    return {
      major_head: filters.major_head || "",
      minor_head: filters.minor_head || "",
      from_date: filters.from_date || "",
      to_date: filters.to_date || "",
      tags: tagNames,
      uploaded_by: "",
      start: 0,
      length: 1000000,
      filterId: "",
      search: { value: filters.searchText || "" }
    };
  }

  const fetchDocsAll = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const body = buildBodyForAll();
      const res = await api.post("/searchDocumentEntry", body, { headers: { token } });
      const data = res?.data;
      const rowsFromServer = data?.data?.data || data?.data || data?.rows || data?.documents || [];
      const arr = Array.isArray(rowsFromServer) ? rowsFromServer : [];

      const sorted = arr.slice().sort((a, b) => parsePossibleDate(b) - parsePossibleDate(a));
      setAllRows(sorted);

      setCurrentPage(1);
      setPageRows(sorted.slice(0, PAGE_SIZE));
    } catch (err) {
      console.error("fetchDocs err:", err);
      setMessage({ type: "danger", text: err?.response?.data?.data || err?.message || "Failed to fetch documents." });
      setAllRows([]);
      setPageRows([]);
    } finally {
      setLoading(false);
    }
  };

  const parsePossibleDate = (row) => {
    const raw = row.document_date || row.documentDate || row.created_at || row.createdAt || row.date || "";
    if (!raw) return 0;
    const d = new Date(raw);
    if (!isNaN(d.getTime())) return d.getTime();
    if (typeof raw === "string" && raw.includes("-")) {
      const parts = raw.split("-");
      if (parts.length === 3 && parts[0].length === 2) {
        const [dd, mm, yyyy] = parts;
        const parsed = new Date(`${yyyy}-${mm}-${dd}`);
        if (!isNaN(parsed.getTime())) return parsed.getTime();
      }
    }
    return 0;
  };

  const resolveFileUrl = (url) => {
    if (!url) return null;
    try {
      const s = String(url);
      if (s.startsWith("http://") || s.startsWith("https://")) return s;
      const base = api.defaults.baseURL || "";
      try {
        return new URL(s, base).toString();
      } catch {
        return s;
      }
    } catch {
      return url;
    }
  };

  const extractFilenameFromUrl = (url) => {
    if (!url) return null;
    try {
      return String(url).split("/").pop().split("?")[0] || null;
    } catch {
      return null;
    }
  };

  const fetchFileBlobDirect = async (fileUrlOrPath) => {
    try {
      const resolved = resolveFileUrl(fileUrlOrPath) || DEMO_FALLBACK;
      const res = await api.get(resolved, { responseType: "blob", headers: { token } });
      const blob = res.data;
      const blobUrl = URL.createObjectURL(blob);
      const filename = extractFilenameFromUrl(resolved) || "file";
      return { blob, blobUrl, filename };
    } catch (err) {
      console.warn("fetchFileBlobDirect failed:", err);
      return { error: err };
    }
  };

  
  const fetchFileBlobViaProxy = async (fileUrlOrPath) => {
    try {
      const proxyBody = { path: String(fileUrlOrPath || "") };
      const res = await api.post("/downloadDocument", proxyBody, { headers: { token }, responseType: "blob" });
      const blob = res.data;
      const blobUrl = URL.createObjectURL(blob);
      const filename = extractFilenameFromUrl(proxyBody.path) || "file";
      return { blob, blobUrl, filename };
    } catch (err) {
      console.warn("fetchFileBlobViaProxy failed:", err);
      return { error: err };
    }
  };

  const handleView = async (row) => {
    setMessage(null);
    const rawUrl = row.document_url || row.file_url || row.file_path || row.document_path || row.fileUrl || null;
    const resolved = resolveFileUrl(rawUrl);

    if (resolved) {
      try {
        window.open(resolved, "_blank", "noopener noreferrer");
        return;
      } catch (err) {
        console.warn("window.open failed, falling back to proxy:", err);
      }
    }

    const proxyMaybe = await fetchFileBlobViaProxy(rawUrl);
    if (proxyMaybe && !proxyMaybe.error) {
      const mime = proxyMaybe.blob.type || guessMimeFromName(proxyMaybe.filename);
      if (mime.startsWith("image/")) {
        setPreview({ open: true, url: proxyMaybe.blobUrl, type: "image" });
        return;
      } else if (mime === "application/pdf" || (proxyMaybe.filename || "").toLowerCase().endsWith(".pdf")) {
        setPreview({ open: true, url: proxyMaybe.blobUrl, type: "pdf" });
        return;
      } else {
        setPreview({ open: true, url: "", type: "unsupported" });
        return;
      }
    }

    setMessage({
      type: "danger",
      text:
        "Unable to open preview. If the file is on S3 (presigned URL), it should open in a new tab. If it does not, implement a server-side proxy `/downloadDocument` to stream files.",
    });
  };

  const handleDownloadSingle = async (row) => {
    setMessage(null);
    const rawUrl = row.document_url || row.file_url || row.file_path || row.document_path || row.fileUrl || null;
    const resolved = resolveFileUrl(rawUrl);

    if (resolved) {
      try {
        const a = document.createElement("a");
        a.href = resolved;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        document.body.appendChild(a);
        a.click();
        a.remove();
        return;
      } catch (err) {
        console.warn("anchor download failed, falling back to proxy:", err);
        
      }
    }

    const proxyMaybe = await fetchFileBlobViaProxy(rawUrl);
    if (proxyMaybe && !proxyMaybe.error) {
      saveAs(proxyMaybe.blob, proxyMaybe.filename);
      return;
    }

    setMessage({
      type: "danger",
      text:
        "Download failed. For cross-origin files you can either open the presigned URL directly or implement a server-side proxy `/downloadDocument` to stream files to the browser.",
    });
    console.error("Download failed for row:", row);
  };

  const guessMimeFromName = (name) => {
    const n = (name || "").toLowerCase();
    if (n.endsWith(".pdf")) return "application/pdf";
    if (n.match(/\.(jpg|jpeg|png|gif|bmp)$/)) return "image/png";
    return "application/octet-stream";
  };

  const handleDownloadAllAsZip = async () => {
    if (!allRows.length) {
      setMessage({ type: "danger", text: "No files to download." });
      return;
    }
    setMessage(null);
    try {
      const zip = new JSZip();
      let added = 0;
      for (const r of allRows) {
        const rawUrl = r.document_url || r.file_url || r.file_path || r.document_path || r.fileUrl || null;
        const resolved = resolveFileUrl(rawUrl);
        
        let maybe = await fetchFileBlobDirect(rawUrl);
        if (maybe && maybe.error) {
          maybe = await fetchFileBlobViaProxy(rawUrl);
        }
        if (maybe && !maybe.error && maybe.blob) {
          zip.file(maybe.filename, maybe.blob);
          added++;
        }
      }
      if (added === 0) {
        setMessage({ type: "danger", text: "No downloadable files found or all downloads failed." });
        return;
      }
      const blob = await zip.generateAsync({ type: "blob" });
      saveAs(blob, `documents-${Date.now()}.zip`);
    } catch (err) {
      console.error("zip error", err);
      setMessage({ type: "danger", text: "Failed to create ZIP." });
    }
  };

  const handleRefresh = () => {
    setFilters({ major_head: "", minor_head: "", tagsText: "", from_date: "", to_date: "", searchText: "" });
    fetchDocsAll();
  };

  const onSearchSubmit = (e) => {
    e?.preventDefault();
    fetchDocsAll();
  };

  const totalPages = Math.max(1, Math.ceil(allRows.length / PAGE_SIZE));
  const gotoPage = (p) => {
    const page = Math.max(1, Math.min(p, totalPages));
    setCurrentPage(page);
    const start = (page - 1) * PAGE_SIZE;
    setPageRows(allRows.slice(start, start + PAGE_SIZE));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="container my-4">
      <div className="card shadow-sm">
        <div className="card-body">

          <div className="row mb-3">
            <div className="col-12">
              <h4 className="mb-0">Search Documents</h4>
            </div>
          </div>

          <form onSubmit={onSearchSubmit} className="row g-2 align-items-end">
            <div className="col-auto">
              <label className="form-label small mb-1">Category</label>
              <select className="form-select form-select-sm" value={filters.major_head} onChange={(e) => setFilters({...filters, major_head: e.target.value})}>
                <option value="">All</option>
                <option value="Personal">Personal</option>
                <option value="Professional">Professional</option>
              </select>
            </div>

            <div className="col-auto">
              <label className="form-label small mb-1">Name/Department</label>
              <input className="form-control form-control-sm" placeholder="Name/Dept" value={filters.minor_head} onChange={(e) => setFilters({...filters, minor_head: e.target.value})} />
            </div>

            <div className="col-auto" style={{ minWidth: 220 }}>
              <label className="form-label small mb-1">Tags</label>
              <input className="form-control form-control-sm" placeholder="invoice, RMC" value={filters.tagsText} onChange={(e) => setFilters({...filters, tagsText: e.target.value})} />
            </div>

            <div className="col-auto">
              <label className="form-label small mb-1">From</label>
              <input type="date" className="form-control form-control-sm" value={filters.from_date} onChange={(e) => setFilters({...filters, from_date: e.target.value})} />
            </div>

            <div className="col-auto">
              <label className="form-label small mb-1">To</label>
              <input type="date" className="form-control form-control-sm" value={filters.to_date} onChange={(e) => setFilters({...filters, to_date: e.target.value})} />
            </div>

            <div className="col-auto" style={{ minWidth: 200 }}>
              <label className="form-label small mb-1">Search</label>
              <input className="form-control form-control-sm" placeholder="free text" value={filters.searchText} onChange={(e)=>setFilters({...filters, searchText: e.target.value})} />
            </div>
          </form>

          <div className="row mt-3">
            <div className="col-12 d-flex justify-content-end gap-2">
              <button className="btn btn-sm btn-primary" onClick={onSearchSubmit}>Search</button>
              <button className="btn btn-sm btn-outline-secondary" onClick={handleRefresh}>Refresh</button>
            </div>
          </div>

          {message && <div className={`alert alert-${message.type} mt-3`}>{message.text}</div>}

          <div className="table-responsive mt-3">
            <table className="table table-striped table-sm">
              <thead>
                <tr>
                  <th style={{width:40}}>#</th>
                  <th>Date</th>
                  <th>Major</th>
                  <th>Minor</th>
                  <th>Remarks</th>
                  <th>Tags</th>
                  <th>Uploaded By</th>
                  <th style={{ minWidth: 180 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="8" className="text-center py-4">Loading...</td></tr>
                ) : pageRows.length === 0 ? (
                  <tr><td colSpan="8" className="text-center py-4">No documents found.</td></tr>
                ) : pageRows.map((r, i) => {
                  const date = r.document_date || r.documentDate || r.created_at || "";
                  const tags = r.tags || r.tag || [];
                  const tagText = Array.isArray(tags) ? tags.map(t => t.tag_name || t.label || t).join(", ") : String(tags);

                  return (
                    <tr key={i}>
                      <td>{(currentPage - 1) * PAGE_SIZE + i + 1}</td>
                      <td style={{ whiteSpace: "nowrap" }}>{date}</td>
                      <td>{r.major_head || r.major || ""}</td>
                      <td>{r.minor_head || r.minor || r.department || ""}</td>
                      <td style={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis" }}>{r.document_remarks || r.remarks || ""}</td>
                      <td style={{ maxWidth: 160 }}>{tagText}</td>
                      <td>{r.user_id || r.uploaded_by || ""}</td>
                      <td>
                        <div className="btn-group" role="group">
                          <button className="btn btn-sm btn-outline-dark" onClick={() => handleView(r)} title="View">
                            View
                          </button>
                          <button className="btn btn-sm btn-outline-success" onClick={() => handleDownloadSingle(r)} title="Download">
                            Download
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="d-flex justify-content-end align-items-center mt-3">
            <nav>
              <ul className="pagination pagination-sm mb-0">
                <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                  <button className="page-link" onClick={() => gotoPage(currentPage - 1)}>Previous</button>
                </li>

                {Array.from({ length: totalPages }).map((_, idx) => {
                  const p = idx + 1;
                  const show = Math.abs(p - currentPage) <= 2 || p === 1 || p === totalPages;
                  if (!show) {
                    if (p === currentPage - 3 || p === currentPage + 3) {
                      return (<li key={`ell-${p}`} className="page-item disabled"><span className="page-link">...</span></li>);
                    }
                    return null;
                  }
                  return (
                    <li key={p} className={`page-item ${p === currentPage ? "active" : ""}`}>
                      <button className="page-link" onClick={() => gotoPage(p)}>{p}</button>
                    </li>
                  );
                })}

                <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                  <button className="page-link" onClick={() => gotoPage(currentPage + 1)}>Next</button>
                </li>
              </ul>
            </nav>
          </div>

        </div>
      </div>

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
