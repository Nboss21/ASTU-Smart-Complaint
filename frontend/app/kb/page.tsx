"use client";

import { FormEvent, useEffect, useState } from "react";
import { api } from "../../lib/api";
import { useAuthStore } from "../../lib/authStore";

interface KbDoc {
  _id: string;
  title: string;
  sourceType: string;
  category?: string;
  tags?: string[];
}

export default function KnowledgeBasePage() {
  const { accessToken, hydrateFromStorage } = useAuthStore();
  const [docs, setDocs] = useState<KbDoc[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [sourceType, setSourceType] = useState("faq");
  const [category, setCategory] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [includeComplaintData, setIncludeComplaintData] = useState(true);
  const [includeResolvedComplaints, setIncludeResolvedComplaints] =
    useState(false);

  useEffect(() => {
    hydrateFromStorage();
  }, [hydrateFromStorage]);

  const loadDocs = () => {
    if (!accessToken) return;
    const headers = { Authorization: `Bearer ${accessToken}` };
    api
      .get<KbDoc[]>("/api/kb/documents", { headers })
      .then((r) => setDocs(r.data))
      .catch(() => {});
  };

  useEffect(() => {
    loadDocs();
  }, [accessToken]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem("astu_kb_search_config");
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as {
        includeComplaintData: boolean;
        includeResolvedComplaints: boolean;
      };
      setIncludeComplaintData(parsed.includeComplaintData);
      setIncludeResolvedComplaints(parsed.includeResolvedComplaints);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const payload = {
      includeComplaintData,
      includeResolvedComplaints,
    };
    localStorage.setItem("astu_kb_search_config", JSON.stringify(payload));
  }, [includeComplaintData, includeResolvedComplaints]);

  const createDoc = async (e: FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    const headers = { Authorization: `Bearer ${accessToken}` };
    await api.post(
      "/api/kb/documents",
      { title, content, sourceType, category },
      { headers },
    );
    setTitle("");
    setContent("");
    setCategory("");
    loadDocs();
  };

  const removeDoc = async (id: string) => {
    if (!accessToken) return;
    const headers = { Authorization: `Bearer ${accessToken}` };
    await api.delete(`/api/kb/documents/${id}`, { headers });
    loadDocs();
  };

  const reindex = async () => {
    if (!accessToken) return;
    const headers = { Authorization: `Bearer ${accessToken}` };
    await api.post("/api/kb/reindex", {}, { headers });
  };

  const uploadDocument = async (e: FormEvent) => {
    e.preventDefault();
    if (!accessToken || !uploadFile) return;
    setUploadError(null);
    setUploading(true);
    const headers = { Authorization: `Bearer ${accessToken}` };
    const formData = new FormData();
    formData.append("file", uploadFile);
    if (title) formData.append("title", title);
    if (sourceType) formData.append("sourceType", sourceType);
    if (category) formData.append("category", category);
    try {
      await api.post("/api/kb/documents/upload", formData, {
        headers: { ...headers, "Content-Type": "multipart/form-data" },
      });
      setUploadFile(null);
      setTitle("");
      setContent("");
      setCategory("");
      loadDocs();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Upload failed. Please check the file type and try again.";
      setUploadError(msg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex w-full flex-col gap-6 md:flex-row">
      <section className="card-glass w-full p-6 md:w-2/3">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-slate-50">
            Knowledge base
          </h1>
          <button className="secondary" onClick={reindex}>
            Rebuild embeddings
          </button>
        </div>
        <p className="mt-1 text-xs text-slate-400">
          Curate FAQs, policies, and complaint templates that fuel the AI
          assistant.
        </p>
        <p className="mt-1 text-[11px] text-slate-500">
          Use this view as your FAQ management console. Documents marked as
          FAQs, policies, or complaint templates are all included in hybrid
          search.
        </p>
        <div className="mt-4 space-y-2 max-h-[420px] overflow-y-auto pr-2 text-xs">
          {docs.map((d) => (
            <div
              key={d._id}
              className="flex items-start justify-between rounded-xl border border-slate-700/70 bg-slate-900/70 px-3 py-2"
            >
              <div>
                <div className="text-sm font-semibold text-slate-100">
                  {d.title}
                </div>
                <div className="mt-0.5 text-[11px] text-slate-400">
                  {d.sourceType} • {d.category || "General"}
                </div>
              </div>
              <button
                className="secondary px-2 py-1"
                onClick={() => removeDoc(d._id)}
              >
                Remove
              </button>
            </div>
          ))}
          {!docs.length && (
            <div className="text-xs text-slate-500">
              No documents yet. Add a few key policies and FAQs to get the
              assistant started.
            </div>
          )}
        </div>
      </section>
      <section className="card-glass w-full p-6 md:w-1/3">
        <h2 className="text-sm font-semibold text-slate-50">New document</h2>
        <form onSubmit={createDoc} className="mt-3 space-y-3 text-xs">
          <div>
            <label className="text-[11px] text-slate-300">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Exam Late Arrival Policy"
            />
          </div>
          <div>
            <label className="text-[11px] text-slate-300">Type</label>
            <select
              value={sourceType}
              onChange={(e) => setSourceType(e.target.value)}
            >
              <option value="faq">FAQ</option>
              <option value="policy">Policy</option>
              <option value="complaint_template">Complaint template</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] text-slate-300">Category</label>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Exams, Complaints, Facilities…"
            />
          </div>
          <div>
            <label className="text-[11px] text-slate-300">Content</label>
            <textarea
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste the policy text or FAQ answer here…"
            />
          </div>
          <button className="primary w-full">Save & index</button>
        </form>
        <div className="mt-5 border-t border-slate-800/70 pt-4 text-xs">
          <h3 className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Upload file to knowledge base
          </h3>
          <p className="mt-1 text-[11px] text-slate-500">
            Upload PDFs, Word documents, or text files. The assistant will index
            their contents and use them when answering questions.
          </p>
          {uploadError && (
            <p className="mt-2 text-[11px] text-ember-400">{uploadError}</p>
          )}
          <form onSubmit={uploadDocument} className="mt-3 space-y-3">
            <div>
              <label className="text-[11px] text-slate-300">File</label>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              />
            </div>
            <button
              className="primary w-full"
              disabled={uploading || !uploadFile}
            >
              {uploading ? "Uploading…" : "Upload & index"}
            </button>
          </form>
        </div>
        <div className="mt-5 space-y-3 text-xs">
          <h3 className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Complaint data integration
          </h3>
          <p className="text-[11px] text-slate-500">
            These switches control which complaint data is eligible for
            retrieval. Implementation is backed by search configuration on the
            API.
          </p>
          <label className="flex items-center gap-2 text-[11px] text-slate-200">
            <input
              type="checkbox"
              checked={includeComplaintData}
              onChange={(e) => setIncludeComplaintData(e.target.checked)}
            />
            Include complaint fields in hybrid search
          </label>
          <label className="flex items-center gap-2 text-[11px] text-slate-200">
            <input
              type="checkbox"
              checked={includeResolvedComplaints}
              onChange={(e) => setIncludeResolvedComplaints(e.target.checked)}
            />
            Include resolved complaints in retrieval
          </label>
          <div className="mt-3 rounded-xl border border-slate-800/70 bg-slate-950/70 p-3">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Search analytics
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              A dedicated search analytics dashboard can plug into this view
              using chatbot analytics endpoints (e.g. popular queries, top
              dissatisfied topics). Hook it up to your /api/chatbot analytics
              when ready.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
