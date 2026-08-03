import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  or,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase/config";
import { COLLECTIONS } from "@/lib/firebase/paths";
import {
  createTask,
  cloneTaskTreeWithNewIds,
  cleanForFirestore,
  findTask,
  getTasksAtPath,
  loadState,
  mapTask,
  pruneMatrixPath,
  resolveAddParentId,
  addTask,
  type EisenhowerState,
  type MatrixDoc,
  type MatrixSchedule,
  type Task,
} from "@/lib/eisenhower-storage";
import { EisenhowerMatrix } from "@/components/EisenhowerMatrix";
import { ControlsPanel } from "@/components/ControlsPanel";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Dashboard } from "@/components/Dashboard";
import { AuthModal } from "@/components/AuthModal";
import { InviteModal } from "@/components/InviteModal";
import { EditMatrixModal } from "@/components/EditMatrixModal";
import { ScheduleModal } from "@/components/ScheduleModal";
import { EmbedMatrixModal } from "@/components/NestMatrixModal";
import { useMatrixNavigation } from "@/hooks/useMatrixNavigation";
import { useMatrixScheduleReset } from "@/hooks/useMatrixScheduleReset";

const WORKSPACE_HEIGHT = "min(720px, calc(100vh - 7rem))";
const GUEST_MATRICES_KEY = "eisenhower_guest_matrices_v2";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [matrices, setMatrices] = useState<MatrixDoc[]>([]);

  // Guest mode matrices list state
  const [guestMatrices, setGuestMatrices] = useState<MatrixDoc[]>([]);

  const {
    activeMatrixId,
    setActiveMatrixId,
    selectedId,
    setSelectedId,
    matrixPath,
    setMatrixPath,
    selectMatrixAndNavigate,
    navigateMatrixPath,
  } = useMatrixNavigation();

  // Modals state
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);

  const [invitingMatrix, setInvitingMatrix] = useState<MatrixDoc | null>(null);
  const [editingMatrix, setEditingMatrix] = useState<MatrixDoc | null>(null);
  const [schedulingMatrix, setSchedulingMatrix] = useState<MatrixDoc | null>(null);
  const [schedulingTask, setSchedulingTask] = useState<any | null>(null);

  // Authenticate user & reset selection on user change
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setActiveMatrixId(null);
      setSelectedId(null);
      setMatrixPath([]);

      if (u) {
        try {
          const userRef = doc(db, COLLECTIONS.USERS, u.uid);
          const userSnap = await getDoc(userRef);
          if (!userSnap.exists()) {
            await setDoc(userRef, {
              email: u.email,
              displayName: u.displayName || u.email?.split("@")[0] || "User",
              createdAt: Date.now(),
            });
          }
        } catch (err) {
          console.warn("User profile sync error:", err);
        }
      }
    });
    return unsub;
  }, []);

  // Guest mode matrices setup
  useEffect(() => {
    if (!user) {
      try {
        const raw = localStorage.getItem(GUEST_MATRICES_KEY);
        if (raw) {
          setGuestMatrices(JSON.parse(raw));
        } else {
          // Initialize with default guest matrix migrated from single state
          const defaultState = loadState();
          const initialGuest: MatrixDoc = {
            id: "guest-default",
            name: "My Eisenhower Matrix",
            description: "Default guest matrix saved locally",
            ownerId: "guest",
            memberUids: [],
            sharedEmails: [],
            tasks: defaultState.tasks,
            completedTasks: defaultState.completedTasks,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          setGuestMatrices([initialGuest]);
          localStorage.setItem(GUEST_MATRICES_KEY, JSON.stringify([initialGuest]));
        }
      } catch {
        setGuestMatrices([]);
      }
    }
  }, [user]);

  const saveGuestMatrices = (list: MatrixDoc[]) => {
    setGuestMatrices(list);
    localStorage.setItem(GUEST_MATRICES_KEY, JSON.stringify(list));
  };

  // Subscribe to Firestore matrices when authenticated
  useEffect(() => {
    if (!user) {
      setMatrices([]);
      return;
    }

    const colRef = collection(db, COLLECTIONS.MATRICES);
    const q = user.email
      ? query(
          colRef,
          or(
            where("ownerId", "==", user.uid),
            where("memberUids", "array-contains", user.uid),
            where("sharedEmails", "array-contains", user.email.toLowerCase()),
          ),
        )
      : query(
          colRef,
          or(
            where("ownerId", "==", user.uid),
            where("memberUids", "array-contains", user.uid),
          ),
        );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const docs: MatrixDoc[] = [];
        snapshot.forEach((docSnap) => {
          docs.push({ id: docSnap.id, ...docSnap.data() } as MatrixDoc);
        });
        setMatrices(docs);
      },
      (error) => {
        console.warn("Firestore composite query failed, falling back to owner query:", error);
        const ownerQ = query(colRef, where("ownerId", "==", user.uid));
        onSnapshot(ownerQ, (snap) => {
          const docs: MatrixDoc[] = [];
          snap.forEach((docSnap) => {
            docs.push({ id: docSnap.id, ...docSnap.data() } as MatrixDoc);
          });
          setMatrices(docs);
        });
      },
    );

    return unsub;
  }, [user]);

  const effectiveMatrices = useMemo(() => {
    const list = user ? matrices : guestMatrices;
    return list.filter((m) => !m.isNestedOnly);
  }, [user, matrices, guestMatrices]);

  // Derive currently active matrix document & state
  const activeMatrix = useMemo(() => {
    if (!activeMatrixId) return null;
    return effectiveMatrices.find((m) => m.id === activeMatrixId) ?? null;
  }, [activeMatrixId, effectiveMatrices]);

  useEffect(() => {
    if (activeMatrix && activeMatrix.name) {
      document.title = `Eisenhower Matrices | ${activeMatrix.name}`;
    } else {
      document.title = "Eisenhower Matrices";
    }
  }, [activeMatrix]);

  const state: EisenhowerState | null = useMemo(() => {
    if (!activeMatrix) return null;
    const baseState: EisenhowerState = {
      tasks: activeMatrix.tasks ?? [],
      completedTasks: activeMatrix.completedTasks ?? [],
    };

    const linkTask = (t: Task): Task => {
      let subtasks = t.subtasks ?? [];
      if (t.nestedMatrixId && t.nestMode === "link") {
        const target = effectiveMatrices.find((m) => m.id === t.nestedMatrixId);
        if (target) {
          subtasks = target.tasks ?? [];
        }
      }
      return {
        ...t,
        subtasks: subtasks.map(linkTask),
      };
    };

    return {
      tasks: baseState.tasks.map(linkTask),
      completedTasks: baseState.completedTasks,
    };
  }, [activeMatrix, effectiveMatrices]);

  const activeMatrixName = useMemo(() => {
    return activeMatrix?.name ?? "My Matrix";
  }, [activeMatrix]);

  // Handle creating a new Matrix
  const handleCreateMatrix = async (name: string, description?: string) => {
    if (user) {
      const newDoc = await addDoc(collection(db, COLLECTIONS.MATRICES), {
        name,
        description: description || "",
        ownerId: user.uid,
        ownerEmail: user.email?.toLowerCase() || "",
        memberUids: [user.uid],
        sharedEmails: [],
        tasks: [],
        completedTasks: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      selectMatrixAndNavigate(newDoc.id);
    } else {
      const newGuest: MatrixDoc = {
        id: "guest_" + Math.random().toString(36).slice(2, 10),
        name,
        description: description || "",
        ownerId: "guest",
        memberUids: [],
        sharedEmails: [],
        tasks: [],
        completedTasks: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      const updated = [...guestMatrices, newGuest];
      saveGuestMatrices(updated);
      selectMatrixAndNavigate(newGuest.id);
    }
  };

  // Handle editing Matrix Name & Description
  const handleEditMatrixSave = (name: string, description: string) => {
    if (!editingMatrix) return;
    if (user) {
      const docRef = doc(db, COLLECTIONS.MATRICES, editingMatrix.id);
      updateDoc(docRef, { name, description, updatedAt: Date.now() });
    } else {
      const updated = guestMatrices.map((m) =>
        m.id === editingMatrix.id ? { ...m, name, description, updatedAt: Date.now() } : m,
      );
      saveGuestMatrices(updated);
    }
  };

  // Handle deleting a Matrix
  const handleDeleteMatrix = (matrixId: string) => {
    if (user) {
      const docRef = doc(db, COLLECTIONS.MATRICES, matrixId);
      deleteDoc(docRef);
    } else {
      const updated = guestMatrices.filter((m) => m.id !== matrixId);
      saveGuestMatrices(updated);
    }
    if (activeMatrixId === matrixId) {
      selectMatrixAndNavigate(null);
    }
  };

  // Handle copying an existing matrix
  const handleCopyMatrix = async (matrixId: string) => {
    const target = effectiveMatrices.find((m) => m.id === matrixId);
    if (!target) return;

    if (user) {
      const newDoc = await addDoc(collection(db, COLLECTIONS.MATRICES), {
        name: `${target.name} (Copy)`,
        description: target.description || "",
        ownerId: user.uid,
        ownerEmail: user.email?.toLowerCase() || "",
        memberUids: [user.uid],
        sharedEmails: [],
        tasks: target.tasks ?? [],
        completedTasks: target.completedTasks ?? [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      selectMatrixAndNavigate(newDoc.id);
    } else {
      const newGuest: MatrixDoc = {
        id: "guest_" + Math.random().toString(36).slice(2, 10),
        name: `${target.name} (Copy)`,
        description: target.description || "",
        ownerId: "guest",
        memberUids: [],
        sharedEmails: [],
        tasks: target.tasks ?? [],
        completedTasks: target.completedTasks ?? [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      const updated = [...guestMatrices, newGuest];
      saveGuestMatrices(updated);
      selectMatrixAndNavigate(newGuest.id);
    }
  };

  const setState = (newState: EisenhowerState) => {
    if (!activeMatrixId) return;

    const cleanedTasks = cleanForFirestore(newState.tasks);
    const cleanedCompleted = cleanForFirestore(newState.completedTasks);

    if (user) {
      const docRef = doc(db, COLLECTIONS.MATRICES, activeMatrixId);
      setDoc(
        docRef,
        {
          tasks: cleanedTasks,
          completedTasks: cleanedCompleted,
          updatedAt: Date.now(),
        },
        { merge: true },
      );
    } else {
      const updated = guestMatrices.map((m) =>
        m.id === activeMatrixId
          ? {
              ...m,
              tasks: cleanedTasks,
              completedTasks: cleanedCompleted,
              updatedAt: Date.now(),
            }
          : m,
      );
      saveGuestMatrices(updated);
    }
  };

  const matrixPathSafe = useMemo(() => {
    if (!state) return [];
    return pruneMatrixPath(state, matrixPath);
  }, [state, matrixPath]);

  const matrixTasks = useMemo(() => {
    if (!state) return [];
    return getTasksAtPath(state, matrixPathSafe);
  }, [state, matrixPathSafe]);

  useEffect(() => {
    if (!state) return;
    if (matrixPathSafe.length !== matrixPath.length) {
      setMatrixPath(matrixPathSafe);
    }
  }, [state, matrixPath, matrixPathSafe]);

  useEffect(() => {
    if (selectedId && !matrixTasks.some((t) => t.id === selectedId)) {
      setSelectedId(null);
    }
  }, [matrixTasks, selectedId]);

  const updateState = (mut: (s: EisenhowerState) => EisenhowerState) => {
    if (state) setState(mut(state));
  };

  const moveTask = (id: string, urgency: number, importance: number) => {
    updateState((s) => mapTask(s, id, (t) => ({ ...t, urgency, importance })));
  };

  const drillIntoTask = (id: string) => {
    if (!state) return;
    const task = findTask(state, id);
    if (!task) return;
    setMatrixPath((p) => [...pruneMatrixPath(state, p), id]);
    setSelectedId(id);
  };

  const handleSaveMatrixSettings = (name: string, description: string, schedule: MatrixSchedule) => {
    if (!activeMatrix) return;
    if (user) {
      const docRef = doc(db, COLLECTIONS.MATRICES, activeMatrix.id);
      updateDoc(docRef, { name, description, schedule, updatedAt: Date.now() });
    } else {
      const updated = guestMatrices.map((m) =>
        m.id === activeMatrix.id ? { ...m, name, description, schedule, updatedAt: Date.now() } : m,
      );
      saveGuestMatrices(updated);
    }
  };

  const navigateMatrix = (path: string[]) => {
    setMatrixPath(path);
    const leaf = path[path.length - 1];
    setSelectedId(leaf ?? null);
  };

  // Handle matrix schedule saving
  const handleSaveSchedule = (schedule: MatrixSchedule) => {
    if (!schedulingMatrix) return;
    if (user) {
      const docRef = doc(db, COLLECTIONS.MATRICES, schedulingMatrix.id);
      updateDoc(docRef, { schedule, updatedAt: Date.now() });
    } else {
      const updated = guestMatrices.map((m) =>
        m.id === schedulingMatrix.id ? { ...m, schedule, updatedAt: Date.now() } : m,
      );
      saveGuestMatrices(updated);
    }
  };

  const handleSaveTaskSchedule = (schedule: MatrixSchedule) => {
    if (!schedulingTask || !state) return;
    setState(
      mapTask(state, schedulingTask.id, (t) => ({
        ...t,
        schedule,
      })),
    );
    setSchedulingTask(null);
  };


  // Check recurring schedule resets
  useMatrixScheduleReset(activeMatrix, user, guestMatrices, saveGuestMatrices);

  // Compute read-only access permission
  const isReadOnly = useMemo(() => {
    if (!user || !activeMatrix) return false;
    if (activeMatrix.ownerId === user.uid) return false;
    const userEmail = user.email?.toLowerCase();
    if (!userEmail) return false;
    const role = activeMatrix.collaboratorRoles?.[userEmail] || "viewer";
    return role === "viewer";
  }, [user, activeMatrix]);

  const isDashboardView = activeMatrixId === null;

  // Handle embedding an existing matrix into current matrix layer
  const handleSelectNest = async (targetMatrixId: string, mode: "link" | "copy") => {
    if (!state) return;
    const targetMatrix = effectiveMatrices.find((m) => m.id === targetMatrixId);
    if (!targetMatrix) return;

    let newTask: Task;

    if (mode === "copy") {
      // Snapshot copy: deep copy target matrix's tasks with fresh unique IDs into subtasks of the new task.
      // DOES NOT create any extra matrix document in library or Firestore!
      newTask = createTask({
        name: targetMatrix.name,
        description: targetMatrix.description || "Embedded Matrix (Copy)",
        urgency: 50,
        importance: 50,
        subtasks: cloneTaskTreeWithNewIds(targetMatrix.tasks ?? []),
        nestMode: "copy",
      });
    } else {
      // Direct Link: symlink reference to target matrix ID.
      // Edits update target matrix and vice-versa.
      newTask = createTask({
        name: targetMatrix.name,
        description: targetMatrix.description || "Embedded Matrix (Direct Link)",
        urgency: 50,
        importance: 50,
        nestedMatrixId: targetMatrix.id,
        nestMode: "link",
      });
    }

    const addParentId = resolveAddParentId(
      state,
      matrixPathSafe,
      selectedId,
      new Set(matrixTasks.map((t) => t.id)),
    );
    setState(addTask(state, addParentId, newTask));
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-background text-foreground">
      <Navbar
        user={user}
        onOpenAuth={() => setIsAuthOpen(true)}
        onSelectMatrix={selectMatrixAndNavigate}
        isDashboardView={isDashboardView}
        matrices={effectiveMatrices}
        activeMatrix={activeMatrix}
        onCreateMatrix={handleCreateMatrix}
      />

      <main className="flex-1 w-full max-w-[100vw] overflow-x-hidden box-border flex items-center justify-center p-3 sm:p-4 lg:p-6">
        {isDashboardView ? (
          <Dashboard
            matrices={effectiveMatrices}
            activeMatrixId={activeMatrixId}
            currentUserId={user?.uid}
            onSelectMatrix={selectMatrixAndNavigate}
            onCreateMatrix={handleCreateMatrix}
            onCopyMatrix={handleCopyMatrix}
            onShareMatrix={(m) => {
              setInvitingMatrix(m);
              setIsInviteOpen(true);
            }}
            onEditMatrix={(m) => {
              setEditingMatrix(m);
              setIsEditOpen(true);
            }}
            onDeleteMatrix={handleDeleteMatrix}
            onScheduleMatrix={(m) => {
              setSchedulingMatrix(m);
              setIsScheduleOpen(true);
            }}
            isGuest={!user}
          />
        ) : state ? (
          <div
            className="w-full min-w-0 max-w-full flex flex-col lg:flex-row items-stretch justify-evenly gap-5 lg:gap-6 h-auto lg:h-[var(--workspace-h)]"
            style={{ ["--workspace-h" as string]: WORKSPACE_HEIGHT }}
          >
            <aside className="w-full min-w-0 lg:w-[min(420px,46vw)] lg:max-w-[420px] lg:shrink-0 h-auto lg:h-full flex flex-col">
              <ControlsPanel
                state={state}
                setState={setState}
                selectedId={selectedId}
                setSelectedId={setSelectedId}
                matrixPath={matrixPathSafe}
                onNavigatePath={navigateMatrix}
                onSelectMatrix={selectMatrixAndNavigate}
                availableMatrices={effectiveMatrices.filter((m) => m.id !== activeMatrixId)}
                readOnly={isReadOnly}
                activeMatrix={activeMatrix}
                onSaveMatrixSettings={handleSaveMatrixSettings}
                onOpenTaskScheduleModal={(t) => setSchedulingTask(t)}
                onConfirmNestMatrix={handleSelectNest}
                currentUserId={user?.uid}
              />
            </aside>
            <section className="w-full min-w-0 lg:flex-1 lg:max-w-[min(720px,calc(100vw-380px))] lg:h-full flex items-center justify-center">
              <EisenhowerMatrix
                tasks={matrixTasks}
                onMove={moveTask}
                onSelect={setSelectedId}
                selectedId={selectedId}
                onDrillInto={drillIntoTask}
              />
            </section>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground italic">
            Select or create a matrix to get started.
          </div>
        )}
      </main>

      <Footer />

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      <InviteModal
        matrix={invitingMatrix || activeMatrix}
        isOpen={isInviteOpen}
        onClose={() => {
          setIsInviteOpen(false);
          setInvitingMatrix(null);
        }}
        currentUserId={user?.uid}
      />
      <EditMatrixModal
        matrix={editingMatrix}
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setEditingMatrix(null);
        }}
        onSave={handleEditMatrixSave}
        onDelete={
          editingMatrix ? () => handleDeleteMatrix(editingMatrix.id) : undefined
        }
      />
      <ScheduleModal
        title={`Matrix Schedule: ${activeMatrix?.name || ""}`}
        schedule={schedulingMatrix?.schedule || activeMatrix?.schedule}
        isOpen={isScheduleOpen}
        onClose={() => {
          setIsScheduleOpen(false);
          setSchedulingMatrix(null);
        }}
        onSaveSchedule={handleSaveSchedule}
      />
      {schedulingTask && (
        <ScheduleModal
          title={`Task Schedule: ${schedulingTask.name}`}
          schedule={schedulingTask.schedule}
          isOpen={!!schedulingTask}
          onClose={() => setSchedulingTask(null)}
          onSaveSchedule={handleSaveTaskSchedule}
        />
      )}
    </div>
  );
}
