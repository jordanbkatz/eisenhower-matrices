import { useState } from "react";
import type { MatrixDoc } from "@/lib/eisenhower-storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Grid3X3,
  Plus,
  Copy,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  Settings,
  UserPlus,
  Calendar,
  X,
  User,
} from "lucide-react";

type Props = {
  matrices: MatrixDoc[];
  activeMatrixId: string | null;
  currentUserId?: string | null;
  onSelectMatrix: (id: string) => void;
  onCreateMatrix: (name: string, description?: string) => void;
  onCopyMatrix: (matrixId: string) => void;
  onShareMatrix: (matrix: MatrixDoc) => void;
  onEditMatrix: (matrix: MatrixDoc) => void;
  onDeleteMatrix: (matrixId: string) => void;
  onScheduleMatrix?: (matrix: MatrixDoc) => void;
  isGuest: boolean;
};

export function Dashboard({
  matrices,
  activeMatrixId,
  currentUserId,
  onSelectMatrix,
  onCreateMatrix,
  onCopyMatrix,
  onShareMatrix,
  onEditMatrix,
  onDeleteMatrix,
  onScheduleMatrix,
  isGuest,
}: Props) {
  const [isCreating, setIsCreating] = useState(false);
  const [newMatrixName, setNewMatrixName] = useState("");
  const [newMatrixDesc, setNewMatrixDesc] = useState("");

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMatrixName.trim()) return;
    onCreateMatrix(newMatrixName.trim(), newMatrixDesc.trim());
    setNewMatrixName("");
    setNewMatrixDesc("");
    setIsCreating(false);
  };

  // Categorize matrices into "My Matrices" and "Shared with Me"
  const myMatrices = matrices.filter((m) => {
    if (m.isNestedOnly) return false;
    if (isGuest) return true;
    return m.ownerId === currentUserId;
  });

  const sharedMatrices = matrices.filter((m) => {
    if (m.isNestedOnly) return false;
    if (isGuest) return false;
    return m.ownerId !== currentUserId;
  });

  const renderMatrixCard = (matrix: MatrixDoc, isSharedSection: boolean) => {
    const taskCount = matrix.tasks?.length || 0;
    const completedCount = matrix.completedTasks?.length || 0;

    return (
      <div
        key={matrix.id}
        className="group relative flex flex-col justify-between p-5 rounded-2xl bg-card/60 border border-border hover:border-primary/50 transition-all duration-200 shadow-md hover:shadow-xl hover:shadow-primary/5"
      >
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary shrink-0 group-hover:scale-105 transition-transform">
                <Grid3X3 className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base text-foreground truncate">
                {matrix.name}
              </h3>
            </div>

            {isSharedSection && (
              <span className="shrink-0 text-[10px] uppercase font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Users className="h-3 w-3" />
                Shared
              </span>
            )}
          </div>

          {matrix.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {matrix.description}
            </p>
          )}

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span>{taskCount} Active</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <span>{completedCount} Done</span>
            </div>
          </div>

          {isSharedSection && (
            <div className="flex items-center gap-1.5 text-xs text-cyan-400 font-medium pt-1 border-t border-cyan-500/10">
              <User className="h-3.5 w-3.5 shrink-0" />
              <span>Shared by <strong className="font-semibold text-foreground/90">{matrix.ownerEmail || "Owner"}</strong></span>
            </div>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-between gap-2">
          <Button
            size="sm"
            onClick={() => onSelectMatrix(matrix.id)}
            className="flex-1 text-xs gap-1.5 font-semibold"
          >
            View Matrix
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => onEditMatrix(matrix)}
            className="text-xs px-2.5 border-border hover:bg-secondary/80"
            title="Edit Matrix Settings"
          >
            <Settings className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => onCopyMatrix(matrix.id)}
            className="text-xs px-2.5 border-border hover:bg-secondary/80"
            title="Make a Copy"
          >
            <Copy className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>

          {!isGuest && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onShareMatrix(matrix)}
              className="text-xs px-2.5 border-border hover:bg-secondary/80 text-primary"
              title="Invite Collaborator"
            >
              <UserPlus className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Dashboard Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-card/60 border border-border backdrop-blur-xl shadow-xl">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Matrices Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Organize tasks, copy templates, and collaborate with team members.
          </p>
        </div>

        <Button
          onClick={() => setIsCreating(true)}
          className="shrink-0 gap-2 font-semibold shadow-lg shadow-primary/20"
        >
          <Plus className="h-4 w-4" />
          Create New Matrix
        </Button>
      </div>

      {/* Importance vs Urgency Educational Guide */}
      <div className="p-6 rounded-2xl bg-card/40 border border-border/80 shadow-md space-y-4">
        <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-wider">
          <Sparkles className="h-4 w-4" />
          <span>Understanding Importance vs Urgency</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-emerald-400 text-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span>Importance (Value Generated)</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Refers to the long-term value, impact, and goal alignment generated when/if the task is completed. High importance tasks move the needle on key outcomes.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-amber-400 text-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span>Urgency (Consequence of Delay)</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Refers to the negative value or penalty incurred if the task is not completed soon. High urgency tasks demand immediate time and attention.
            </p>
          </div>
        </div>
      </div>

      {/* Popup Overlay for Create New Matrix */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-2xl relative">
            <button
              onClick={() => setIsCreating(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
                <Grid3X3 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Create New Matrix</h2>
                <p className="text-xs text-muted-foreground">
                  Build a fresh Eisenhower matrix to organize your tasks
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  New Matrix Name
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Q3 Sprint Goals, Personal Project..."
                  value={newMatrixName}
                  onChange={(e) => setNewMatrixName(e.target.value)}
                  autoFocus
                  className="text-sm"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Description (Optional)
                </label>
                <Textarea
                  rows={2}
                  placeholder="Brief description or purpose..."
                  value={newMatrixDesc}
                  onChange={(e) => setNewMatrixDesc(e.target.value)}
                  className="text-xs resize-none"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => setIsCreating(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="text-xs">
                  Create Matrix
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Categorized Matrices Display: My Matrices vs Shared with Me */}
      {matrices.length === 0 ? (
        <div className="p-12 rounded-2xl bg-card/30 border border-dashed border-border text-center space-y-4">
          <Sparkles className="h-12 w-12 text-muted-foreground mx-auto" />
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-foreground">No matrices yet</h3>
            <p className="text-xs text-muted-foreground">
              Create your first Eisenhower Matrix to start prioritizing tasks!
            </p>
          </div>
          <Button onClick={() => setIsCreating(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Matrix
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Section 1: My Matrices */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-foreground font-extrabold text-lg border-b border-border pb-2">
              <User className="h-5 w-5 text-primary" />
              <h2>My Matrices ({myMatrices.length})</h2>
            </div>
            {myMatrices.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-2">
                You haven't created any personal matrices yet.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {myMatrices.map((m) => renderMatrixCard(m, false))}
              </div>
            )}
          </div>

          {/* Section 2: Shared with Me */}
          {!isGuest && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-foreground font-extrabold text-lg border-b border-border pb-2">
                <Users className="h-5 w-5 text-cyan-400" />
                <h2>Shared with Me ({sharedMatrices.length})</h2>
              </div>
              {sharedMatrices.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-2">
                  No matrices have been shared with you yet.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {sharedMatrices.map((m) => renderMatrixCard(m, true))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
