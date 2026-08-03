import { useState } from "react";
import type { MatrixDoc } from "@/lib/eisenhower-storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Grid3X3,
  Plus,
  Share2,
  Copy,
  Check,
  ChevronDown,
  LayoutDashboard,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Props = {
  matrices: MatrixDoc[];
  activeMatrixId: string | null;
  activeMatrixName: string;
  onSelectMatrix: (id: string | null) => void;
  onCreateMatrix: (name: string) => void;
  onOpenShareModal: () => void;
  onCopyMatrix: (matrixId: string) => void;
  isGuest: boolean;
};

export function MatrixSelector({
  matrices,
  activeMatrixId,
  activeMatrixName,
  onSelectMatrix,
  onCreateMatrix,
  onOpenShareModal,
  onCopyMatrix,
  isGuest,
}: Props) {
  const [isCreating, setIsCreating] = useState(false);
  const [newMatrixName, setNewMatrixName] = useState("");

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMatrixName.trim()) return;
    onCreateMatrix(newMatrixName.trim());
    setNewMatrixName("");
    setIsCreating(false);
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="flex items-center gap-2 max-w-[200px] sm:max-w-[260px] truncate bg-secondary/30 border-border hover:bg-secondary/60"
          >
            <Grid3X3 className="h-4 w-4 shrink-0 text-primary" />
            <span className="truncate text-xs font-semibold">
              {activeMatrixName}
            </span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-50 ml-auto" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel className="text-xs">Your Matrices</DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => onSelectMatrix(null)}
            className="text-xs font-medium cursor-pointer flex items-center gap-2"
          >
            <LayoutDashboard className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Matrices Dashboard</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {isGuest ? (
            <DropdownMenuItem className="text-xs italic text-muted-foreground">
              Guest Matrix (Local Storage)
            </DropdownMenuItem>
          ) : matrices.length === 0 ? (
            <DropdownMenuItem className="text-xs text-muted-foreground italic">
              No matrices yet
            </DropdownMenuItem>
          ) : (
            matrices.map((m) => (
              <DropdownMenuItem
                key={m.id}
                onClick={() => onSelectMatrix(m.id)}
                className="flex items-center justify-between text-xs cursor-pointer"
              >
                <div className="flex items-center gap-2 truncate">
                  <Grid3X3 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate">{m.name}</span>
                </div>
                {m.id === activeMatrixId && (
                  <Check className="h-3.5 w-3.5 text-primary shrink-0 ml-2" />
                )}
              </DropdownMenuItem>
            ))
          )}

          {!isGuest && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setIsCreating(true)}
                className="text-xs text-primary font-medium cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5 mr-2" />
                Create New Matrix
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {isCreating && (
        <form onSubmit={handleCreateSubmit} className="flex items-center gap-1.5 animate-in fade-in">
          <Input
            type="text"
            placeholder="Matrix name..."
            className="h-8 text-xs w-36 sm:w-44"
            value={newMatrixName}
            onChange={(e) => setNewMatrixName(e.target.value)}
            autoFocus
          />
          <Button type="submit" size="sm" className="h-8 text-xs px-2.5">
            Save
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 text-xs px-2"
            onClick={() => setIsCreating(false)}
          >
            Cancel
          </Button>
        </form>
      )}

      {!isGuest && activeMatrixId && (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onCopyMatrix(activeMatrixId)}
            className="h-8 text-xs gap-1.5 border-border hover:bg-secondary/60"
            title="Make a Copy of this Matrix"
          >
            <Copy className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="hidden sm:inline">Copy</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onOpenShareModal}
            className="h-8 text-xs gap-1.5 border-border hover:bg-secondary/60"
          >
            <Share2 className="h-3.5 w-3.5 text-primary" />
            <span className="hidden sm:inline">Share</span>
          </Button>
        </>
      )}
    </div>
  );
}
