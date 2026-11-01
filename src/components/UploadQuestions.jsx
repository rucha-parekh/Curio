import { useRef, useState } from "react";
import { Button, courseById } from "./ui.jsx";
import { COURSES } from "../lib/seed.js";
import { extractText, ACCEPT, fileErrorMessage } from "../lib/fileText.js";
import { generateQuestions } from "../lib/ai.js";

/**
 * Upload a PDF / Word / text file (or paste text) and get real questions from it.
 * onReady({ title, courseId, questions, source, fileName })
 */
export default function UploadQuestions({ courseId: fixedCourse, onReady, cta = "Make my questions", compact = false }) {
  const [courseId, setCourseId] = useState(fixedCourse || COURSES[0].id);
  const [count, setCount] = useState(6);
  const [file, setFile] = useState(null);
  const [paste, setPaste] = useState("");
  const [mode, setMode] = useState("file");
  const [status, setStatus] = useState(null);
  const [error, setError] = useState("");
  const [drag, setDrag] = useState(false);
  const inputRef = useRef(null);

  async function run() {
    setError("");
    try {
      setStatus("Reading your file…");
      const text = mode === "file" ? await extractText(file) : paste;
      setStatus("Writing questions from it…");
      const r = await generateQuestions(text, { count, courseName: courseById(courseId)?.name });
      if (r.questions.length < 2) throw new Error("too_short");
      const base = (file?.name || "My notes").replace(/\.[a-z0-9]+$/i, "");
      onReady({ title: r.title || `Practice: ${base}`, courseId, questions: r.questions, source: r.source, fileName: file?.name });
    } catch (e) {
      setError(fileErrorMessage(e));
    } finally {
      setStatus(null);
    }
  }

  const ready = mode === "file" ? !!file : paste.trim().length > 80;

  return (
    <div className={compact ? "" : "rounded-[28px] bg-card p-5 sm:p-6"}>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="How to add your material">
        {[["file", "Upload a file"], ["paste", "Paste text"]].map(([id, label]) => (
          <button key={id} type="button" role="radio" aria-checked={mode === id} onClick={() => setMode(id)} className={`min-h-10 rounded-full px-4 text-sm font-bold ${mode === id ? "bg-brand text-on-brand" : "bg-soft"}`}>
            {label}
          </button>
        ))}
      </div>

      {mode === "file" ? (
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]);
          }}
          className={`mt-3 flex min-h-32 cursor-pointer flex-col items-center justify-center gap-1 rounded-3xl border-[3px] border-dashed p-5 text-center transition ${drag ? "border-lilac-2 bg-nudge-bg" : "border-line hover:border-lilac-2"}`}
        >
          <input ref={inputRef} type="file" accept={ACCEPT} className="sr-only" onChange={(e) => setFile(e.target.files[0] || null)} />
          <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true"><rect x="8" y="4" width="24" height="32" rx="6" fill="var(--butter)" /><path d="M14 16h12M14 22h12M14 28h7" stroke="#241f3a" strokeWidth="2.4" strokeLinecap="round" /></svg>
          {file ? <span className="font-bold">{file.name}</span> : <span className="font-bold">Drop a PDF or Word file here, or tap to choose</span>}
          <span className="text-sm text-ink-2">PDF, Word (.docx) or text. Your file stays on this device.</span>
        </label>
      ) : (
        <>
          <label htmlFor="paste-notes" className="sr-only">Paste your notes</label>
          <textarea id="paste-notes" rows={5} value={paste} onChange={(e) => setPaste(e.target.value)} placeholder="Paste your notes or a chapter here…" className="mt-3 w-full rounded-3xl border-2 border-line bg-card p-4 text-ink placeholder:text-ink-2" />
        </>
      )}

      <div className="mt-3 flex flex-wrap items-end gap-3">
        {!fixedCourse && (
          <label className="flex flex-col text-sm font-bold">
            Class
            <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className="mt-1 min-h-11 rounded-full border-2 border-line bg-card px-3 text-base text-ink">
              {COURSES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
        )}
        <label className="flex flex-col text-sm font-bold">
          Questions
          <select value={count} onChange={(e) => setCount(Number(e.target.value))} className="mt-1 min-h-11 rounded-full border-2 border-line bg-card px-3 text-base text-ink">
            {[5, 6, 8, 10].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <Button onClick={run} disabled={!ready || !!status}>{status || cta}</Button>
      </div>
      {error && <p role="alert" className="mt-3 rounded-2xl bg-nudge-bg p-3 font-bold text-nudge">{error}</p>}
    </div>
  );
}
