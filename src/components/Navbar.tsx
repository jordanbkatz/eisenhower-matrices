import { useState, useEffect } from "react";
import type { User as FirebaseUser } from "firebase/auth";
import { signOut, updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import type { MatrixDoc } from "@/lib/eisenhower-storage";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Grid3X3,
  LogOut,
  User as UserIcon,
  ChevronRight,
  ChevronDown,
  Plus,
  BookOpen,
  CloudOff,
  Sparkles,
  Layers,
  CheckCircle2,
  LayoutGrid,
} from "lucide-react";

type Props = {
  user: FirebaseUser | null;
  onOpenAuth: () => void;
  onSelectMatrix: (id: string | null) => void;
  isDashboardView: boolean;
  onUpdateDisplayName?: (name: string) => void;
  matrices?: MatrixDoc[];
  activeMatrix?: MatrixDoc | null;
  onCreateMatrix?: (name: string) => void;
};

export function Navbar({
  user,
  onOpenAuth,
  onSelectMatrix,
  isDashboardView,
  onUpdateDisplayName,
  matrices = [],
  activeMatrix,
  onCreateMatrix,
}: Props) {
  const [nameInput, setNameInput] = useState("");
  const [isNewMatrixOpen, setIsNewMatrixOpen] = useState(false);
  const [newMatrixTitle, setNewMatrixTitle] = useState("");

  useEffect(() => {
    if (user) {
      setNameInput(user.displayName || user.email?.split("@")[0] || "User");
    }
  }, [user]);

  const handleSignOut = () => {
    signOut(auth);
  };

  const handleNameChange = async (val: string) => {
    setNameInput(val);
    if (user && val.trim()) {
      const clean = val.trim();
      updateProfile(user, { displayName: clean }).catch(() => {});
      if (onUpdateDisplayName) {
        onUpdateDisplayName(clean);
      }
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMatrixTitle.trim() && onCreateMatrix) {
      onCreateMatrix(newMatrixTitle.trim());
      setNewMatrixTitle("");
      setIsNewMatrixOpen(false);
    }
  };

  const getUserInitials = () => {
    if (user?.displayName) {
      const parts = user.displayName.split(" ");
      if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      return user.displayName.substring(0, 2).toUpperCase();
    }
    if (user?.email) return user.email.substring(0, 2).toUpperCase();
    return "US";
  };

  return (
    <header className="w-full border-b border-border bg-card/60 backdrop-blur-md px-4 py-2.5 shrink-0 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Left: Brand logo & Navigation Breadcrumbs */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Brand Logo / Home link */}
          <button
            onClick={() => onSelectMatrix(null)}
            className="flex items-center gap-2 text-left hover:opacity-90 transition group shrink-0"
            title="Go to Dashboard"
          >
            <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary shrink-0 group-hover:scale-105 transition-transform shadow-xs">
              <Grid3X3 className="h-4 sm:h-5 w-4 sm:w-5" />
            </div>
            <span className="font-extrabold text-base sm:text-lg tracking-tight text-foreground whitespace-nowrap">
              Eisenhower Matrices
            </span>
          </button>

          {/* Separator */}
          <span className="text-muted-foreground/40 text-xs hidden sm:inline">/</span>

          {/* Navigation Links & Matrix Switcher */}
          <div className="flex items-center gap-1.5 min-w-0">
            <Button
              variant={isDashboardView ? "secondary" : "ghost"}
              size="sm"
              onClick={() => onSelectMatrix(null)}
              className="h-8 px-2.5 text-xs font-semibold gap-1.5 shrink-0"
            >
              <LayoutGrid className="h-3.5 w-3.5 text-primary" />
              <span>Dashboard</span>
              {matrices.length > 0 && (
                <Badge variant="outline" className="h-4 px-1.5 text-[10px] font-mono bg-background/50">
                  {matrices.length}
                </Badge>
              )}
            </Button>

            {/* Active Matrix Dropdown Switcher */}
            {matrices.length > 0 && (
              <>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant={!isDashboardView ? "secondary" : "outline"}
                      size="sm"
                      className="h-8 px-2.5 text-xs font-medium max-w-[160px] sm:max-w-[220px] justify-between gap-1.5 truncate border-border/80"
                    >
                      <span className="truncate">
                        {activeMatrix ? activeMatrix.name : "Select Matrix"}
                      </span>
                      <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-60" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    <DropdownMenuLabel className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Your Matrices
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {matrices.map((m) => (
                      <DropdownMenuItem
                        key={m.id}
                        onClick={() => onSelectMatrix(m.id)}
                        className={`flex items-center justify-between text-xs cursor-pointer ${
                          m.id === activeMatrix?.id ? "font-semibold bg-accent text-accent-foreground" : ""
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Layers className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span className="truncate">{m.name}</span>
                        </div>
                        {m.id === activeMatrix?.id && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0 ml-1" />
                        )}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setIsNewMatrixOpen(true)}
                      className="text-xs text-primary font-medium cursor-pointer gap-2"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Create New Matrix</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        </div>

        {/* Right: Actions, Framework Guide & User Auth */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Eisenhower Framework Guide Dialog */}
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2.5 text-xs border-border/70 hover:bg-secondary/60 hidden md:flex gap-1.5"
                title="View Eisenhower Matrix Decision Guide"
              >
                <BookOpen className="h-3.5 w-3.5 text-primary" />
                <span>Framework Guide</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-3xl md:max-w-4xl p-6 sm:p-8">
              <DialogHeader className="mb-2">
                <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                  <Grid3X3 className="h-6 w-6 text-primary" />
                  The Eisenhower Decision Matrix
                </DialogTitle>
                <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
                  Organize and prioritize tasks by urgency and importance to focus on high-impact work.
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-2">
                <div
                  className="p-4 sm:p-5 rounded-xl border flex flex-col gap-2 transition-colors"
                  style={{
                    borderColor: "color-mix(in oklab, var(--q1) 40%, transparent)",
                    backgroundColor: "color-mix(in oklab, var(--q1) 10%, transparent)",
                  }}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-1.5 border-b border-border/20">
                    <span className="font-bold text-sm sm:text-base tracking-tight" style={{ color: "var(--q1)" }}>
                      Q1: DO FIRST
                    </span>
                    <Badge
                      variant="outline"
                      className="text-xs font-semibold px-2.5 py-0.5"
                      style={{
                        color: "var(--q1)",
                        borderColor: "color-mix(in oklab, var(--q1) 40%, transparent)",
                        backgroundColor: "color-mix(in oklab, var(--q1) 15%, transparent)",
                      }}
                    >
                      Urgent & Important
                    </Badge>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mt-1">
                    Pressing crises, tight deadlines, and critical problems. Complete these immediately.
                  </p>
                </div>

                <div
                  className="p-4 sm:p-5 rounded-xl border flex flex-col gap-2 transition-colors"
                  style={{
                    borderColor: "color-mix(in oklab, var(--q2) 40%, transparent)",
                    backgroundColor: "color-mix(in oklab, var(--q2) 10%, transparent)",
                  }}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-1.5 border-b border-border/20">
                    <span className="font-bold text-sm sm:text-base tracking-tight" style={{ color: "var(--q2)" }}>
                      Q2: SCHEDULE
                    </span>
                    <Badge
                      variant="outline"
                      className="text-xs font-semibold px-2.5 py-0.5"
                      style={{
                        color: "var(--q2)",
                        borderColor: "color-mix(in oklab, var(--q2) 40%, transparent)",
                        backgroundColor: "color-mix(in oklab, var(--q2) 15%, transparent)",
                      }}
                    >
                      Not Urgent & Important
                    </Badge>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mt-1">
                    Long-term goals, planning, self-improvement, and strategy. Schedule dedicated focus time.
                  </p>
                </div>

                <div
                  className="p-4 sm:p-5 rounded-xl border flex flex-col gap-2 transition-colors"
                  style={{
                    borderColor: "color-mix(in oklab, var(--q3) 40%, transparent)",
                    backgroundColor: "color-mix(in oklab, var(--q3) 10%, transparent)",
                  }}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-1.5 border-b border-border/20">
                    <span className="font-bold text-sm sm:text-base tracking-tight" style={{ color: "var(--q3)" }}>
                      Q3: DELEGATE
                    </span>
                    <Badge
                      variant="outline"
                      className="text-xs font-semibold px-2.5 py-0.5"
                      style={{
                        color: "var(--q3)",
                        borderColor: "color-mix(in oklab, var(--q3) 40%, transparent)",
                        backgroundColor: "color-mix(in oklab, var(--q3) 15%, transparent)",
                      }}
                    >
                      Urgent & Not Important
                    </Badge>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mt-1">
                    Interruptions, routine meetings, and urgent requests that don&apos;t align with your core goals.
                  </p>
                </div>

                <div
                  className="p-4 sm:p-5 rounded-xl border flex flex-col gap-2 transition-colors"
                  style={{
                    borderColor: "color-mix(in oklab, var(--q4) 40%, transparent)",
                    backgroundColor: "color-mix(in oklab, var(--q4) 10%, transparent)",
                  }}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-1.5 border-b border-border/20">
                    <span className="font-bold text-sm sm:text-base tracking-tight" style={{ color: "var(--q4)" }}>
                      Q4: ELIMINATE
                    </span>
                    <Badge
                      variant="outline"
                      className="text-xs font-semibold px-2.5 py-0.5"
                      style={{
                        color: "var(--q4)",
                        borderColor: "color-mix(in oklab, var(--q4) 40%, transparent)",
                        backgroundColor: "color-mix(in oklab, var(--q4) 15%, transparent)",
                      }}
                    >
                      Not Urgent & Not Important
                    </Badge>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mt-1">
                    Time wasters, busy work, and low-value activities. Minimize or remove these tasks.
                  </p>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* User Auth or Guest Status */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2 border-border/80 hover:bg-secondary/70 gap-2"
                >
                  <div className="w-5 h-5 rounded-full bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center border border-primary/30">
                    {getUserInitials()}
                  </div>
                  <span className="text-xs font-medium max-w-[100px] truncate hidden sm:inline">
                    {user.displayName || user.email?.split("@")[0]}
                  </span>
                  <ChevronDown className="h-3 w-3 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel className="flex flex-col gap-1">
                  <span className="text-xs font-bold truncate">
                    {user.displayName || "Account"}
                  </span>
                  <span className="text-[11px] font-normal text-muted-foreground truncate">
                    {user.email}
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                <div className="px-2 py-1.5 flex flex-col gap-1">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase">
                    Display Name
                  </label>
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-secondary/50 border border-border">
                    <UserIcon className="h-3 w-3 text-primary shrink-0" />
                    <input
                      type="text"
                      className="bg-transparent text-foreground text-xs w-full focus:outline-none"
                      value={nameInput}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="Display Name"
                    />
                  </div>
                </div>

                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="text-xs text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer gap-2"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-1.5">
              <Badge
                variant="outline"
                className="h-7 px-2 text-[10px] border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/5 hidden sm:flex items-center gap-1"
              >
                <CloudOff className="h-3 w-3" />
                <span>Guest Session</span>
              </Badge>
              <Button
                size="sm"
                onClick={onOpenAuth}
                className="h-8 px-3 text-xs font-semibold gap-1.5 shadow-xs"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Sign In / Sync</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Quick Create Matrix Modal triggered from Navbar */}
      <Dialog open={isNewMatrixOpen} onOpenChange={setIsNewMatrixOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Plus className="h-4 w-4 text-primary" />
              Create New Matrix
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Matrix Name</label>
              <input
                type="text"
                required
                autoFocus
                placeholder="e.g., Q3 Marketing Roadmap"
                className="w-full px-3 py-2 text-xs rounded-md bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/40"
                value={newMatrixTitle}
                onChange={(e) => setNewMatrixTitle(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsNewMatrixOpen(false)}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" className="h-8 text-xs font-semibold">
                Create Matrix
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </header>
  );
}
