"use client";

import { motion } from "framer-motion";
import { Code2, Trash2, Info } from "lucide-react";

const MAX_CHARS = 5000;

const AVAILABLE_SELECTORS = [
  ".profile-custom-css .gaming-card-border",
  ".profile-custom-css .stat-card-gaming",
  ".profile-custom-css .player-card",
  ".profile-custom-css .profile-header",
  ".profile-custom-css .profile-tabs",
  ".profile-custom-css .badge-card",
  ".profile-custom-css .activity-card",
  ".profile-custom-css .media-card",
];

interface CustomCssEditorProps {
  value: string | null;
  onChange: (css: string | null) => void;
}

export function CustomCssEditor({ value, onChange }: CustomCssEditorProps) {
  const css = value ?? "";
  const charCount = css.length;
  const isOverLimit = charCount > MAX_CHARS;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-3"
    >
      {/* Editor */}
      <div className="relative">
        <textarea
          value={css}
          onChange={(e) => {
            const val = e.target.value;
            if (val.length <= MAX_CHARS) {
              onChange(val || null);
            }
          }}
          placeholder={`.profile-custom-css .gaming-card-border {\n  border-color: #9f7aea;\n  box-shadow: 0 0 20px rgba(159, 122, 234, 0.3);\n}`}
          spellCheck={false}
          className="w-full h-48 rounded-lg border border-border bg-black px-4 py-3 font-mono text-sm text-green-400 placeholder:text-text-dim/50 focus:border-primary focus:outline-none resize-y transition-colors leading-relaxed"
        />

        {/* Character counter */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1">
          <span
            className={`text-[10px] font-mono ${
              isOverLimit
                ? "text-error"
                : charCount > MAX_CHARS * 0.9
                  ? "text-warning"
                  : "text-text-dim"
            }`}
          >
            {charCount.toLocaleString()}/{MAX_CHARS.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Helper text */}
      <div className="flex items-start gap-2 rounded-lg border border-border/50 bg-surface-light/50 px-3 py-2">
        <Info className="w-4 h-4 text-text-dim shrink-0 mt-0.5" />
        <p className="text-xs text-text-muted leading-relaxed">
          Write custom CSS scoped to the{" "}
          <code className="text-xs font-mono text-primary bg-primary/10 px-1 rounded">
            .profile-custom-css
          </code>{" "}
          wrapper. Avoid{" "}
          <code className="text-xs font-mono text-error/80 bg-error/10 px-1 rounded">
            position:fixed
          </code>{" "}
          and high{" "}
          <code className="text-xs font-mono text-error/80 bg-error/10 px-1 rounded">
            z-index
          </code>{" "}
          values.
        </p>
      </div>

      {/* Available selectors */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <Code2 className="w-3.5 h-3.5 text-text-muted" />
          <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
            Available Selectors
          </span>
        </div>
        <div className="rounded-lg border border-border/50 bg-black/50 p-3 space-y-1">
          {AVAILABLE_SELECTORS.map((selector) => (
            <div key={selector} className="font-mono text-[11px] text-cyan-400/80">
              {selector}
            </div>
          ))}
        </div>
      </div>

      {/* Clear button */}
      {css && (
        <div className="pt-1">
          <button
            type="button"
            onClick={() => onChange(null)}
            className="flex items-center gap-1.5 rounded-lg border border-error/30 px-3 py-1.5 text-xs font-medium text-error hover:bg-error/10 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear CSS
          </button>
        </div>
      )}
    </motion.div>
  );
}
