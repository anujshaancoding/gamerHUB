"use client";

import { useEffect, useState } from "react";
import { Crosshair, X, Info } from "lucide-react";
import { Button } from "@/components/ui";
import { getSensitivity, setSensitivity, GAME_CONVERTERS, onSensitivityChange } from "./sensitivity";

export function SensitivityBar() {
  const [sens, setSens] = useState(1.0);
  const [showConverter, setShowConverter] = useState(false);
  const [converterId, setConverterId] = useState<string>("valorant");
  const [gameSens, setGameSens] = useState<string>("");

  useEffect(() => {
    setSens(getSensitivity());
    return onSensitivityChange(() => setSens(getSensitivity()));
  }, []);

  const updateSens = (n: number) => {
    setSens(n);
    setSensitivity(n);
  };

  const converter = GAME_CONVERTERS.find((c) => c.id === converterId);

  const handleConvert = () => {
    if (!converter) return;
    const parsed = parseFloat(gameSens);
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    const result = converter.toGGLobby(parsed);
    updateSens(result);
    setShowConverter(false);
  };

  return (
    <div className="rounded-xl border border-border bg-surface p-3 sm:p-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2 shrink-0">
          <Crosshair className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-text">Sensitivity</span>
        </div>

        <div className="flex-1 flex items-center gap-3">
          <input
            type="range"
            min={0.1}
            max={3.0}
            step={0.01}
            value={sens}
            onChange={(e) => updateSens(parseFloat(e.target.value))}
            className="flex-1 accent-primary"
            aria-label="ggLobby sensitivity"
          />
          <input
            type="number"
            min={0.05}
            max={10}
            step={0.01}
            value={sens.toFixed(2)}
            onChange={(e) => {
              const n = parseFloat(e.target.value);
              if (Number.isFinite(n)) updateSens(n);
            }}
            className="w-20 bg-background border border-border rounded-md px-2 py-1 text-sm text-text tabular-nums"
          />
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowConverter((v) => !v)}
          className="shrink-0"
        >
          Match my game sens
        </Button>
      </div>

      {showConverter && (
        <div className="mt-3 pt-3 border-t border-border space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-text">Convert from a game</h4>
            <button
              onClick={() => setShowConverter(false)}
              className="text-text-muted hover:text-text"
              aria-label="Close converter"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {GAME_CONVERTERS.map((c) => (
              <button
                key={c.id}
                onClick={() => setConverterId(c.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                  converterId === c.id
                    ? "bg-primary/15 border-primary text-primary"
                    : "bg-surface-light border-border text-text-secondary hover:text-text"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {converter && (
            <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-end">
              <div className="flex-1">
                <label className="block text-xs text-text-muted mb-1">{converter.hint}</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={gameSens}
                  onChange={(e) => setGameSens(e.target.value)}
                  placeholder="e.g. 0.3"
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-text"
                />
              </div>
              <Button onClick={handleConvert} variant="primary" size="sm">
                Apply
              </Button>
            </div>
          )}

          <p className="text-xs text-text-muted flex items-start gap-1.5">
            <Info className="h-3 w-3 mt-0.5 shrink-0" />
            <span>
              Conversions assume 800 DPI and are a starting point — tune by feel.
              Currently: <span className="font-mono text-text">{sens.toFixed(2)}×</span>.
            </span>
          </p>
        </div>
      )}
    </div>
  );
}

export function SensitivityInlineHint({ locked }: { locked: boolean }) {
  const [sens, setSens] = useState(1.0);
  useEffect(() => {
    setSens(getSensitivity());
    return onSensitivityChange(() => setSens(getSensitivity()));
  }, []);

  return (
    <div className="mb-2 flex items-center gap-3 text-xs text-text-muted">
      <span className="inline-flex items-center gap-1">
        <Crosshair className="h-3 w-3" /> Sens: <span className="font-mono text-text">{sens.toFixed(2)}×</span>
      </span>
      <span className="text-text-dim">·</span>
      <span>{locked ? "Mouse locked — press Esc to unlock" : "Click arena to lock mouse for FPS-style aim"}</span>
    </div>
  );
}
