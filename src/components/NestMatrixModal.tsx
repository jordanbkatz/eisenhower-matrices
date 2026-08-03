import { useState } from "react";
import type { MatrixDoc } from "@/lib/eisenhower-storage";
import { Button } from "@/components/ui/button";
import { X, Grid3X3, Copy, Link, Check, Sparkles } from "lucide-react";

type Props = {
  matrices: MatrixDoc[];
  isOpen: boolean;
  onClose: () => void;
  onSelectNest: (targetMatrixId: string, mode: "link" | "copy") => void;
};

export function EmbedMatrixModal({ matrices, isOpen, onClose, onSelectNest }: Props) {
  const [selectedId, setSelectedId] = useState<string>("");
  const [nestMode, setNestMode] = useState<"link" | "copy">("link");

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!selectedId) return;
    onSelectNest(selectedId, nestMode);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
            <Grid3X3 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Embed Existing Matrix</h2>
            <p className="text-xs text-muted-foreground">
              Embed a matrix from your library directly into this matrix layer
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Select Matrix to Embed
            </label>
            {matrices.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-3 text-center border border-dashed border-border rounded-xl">
                No other matrices available to embed.
              </p>
            ) : (
              <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
                {matrices.map((m) => {
                  const isSel = selectedId === m.id;
                  return (
                    <div
                      key={m.id}
                      onClick={() => setSelectedId(m.id)}
                      className={`p-2.5 rounded-xl border cursor-pointer transition flex items-center justify-between text-xs ${
                        isSel
                          ? "bg-primary/15 border-primary text-foreground"
                          : "bg-secondary/20 border-border hover:bg-secondary/50 text-muted-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Grid3X3 className="h-4 w-4 text-primary shrink-0" />
                        <span className="font-semibold truncate">{m.name}</span>
                      </div>
                      {isSel && <Check className="h-4 w-4 text-primary shrink-0" />}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Embedding Mode Selector: Direct Link vs Make a Copy */}
          <div className="space-y-1.5 pt-2 border-t border-border">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Embedding Mode
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setNestMode("link")}
                className={`p-3 rounded-xl border text-left space-y-1 transition ${
                  nestMode === "link"
                    ? "bg-primary/10 border-primary text-foreground"
                    : "bg-secondary/20 border-border hover:bg-secondary/40 text-muted-foreground"
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <Link className="h-3.5 w-3.5 text-primary" />
                  <span>Direct Link</span>
                </div>
                <p className="text-[10px] text-muted-foreground leading-tight">
                  Links directly to the original live matrix. Changes sync in real-time.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setNestMode("copy")}
                className={`p-3 rounded-xl border text-left space-y-1 transition ${
                  nestMode === "copy"
                    ? "bg-primary/10 border-primary text-foreground"
                    : "bg-secondary/20 border-border hover:bg-secondary/40 text-muted-foreground"
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <Copy className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Make a Copy</span>
                </div>
                <p className="text-[10px] text-muted-foreground leading-tight">
                  Creates an independent snapshot copy and embeds the new copy.
                </p>
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleConfirm}
              disabled={!selectedId}
              className="text-xs"
            >
              <Sparkles className="h-3.5 w-3.5 mr-1" />
              Embed Matrix
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
