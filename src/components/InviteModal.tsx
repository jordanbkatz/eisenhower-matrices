import { useState, useEffect } from "react";
import {
  collection,
  doc,
  getDocs,
  updateDoc,
  arrayUnion,
  arrayRemove,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { COLLECTIONS } from "@/lib/firebase/paths";
import type { MatrixDoc } from "@/lib/eisenhower-storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, UserPlus, Check, User as UserIcon, Trash2, Search, Mail } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  matrix: MatrixDoc | null;
  isOpen: boolean;
  onClose: () => void;
  currentUserId?: string | null;
};

type UserResult = {
  uid: string;
  email: string;
  displayName?: string;
};

export function InviteModal({ matrix: initialMatrix, isOpen, onClose, currentUserId }: Props) {
  const [matrix, setMatrix] = useState<MatrixDoc | null>(initialMatrix);
  const [allUsers, setAllUsers] = useState<UserResult[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<"viewer" | "editor">("viewer");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [error, setError] = useState("");

  const isOwner = matrix && currentUserId && matrix.ownerId === currentUserId;

  // Real-time matrix listener for collaborators update
  useEffect(() => {
    if (!initialMatrix || !isOpen) return;
    const docRef = doc(db, COLLECTIONS.MATRICES, initialMatrix.id);
    const unsub = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setMatrix({ id: docSnap.id, ...docSnap.data() } as MatrixDoc);
      }
    });
    return unsub;
  }, [initialMatrix, isOpen]);

  // Load registered users once for instant client-side filtering
  useEffect(() => {
    if (!isOpen) return;
    const usersRef = collection(db, COLLECTIONS.USERS);
    getDocs(usersRef).then((snap) => {
      const list: UserResult[] = [];
      snap.forEach((d) => {
        const data = d.data();
        list.push({ uid: d.id, email: data.email, displayName: data.displayName });
      });
      setAllUsers(list);
    });
  }, [isOpen]);

  if (!isOpen || !matrix) return null;

  // Filter search results automatically as searchQuery changes
  const q = searchQuery.trim().toLowerCase();
  const searchResults = q
    ? allUsers.filter(
        (u) =>
          u.email.toLowerCase().includes(q) ||
          (u.displayName && u.displayName.toLowerCase().includes(q)),
      )
    : [];

  const handleInviteUser = async (targetUser: UserResult) => {
    setError("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const matrixRef = doc(db, COLLECTIONS.MATRICES, matrix.id);
      const emailKey = targetUser.email.toLowerCase();
      const updatedRoles = {
        ...(matrix.collaboratorRoles || {}),
        [emailKey]: selectedRole,
      };

      await updateDoc(matrixRef, {
        memberUids: arrayUnion(targetUser.uid),
        sharedEmails: arrayUnion(emailKey),
        collaboratorRoles: updatedRoles,
        updatedAt: Date.now(),
      });

      setSuccessMsg(`Invited ${targetUser.displayName || targetUser.email} as ${selectedRole}!`);
      setSearchQuery("");
    } catch (err: any) {
      setError(err.message || "Failed to invite user.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (targetEmail: string, newRole: "viewer" | "editor") => {
    if (!isOwner) return;
    try {
      const matrixRef = doc(db, COLLECTIONS.MATRICES, matrix.id);
      const emailKey = targetEmail.toLowerCase();
      const updatedRoles = {
        ...(matrix.collaboratorRoles || {}),
        [emailKey]: newRole,
      };
      await updateDoc(matrixRef, {
        collaboratorRoles: updatedRoles,
        updatedAt: Date.now(),
      });
      setSuccessMsg(`Updated ${targetEmail} permission to ${newRole}`);
    } catch (err: any) {
      setError("Failed to update role permission.");
    }
  };

  const handleRemoveUser = async (targetEmail: string, targetUid?: string) => {
    setError("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const matrixRef = doc(db, COLLECTIONS.MATRICES, matrix.id);
      const emailKey = targetEmail.toLowerCase();
      const updatedRoles = { ...(matrix.collaboratorRoles || {}) };
      delete updatedRoles[emailKey];

      const updates: any = {
        sharedEmails: arrayRemove(emailKey),
        collaboratorRoles: updatedRoles,
        updatedAt: Date.now(),
      };
      if (targetUid) {
        updates.memberUids = arrayRemove(targetUid);
      }
      await updateDoc(matrixRef, updates);
      setSuccessMsg(`Removed ${targetEmail}`);
    } catch (err: any) {
      setError(err.message || "Failed to remove collaborator.");
    } finally {
      setLoading(false);
    }
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
            <UserPlus className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Invite Collaborator</h2>
            <p className="text-xs text-muted-foreground">
              Invite registered users to view or edit "{matrix.name}"
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/15 border border-destructive/30 text-destructive text-xs">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
            <Check className="h-4 w-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Invite Search & Role Selector */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search user by email or name..."
                className="pl-9 text-xs"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>

            <Select
              value={selectedRole}
              onValueChange={(v: "viewer" | "editor") => setSelectedRole(v)}
            >
              <SelectTrigger className="w-28 text-xs h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="viewer" className="text-xs">
                  Viewer
                </SelectItem>
                <SelectItem value="editor" className="text-xs">
                  Editor
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Instant Search Results */}
        {q !== "" && (
          <div className="mt-3 p-2 rounded-xl bg-secondary/30 border border-border space-y-1 max-h-40 overflow-y-auto">
            <p className="text-[10px] uppercase font-bold text-muted-foreground px-2 py-1">
              {searchResults.length > 0
                ? "Matching Users:"
                : `No user found matching "${searchQuery}"`}
            </p>

            {searchResults.map((u) => {
              const alreadyMember =
                matrix.memberUids?.includes(u.uid) ||
                matrix.sharedEmails?.includes(u.email.toLowerCase()) ||
                matrix.ownerId === u.uid;

              return (
                <div
                  key={u.uid}
                  className="flex items-center justify-between p-2 rounded-lg bg-card/70 border border-border/40 hover:border-primary/50 transition"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <UserIcon className="h-4 w-4 text-primary shrink-0" />
                    <div className="truncate text-xs">
                      <p className="font-semibold text-foreground truncate">
                        {u.displayName || u.email}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">{u.email}</p>
                    </div>
                  </div>

                  {alreadyMember ? (
                    <span className="text-[10px] text-muted-foreground px-2 py-0.5 rounded bg-secondary">
                      Invited
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleInviteUser(u)}
                      disabled={loading}
                      className="h-7 text-xs px-2.5"
                    >
                      <UserPlus className="h-3 w-3 mr-1" />
                      Invite ({selectedRole})
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Current Collaborators */}
        <div className="mt-6 pt-4 border-t border-border space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Current Collaborators ({1 + (matrix.sharedEmails?.length || 0)})
          </h3>
          <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
            <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-secondary/40 border border-border/50">
              <span className="font-medium text-foreground">
                {matrix.ownerEmail || "Owner"}
              </span>
              <span className="text-[10px] uppercase font-bold text-primary px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
                Owner
              </span>
            </div>

            {matrix.sharedEmails?.map((sharedEmail) => {
              const matchedUid = allUsers.find(
                (u) => u.email.toLowerCase() === sharedEmail.toLowerCase(),
              )?.uid;
              const role = matrix.collaboratorRoles?.[sharedEmail.toLowerCase()] || "viewer";

              return (
                <div
                  key={sharedEmail}
                  className="flex items-center justify-between text-xs p-2 rounded-lg bg-secondary/20 border border-border/30"
                >
                  <span className="text-muted-foreground truncate">{sharedEmail}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    {isOwner ? (
                      <Select
                        value={role}
                        onValueChange={(v: "viewer" | "editor") =>
                          handleUpdateRole(sharedEmail, v)
                        }
                      >
                        <SelectTrigger className="h-6 text-[10px] w-20 px-1.5 border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="viewer" className="text-xs">
                            Viewer
                          </SelectItem>
                          <SelectItem value="editor" className="text-xs">
                            Editor
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-[10px] uppercase font-semibold text-muted-foreground px-1.5 py-0.5 rounded bg-secondary">
                        {role}
                      </span>
                    )}

                    {isOwner && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemoveUser(sharedEmail, matchedUid)}
                        title="Remove Collaborator"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
