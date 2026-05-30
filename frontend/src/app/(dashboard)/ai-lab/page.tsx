"use client";
import { motion } from "framer-motion";
import { Upload, Sparkles, FileText, Wand2, Loader2, CheckCircle2, Plus } from "lucide-react";
import { useState } from "react";

const suggestions = [
  "Generate 20 cards from Algorithms Chapter 4",
  "Create fill-in-the-blank questions for Network Security",
  "Summarize System Design concepts into cards",
  "Make cloze deletions for Data Science formulas",
];

const generatedPreview = [
  { front: "What algorithm finds shortest paths from a single source?", back: "Dijkstra's Algorithm — O((V+E) log V) with min-heap", confidence: 95 },
  { front: "Define a greedy algorithm", back: "An approach that makes locally optimal choices at each step hoping for a global optimum", confidence: 88 },
  { front: "What is the master theorem used for?", back: "Solving recurrences of the form T(n) = aT(n/b) + f(n)", confidence: 92 },
];

export default function AILabPage() {
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    setTimeout(() => { setGenerating(false); setGenerated(true); }, 2000);
  };

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 style={{ color: "#111827", marginBottom: "4px", fontSize: "22px", fontWeight: 700 }}>AI Lab</h1>
        <p style={{ fontSize: "13px", color: "#9ca3af" }}>Generate flashcards automatically from text, PDFs, or prompts</p>
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* Input panel */}
        <div className="space-y-4">
          {/* Upload zone */}
          <div
            className="rounded-xl p-6 flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors duration-150"
            style={{ border: "2px dashed #d1fae5", background: "#f0fdf4", minHeight: "140px" }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.borderColor = "#1a3a2a";
              (e.currentTarget as HTMLElement).style.background = "#e8f0eb";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.borderColor = "#d1fae5";
              (e.currentTarget as HTMLElement).style.background = "#f0fdf4";
            }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#1a3a2a" }}>
              <Upload size={18} className="text-white" />
            </div>
            <div className="text-center">
              <p style={{ fontSize: "13.5px", fontWeight: 600, color: "#1a3a2a" }}>Drop a PDF or paste content</p>
              <p style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>Supports PDF, DOCX, TXT, or plain text</p>
            </div>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
              style={{ fontSize: "12px", fontWeight: 600, background: "#1a3a2a", color: "#fff" }}>
              <FileText size={12} /> Browse Files
            </button>
          </div>

          {/* Prompt input */}
          <div>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>
              Or describe what to generate
            </label>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="e.g. Generate 15 cards on binary trees covering insertion, deletion, and traversal..."
              className="w-full p-3 rounded-xl outline-none resize-none"
              style={{ border: "1px solid #e5e7eb", fontSize: "13px", color: "#374151", lineHeight: 1.6, minHeight: "100px", background: "#fff" }}
              onFocus={e => (e.currentTarget.style.borderColor = "#1a3a2a")}
              onBlur={e => (e.currentTarget.style.borderColor = "#e5e7eb")}
            />
          </div>

          {/* Suggestions */}
          <div>
            <p style={{ fontSize: "11px", fontWeight: 600, color: "#9ca3af", marginBottom: "8px", letterSpacing: "0.05em" }}>QUICK PROMPTS</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map(s => (
                <button
                  key={s}
                  onClick={() => setPrompt(s)}
                  className="px-3 py-1.5 rounded-lg transition-colors duration-150"
                  style={{ fontSize: "11.5px", fontWeight: 500, background: "#f3f4f6", color: "#6b7280", border: "1px solid #e5e7eb" }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.background = "#e8f0eb";
                    (e.currentTarget as HTMLElement).style.color = "#1a3a2a";
                    (e.currentTarget as HTMLElement).style.borderColor = "#1a3a2a";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.background = "#f3f4f6";
                    (e.currentTarget as HTMLElement).style.color = "#6b7280";
                    (e.currentTarget as HTMLElement).style.borderColor = "#e5e7eb";
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleGenerate}
            disabled={generating || !prompt.trim()}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white"
            style={{ fontSize: "13.5px", fontWeight: 600,
              background: prompt.trim() ? "#1a3a2a" : "#d1d5db",
              cursor: prompt.trim() ? "pointer" : "not-allowed" }}
          >
            {generating ? <><Loader2 size={15} className="animate-spin" /> Generating...</> : <><Wand2 size={15} /> Generate Cards</>}
          </motion.button>
        </div>

        {/* Preview panel */}
        <div>
          {generated ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={15} style={{ color: "#16a34a" }} />
                  <span style={{ fontSize: "13.5px", fontWeight: 600, color: "#111827" }}>Generated 3 cards</span>
                </div>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                  style={{ fontSize: "12px", fontWeight: 600, background: "#1a3a2a", color: "#fff" }}>
                  <Plus size={13} /> Add to Deck
                </button>
              </div>
              {generatedPreview.map((card, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }} className="bg-white rounded-xl p-4"
                  style={{ border: "1px solid #e5e7eb" }}>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <p style={{ fontSize: "13px", fontWeight: 600, color: "#111827" }}>{card.front}</p>
                    <span className="flex-shrink-0 px-2 py-0.5 rounded-full"
                      style={{ fontSize: "10px", fontWeight: 700, background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" }}>
                      {card.confidence}%
                    </span>
                  </div>
                  <p style={{ fontSize: "12.5px", color: "#6b7280", lineHeight: 1.5 }}>{card.back}</p>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="h-full rounded-xl flex flex-col items-center justify-center gap-3"
              style={{ border: "1px dashed #e5e7eb", background: "#fafafa", minHeight: "400px" }}>
              <Sparkles size={32} style={{ color: "#d1d5db" }} />
              <p style={{ fontSize: "13px", color: "#9ca3af", textAlign: "center", maxWidth: "200px", lineHeight: 1.6 }}>
                Your generated cards will appear here
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
