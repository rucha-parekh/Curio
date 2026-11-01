// Reads text out of uploaded files in the browser. Nothing is uploaded to a server.
// PDF and Word readers load on demand from a pinned CDN version, only when someone uploads.
const LIBS = {
  pdf: "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js",
  pdfWorker: "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js",
  mammoth: "https://cdn.jsdelivr.net/npm/mammoth@1.8.0/mammoth.browser.min.js",
};

const loaded = {};
function loadScript(src) {
  if (!loaded[src]) {
    loaded[src] = new Promise((resolve, reject) => {
      const el = document.createElement("script");
      el.src = src;
      el.async = true;
      el.onload = resolve;
      el.onerror = () => reject(new Error("load_failed"));
      document.head.appendChild(el);
    });
  }
  return loaded[src];
}

export const ACCEPT = ".pdf,.docx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain";

export async function extractText(file) {
  const name = file.name.toLowerCase();
  if (name.endsWith(".txt") || name.endsWith(".md") || file.type === "text/plain") return file.text();
  if (name.endsWith(".docx")) {
    await loadScript(LIBS.mammoth);
    const { value } = await window.mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
    return value;
  }
  if (name.endsWith(".doc")) throw new Error("old_word");
  if (name.endsWith(".pdf") || file.type === "application/pdf") {
    await loadScript(LIBS.pdf);
    const pdfjs = window.pdfjsLib;
    pdfjs.GlobalWorkerOptions.workerSrc = LIBS.pdfWorker;
    const doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()), isEvalSupported: false }).promise;
    const pages = [];
    for (let i = 1; i <= Math.min(doc.numPages, 30); i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      pages.push(content.items.map((it) => it.str + (it.hasEOL ? "\n" : " ")).join(""));
    }
    return pages.join("\n\n");
  }
  throw new Error("unsupported");
}

export function fileErrorMessage(e) {
  const code = e?.message;
  if (code === "old_word") return "That's an old Word file (.doc). Save it as .docx and try again.";
  if (code === "unsupported") return "I can read PDF, Word (.docx) and text files.";
  if (code === "too_short") return "I couldn't find enough text in that file. If it's a scanned photo, try pasting the text instead.";
  if (code === "load_failed") return "The file reader didn't load. Check your internet, or paste the text instead.";
  return "Something went wrong reading that file. Try another file, or paste the text instead.";
}
