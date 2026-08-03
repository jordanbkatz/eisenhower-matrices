import { useState, useEffect } from "react";
import type { MatrixDoc } from "@/lib/eisenhower-storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { X, Settings, Trash2, Save } from "lucide-react";

type Props = {
  matrix: MatrixDoc | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, description: string) => void;
  onDelete?: () => void;
};

export function EditMatrixModal({
  matrix,
  isOpen,
  onClose,
  onSave,
  onDelete,
}: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  useEffect(() => {
    if (matrix && isOpen) {
      setName(matrix.name || "");
      setDescription(matrix.description || "");
      setShowConfirmDelete(false);
    }
  }, [matrix, isOpen]);

  if (!isOpen || !matrix) return null;

  const handleClose = () => {
    setShowConfirmDelete(false);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(name.trim(), description.trim());
    handleClose();
  };

  const handleDeleteClick = () => {
    if (onDelete) {
      onDelete();
      handleClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-2xl relative">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
            <Settings className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Edit Matrix Settings</h2>
            <p className="text-xs text-muted-foreground">
              Update name, description, or delete matrix
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="matrix-name" className="text-xs">
              Matrix Name
            </Label>
            <Input
              id="matrix-name"
              type="text"
              placeholder="e.g. Q3 Sprint Goals"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="matrix-desc" className="text-xs">
              Description (Optional)
            </Label>
            <Textarea
              id="matrix-desc"
              rows={3}
              placeholder="Brief description or purpose of this matrix..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="resize-none text-xs"
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border">
            {onDelete && !showConfirmDelete && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowConfirmDelete(true)}
                className="text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                Delete Matrix
              </Button>
            )}

            {showConfirmDelete && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-destructive font-semibold">Confirm Delete?</span>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  className="h-7 text-xs px-2.5"
                  onClick={handleDeleteClick}
                >
                  Yes, Delete
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowConfirmDelete(false)}
                  title="Cancel Delete"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            <div className="flex gap-2 ml-auto">
              <Button type="button" variant="outline" size="sm" onClick={handleClose} className="text-xs">
                Cancel
              </Button>
              <Button type="submit" size="sm" className="text-xs">
                <Save className="h-3.5 w-3.5 mr-1.5" />
                Save Changes
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
