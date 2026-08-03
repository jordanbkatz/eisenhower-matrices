import { useEffect, useState } from "react";
import type { EisenhowerState, MatrixDoc } from "@/lib/eisenhower-storage";
import {
  addTask,
  completeTask,
  createTask,
  deleteTask,
  findTask,
  getTasksAtPath,
  mapTask,
  reinstateTask,
  resolveAddParentId,
} from "@/lib/eisenhower-storage";
import { TaskBreadcrumb } from "@/components/TaskBreadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Check,
  X,
  CheckCircle2,
  Undo2,
  List,
  PlusCircle,
  Grid3X3,
  Settings,
  Calendar,
  Save,
  ChevronLeft,
  Link,
  Copy,
  Sparkles,
  Users,
  Search,
  UserPlus,
  Trash2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { MatrixSchedule } from "@/lib/eisenhower-storage";
import { collection, doc, getDocs, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { COLLECTIONS } from "@/lib/firebase/paths";

type Props = {
  state: EisenhowerState;
  setState: (s: EisenhowerState) => void;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  matrixPath: string[];
  onNavigatePath: (path: string[]) => void;
  availableMatrices?: MatrixDoc[];
  readOnly?: boolean;
  activeMatrix?: MatrixDoc | null;
  onSaveMatrixSettings?: (name: string, description: string, schedule: MatrixSchedule) => void;
  onOpenTaskScheduleModal?: (task: any) => void;
  onConfirmNestMatrix?: (targetMatrixId: string, mode: "link" | "copy") => void;
  currentUserId?: string | null;
  onSelectMatrix?: (id: string) => void;
};

type ActiveSidebarTab = "list" | "completed" | "members" | "settings";
type TaskSidebarSubMode = "list" | "add-task" | "embed-matrix";

export function ControlsPanel({
  state,
  setState,
  selectedId,
  setSelectedId,
  matrixPath,
  onNavigatePath,
  availableMatrices = [],
  readOnly = false,
  activeMatrix = null,
  onSaveMatrixSettings,
  onOpenTaskScheduleModal,
  onConfirmNestMatrix,
  currentUserId,
  onSelectMatrix,
}: Props) {
  const visibleTasks = getTasksAtPath(state, matrixPath);
  const visibleTaskIds = new Set(visibleTasks.map((t) => t.id));

  const [activeTab, setActiveTab] = useState<ActiveSidebarTab>("list");
  const [taskSidebarMode, setTaskSidebarMode] = useState<TaskSidebarSubMode>("list");

  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [urgency, setUrgency] = useState(50);
  const [importance, setImportance] = useState(50);

  // Nest matrix form state
  const [nestTargetId, setNestTargetId] = useState<string>("");
  const [nestMode, setNestMode] = useState<"link" | "copy">("link");
  const [nestedMatrixId, setNestedMatrixId] = useState<string>("none");

  const [eName, setEName] = useState("");
  const [eDesc, setEDesc] = useState("");
  const [eUrgency, setEUrgency] = useState(50);
  const [eImportance, setEImportance] = useState(50);
  const [eNestedMatrixId, setENestedMatrixId] = useState<string>("none");
  const [eScheduleType, setEScheduleType] = useState<MatrixSchedule["type"]>("none");
  const [eCustomDaysOfWeek, setECustomDaysOfWeek] = useState<number[]>([]);
  const [eIntervalDays, setEIntervalDays] = useState<number>(1);

  // Add task schedule state
  const [addScheduleType, setAddScheduleType] = useState<MatrixSchedule["type"]>("none");
  const [addCustomMethod, setAddCustomMethod] = useState<"daysOfWeek" | "daysOfMonth" | "intervalDays">("daysOfWeek");
  const [addCustomDaysOfWeek, setAddCustomDaysOfWeek] = useState<number[]>([]);
  const [addCustomDaysOfMonth, setAddCustomDaysOfMonth] = useState<number[]>([]);
  const [addIntervalDays, setAddIntervalDays] = useState<number>(1);

  // Members tab state
  const [memberActionMsg, setMemberActionMsg] = useState("");
  const [memberSearch, setMemberSearch] = useState("");
  const [allUsers, setAllUsers] = useState<{ uid: string; email: string; displayName?: string }[]>([]);
  const [selectedInviteRole, setSelectedInviteRole] = useState<"viewer" | "editor">("viewer");

  const isOwner = !!(activeMatrix && currentUserId && activeMatrix.ownerId === currentUserId);

  useEffect(() => {
    if (activeTab === "members") {
      const usersRef = collection(db, COLLECTIONS.USERS);
      getDocs(usersRef)
        .then((snap) => {
          const list: { uid: string; email: string; displayName?: string }[] = [];
          snap.forEach((d) => {
            const data = d.data();
            list.push({ uid: d.id, email: data.email, displayName: data.displayName });
          });
          setAllUsers(list);
        })
        .catch(() => {});
    }
  }, [activeTab]);

  const q = memberSearch.trim().toLowerCase();
  const searchResults = q
    ? allUsers.filter(
        (u) =>
          u.email.toLowerCase().includes(q) ||
          (u.displayName && u.displayName.toLowerCase().includes(q)),
      )
    : [];

  const handleUpdateRole = async (email: string, role: "viewer" | "editor") => {
    if (!activeMatrix) return;
    try {
      const docRef = doc(db, COLLECTIONS.MATRICES, activeMatrix.id);
      const emailKey = email.toLowerCase();
      const updatedRoles = {
        ...(activeMatrix.collaboratorRoles || {}),
        [emailKey]: role,
      };
      await updateDoc(docRef, { collaboratorRoles: updatedRoles });
      setMemberActionMsg(`Updated role for ${email} to ${role}`);
    } catch (err: any) {
      setMemberActionMsg(`Failed to update role: ${err.message}`);
    }
  };

  const handleRemoveUser = async (email: string) => {
    if (!activeMatrix) return;
    try {
      const docRef = doc(db, COLLECTIONS.MATRICES, activeMatrix.id);
      const emailKey = email.toLowerCase();
      const updatedRoles = { ...(activeMatrix.collaboratorRoles || {}) };
      delete updatedRoles[emailKey];
      await updateDoc(docRef, {
        sharedEmails: arrayRemove(email),
        collaboratorRoles: updatedRoles,
      });
      setMemberActionMsg(`Removed ${email} from matrix`);
    } catch (err: any) {
      setMemberActionMsg(`Failed to remove member: ${err.message}`);
    }
  };

  const handleInviteUser = async (u: { uid: string; email: string }) => {
    if (!activeMatrix) return;
    try {
      const docRef = doc(db, COLLECTIONS.MATRICES, activeMatrix.id);
      const emailKey = u.email.toLowerCase();
      const updatedRoles = {
        ...(activeMatrix.collaboratorRoles || {}),
        [emailKey]: selectedInviteRole,
      };
      await updateDoc(docRef, {
        sharedEmails: arrayUnion(u.email),
        collaboratorRoles: updatedRoles,
      });
      setMemberActionMsg(`Invited ${u.email} as ${selectedInviteRole}`);
      setMemberSearch("");
    } catch (err: any) {
      setMemberActionMsg(`Failed to invite member: ${err.message}`);
    }
  };

  const selectedTask = selectedId ? findTask(state, selectedId) : null;

  const addParentId = resolveAddParentId(state, matrixPath, selectedId, visibleTaskIds);
  const addParentTask = addParentId ? findTask(state, addParentId) : null;
  const addingSubtask = addParentId !== null;

  const selectTask = (id: string) => {
    setSelectedId(id);
  };

  useEffect(() => {
    if (selectedId && selectedTask) {
      setEName(selectedTask.name);
      setEDesc(selectedTask.description);
      setEUrgency(selectedTask.urgency);
      setEImportance(selectedTask.importance);
      setENestedMatrixId(selectedTask.nestedMatrixId || "none");
      setEScheduleType(selectedTask.schedule?.type || "none");
      setECustomDaysOfWeek(selectedTask.schedule?.customDaysOfWeek || []);
      setEIntervalDays(selectedTask.schedule?.intervalDays || 1);
      setActiveTab("list");
    }
  }, [selectedId, selectedTask]);

  const updateState = (mut: (s: EisenhowerState) => EisenhowerState) => {
    if (readOnly) return;
    setState(mut(state));
  };

  const addTaskHandler = () => {
    if (readOnly || !name.trim()) return;
    const schedule: MatrixSchedule | undefined =
      addScheduleType !== "none"
        ? {
            type: addScheduleType,
            customDaysOfWeek: addScheduleType === "custom" && addCustomMethod === "daysOfWeek" ? addCustomDaysOfWeek : undefined,
            customDays: addScheduleType === "custom" && addCustomMethod === "daysOfMonth" ? addCustomDaysOfMonth : undefined,
            intervalDays: addScheduleType === "custom" && addCustomMethod === "intervalDays" ? addIntervalDays : undefined,

          }
        : undefined;

    const task = createTask({
      name: name.trim(),
      description: desc.trim(),
      urgency,
      importance,
      nestedMatrixId: nestedMatrixId !== "none" ? nestedMatrixId : undefined,
      schedule,
    });
    updateState((s) => addTask(s, addParentId, task));
    setName("");
    setDesc("");
    setUrgency(50);
    setImportance(50);
    setNestedMatrixId("none");
    setAddScheduleType("none");
    setAddCustomMethod("daysOfWeek");
    setAddCustomDaysOfWeek([]);
    setAddCustomDaysOfMonth([]);
    setAddIntervalDays(1);
    setSelectedId(task.id);
    setActiveTab("list");
    setTaskSidebarMode("list");
  };

  const deleteTaskHandler = (id: string) => {
    if (readOnly) return;
    updateState((s) => deleteTask(s, id));
    if (selectedId === id) setSelectedId(null);
  };


  const saveEdit = () => {
    if (readOnly || !selectedTask || !eName.trim()) return;
    updateState((s) =>
      mapTask(s, selectedTask.id, (t) => ({
        ...t,
        name: eName.trim(),
        description: eDesc.trim(),
        urgency: eUrgency,
        importance: eImportance,
        nestedMatrixId: eNestedMatrixId !== "none" ? eNestedMatrixId : undefined,
        schedule:
          eScheduleType !== "none"
            ? {
                type: eScheduleType,
                customDaysOfWeek: eScheduleType === "custom" ? eCustomDaysOfWeek : undefined,
                intervalDays: eScheduleType === "custom" ? eIntervalDays : undefined,
              }
            : undefined,
      })),
    );
    setSelectedId(null);
  };


  const completeTaskHandler = (id: string) => {
    if (readOnly) return;
    updateState((s) => completeTask(s, id));
    if (selectedId === id) setSelectedId(null);
  };

  const reinstateTaskHandler = (id: string) => {
    if (readOnly) return;
    updateState((s) => reinstateTask(s, id));
  };

  const formatCompletedAt = (ts: number) =>
    new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" });

  return (
    <div className="h-full flex flex-col gap-3 p-4 sm:p-5 bg-card/60 backdrop-blur-xl rounded-2xl border border-border shadow-xl overflow-hidden min-h-0">
      <div className="shrink-0 space-y-2">
        <TaskBreadcrumb state={state} path={matrixPath} onNavigate={onNavigatePath} />
      </div>

      {readOnly && (
        <div className="p-2 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs text-center font-medium">
          Viewer Access (Read-Only)
        </div>
      )}

      {/* 3 Sidebar Navigation Tabs: Tasks | Done | Settings */}
      <div className="flex rounded-xl bg-secondary/40 p-1 border border-border shrink-0 gap-0.5">
        <button
          type="button"
          onClick={() => {
            setActiveTab("list");
          }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition ${
            activeTab === "list"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <List className="h-3.5 w-3.5 shrink-0" />
          <span>Tasks ({visibleTasks.length})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("completed");
          }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition ${
            activeTab === "completed"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
          <span>Done ({state.completedTasks.length})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("settings");
          }}
          disabled={readOnly}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition ${
            activeTab === "settings"
              ? "bg-card text-primary shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Settings className="h-3.5 w-3.5 shrink-0" />
          <span>Settings</span>
        </button>
      </div>

      {/* Main Tab Panel Area */}
      <div className="flex-1 min-h-0 flex flex-col gap-2 overflow-hidden">
        {/* Tab 1: Task List */}
        {activeTab === "list" && (
          <div className="flex-1 min-h-0 flex flex-col gap-3 overflow-hidden">
            {selectedTask ? (
              /* Selected Task Edit Panel & Bottom Action Bar */
              <div className="flex-1 min-h-0 flex flex-col gap-2 overflow-hidden">
                <div className="flex-1 min-h-0 overflow-y-auto space-y-3 p-3 rounded-xl bg-card border border-primary/40">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-primary tracking-wider">
                      Edit Task
                    </span>
                    <button
                      onClick={() => setSelectedId(null)}
                      className="p-1 rounded text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Task Title</Label>
                    <Input
                      type="text"
                      value={eName}
                      onChange={(e) => setEName(e.target.value)}
                      className="text-xs"
                      disabled={readOnly}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Description</Label>
                    <Textarea
                      rows={2}
                      value={eDesc}
                      onChange={(e) => setEDesc(e.target.value)}
                      className="text-xs resize-none"
                      disabled={readOnly}
                    />
                  </div>

                  {/* Integrated Schedule Select */}
                  <div className="space-y-1">
                    <Label className="text-xs">Task Schedule & Reset</Label>
                    <Select
                      value={eScheduleType}
                      onValueChange={(val: MatrixSchedule["type"]) => setEScheduleType(val)}
                      disabled={readOnly}
                    >
                      <SelectTrigger className="text-xs h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none" className="text-xs">
                          Manual reset
                        </SelectItem>
                        <SelectItem value="daily" className="text-xs">
                          Daily Reset
                        </SelectItem>
                        <SelectItem value="weekly" className="text-xs">
                          Weekly Reset
                        </SelectItem>
                        <SelectItem value="monthly" className="text-xs">
                          Monthly Reset
                        </SelectItem>
                        <SelectItem value="custom" className="text-xs">
                          Custom Reset Interval
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Custom Reset Interval Settings */}
                  {eScheduleType === "custom" && (
                    <div className="p-2.5 rounded-lg bg-secondary/30 border border-border space-y-2 text-xs">
                      <div className="space-y-1">
                        <Label className="text-[11px] font-semibold text-foreground">Days of Week</Label>
                        <div className="grid grid-cols-7 gap-1">
                          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((dayName, idx) => {
                            const isSel = eCustomDaysOfWeek.includes(idx);
                            return (
                              <button
                                type="button"
                                key={dayName}
                                disabled={readOnly}
                                onClick={() =>
                                  setECustomDaysOfWeek((prev) =>
                                    prev.includes(idx) ? prev.filter((d) => d !== idx) : [...prev, idx],
                                  )
                                }
                                className={`py-1 rounded text-[10px] font-bold transition border ${
                                  isSel
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "bg-card text-muted-foreground border-border hover:bg-accent"
                                }`}
                              >
                                {dayName}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="space-y-1 pt-1.5 border-t border-border/50">
                        <div className="flex items-center justify-between">
                          <Label className="text-[11px] font-semibold text-foreground">Interval in Days</Label>
                          <span className="text-[10px] text-muted-foreground font-mono">Every {eIntervalDays} day(s)</span>
                        </div>
                        <Input
                          type="number"
                          min={1}
                          max={365}
                          value={eIntervalDays}
                          onChange={(e) => setEIntervalDays(Math.max(1, parseInt(e.target.value) || 1))}
                          className="h-7 text-xs"
                          disabled={readOnly}
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span>Urgency</span>
                      <span className="font-mono">{eUrgency}</span>
                    </div>
                    <Slider
                      min={0}
                      max={100}
                      value={[eUrgency]}
                      onValueChange={([v]) => {
                        if (v !== undefined) {
                          setEUrgency(v);
                          if (!readOnly && selectedTask) {
                            updateState((s) => mapTask(s, selectedTask.id, (t) => ({ ...t, urgency: v })));
                          }
                        }
                      }}
                      disabled={readOnly}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span>Importance</span>
                      <span className="font-mono">{eImportance}</span>
                    </div>
                    <Slider
                      min={0}
                      max={100}
                      value={[eImportance]}
                      onValueChange={([v]) => {
                        if (v !== undefined) {
                          setEImportance(v);
                          if (!readOnly && selectedTask) {
                            updateState((s) => mapTask(s, selectedTask.id, (t) => ({ ...t, importance: v })));
                          }
                        }
                      }}
                      disabled={readOnly}
                    />
                  </div>

                  {!readOnly && (
                    <div className="space-y-2 pt-2 border-t border-border">
                      <div className="flex gap-2">
                        <Button size="sm" onClick={saveEdit} className="flex-1 text-xs font-semibold">
                          <Check className="h-3.5 w-3.5 mr-1" />
                          Save Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => completeTaskHandler(selectedTask.id)}
                          className="text-xs text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 font-semibold"
                          title="Mark task completed"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                          Complete
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteTaskHandler(selectedTask.id)}
                          className="text-xs text-destructive border-destructive/30 hover:bg-destructive/10 font-semibold"
                          title="Erase task completely from matrix"
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* View Subtasks button OUTSIDE of Edit Task component at the bottom of the sidebar */}
                <div className="pt-2 flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onNavigatePath([...matrixPath, selectedTask.id])}
                    className="w-full text-xs font-semibold text-primary border border-primary/20 hover:bg-primary/10 gap-1.5 h-9"
                  >
                    <Grid3X3 className="h-3.5 w-3.5" />
                    <span>View Subtasks</span>
                    <ChevronLeft className="h-3.5 w-3.5 rotate-180 ml-auto" />
                  </Button>
                </div>
              </div>
            ) : taskSidebarMode === "add-task" ? (
              /* Inline Add Task/Subtask Form in Sidebar */
              <div className="flex-1 min-h-0 flex flex-col justify-between p-3 rounded-xl bg-card border border-primary/40 overflow-hidden animate-in fade-in duration-200">
                <div className="flex-1 min-h-0 overflow-y-auto space-y-3 px-1 py-1">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setTaskSidebarMode("list")}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground font-semibold"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span>Back to Tasks</span>
                    </button>
                    <span className="text-xs font-bold uppercase text-primary tracking-wider">
                      {matrixPath.length === 0 ? "New Task" : "New Subtask"}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Task Title</Label>
                    <Input
                      type="text"
                      placeholder="Enter task title..."
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="text-xs"
                      autoFocus
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Description (Optional)</Label>
                    <Textarea
                      rows={2}
                      placeholder="Details or notes..."
                      value={desc}
                      onChange={(e) => setDesc(e.target.value)}
                      className="text-xs resize-none"
                    />
                  </div>

                  <div className="space-y-1 font-sans">
                    <Label className="text-xs">Task Schedule & Reset</Label>
                    <Select
                      value={addScheduleType}
                      onValueChange={(val: MatrixSchedule["type"]) => setAddScheduleType(val)}
                    >
                      <SelectTrigger className="text-xs h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none" className="text-xs">
                          Manual reset
                        </SelectItem>
                        <SelectItem value="daily" className="text-xs">
                          Daily Reset
                        </SelectItem>
                        <SelectItem value="weekly" className="text-xs">
                          Weekly Reset
                        </SelectItem>
                        <SelectItem value="monthly" className="text-xs">
                          Monthly Reset
                        </SelectItem>
                        <SelectItem value="custom" className="text-xs">
                          Custom Reset Interval
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Custom Reset Interval Settings with Method Selection */}
                  {addScheduleType === "custom" && (
                    <div className="p-2.5 rounded-lg bg-secondary/30 border border-border space-y-2.5 text-xs">
                      <div className="space-y-1">
                        <Label className="text-[11px] font-semibold text-foreground">Custom Reset Method</Label>
                        <Select
                          value={addCustomMethod}
                          onValueChange={(val: any) => setAddCustomMethod(val)}
                        >
                          <SelectTrigger className="text-xs h-7">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daysOfWeek" className="text-xs">
                              Days of Week
                            </SelectItem>
                            <SelectItem value="daysOfMonth" className="text-xs">
                              Days of Month
                            </SelectItem>
                            <SelectItem value="intervalDays" className="text-xs">
                              Every X Days
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {addCustomMethod === "daysOfWeek" && (
                        <div className="space-y-1 pt-1.5 border-t border-border/50">
                          <Label className="text-[11px] font-semibold text-foreground">Days of Week</Label>
                          <div className="grid grid-cols-7 gap-1">
                            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((dayName, idx) => {
                              const isSel = addCustomDaysOfWeek.includes(idx);
                              return (
                                <button
                                  type="button"
                                  key={dayName}
                                  onClick={() =>
                                    setAddCustomDaysOfWeek((prev) =>
                                      prev.includes(idx) ? prev.filter((d) => d !== idx) : [...prev, idx],
                                    )
                                  }
                                  className={`py-1 rounded text-[10px] font-bold transition border ${
                                    isSel
                                      ? "bg-primary text-primary-foreground border-primary"
                                      : "bg-card text-muted-foreground border-border hover:bg-accent"
                                  }`}
                                >
                                  {dayName}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {addCustomMethod === "daysOfMonth" && (
                        <div className="space-y-1 pt-1.5 border-t border-border/50">
                          <Label className="text-[11px] font-semibold text-foreground">Days of Month (1 - 31)</Label>
                          <div className="grid grid-cols-7 gap-1 max-h-28 overflow-y-auto pr-1">
                            {Array.from({ length: 31 }, (_, i) => i + 1).map((num) => {
                              const isSel = addCustomDaysOfMonth.includes(num);
                              return (
                                <button
                                  type="button"
                                  key={num}
                                  onClick={() =>
                                    setAddCustomDaysOfMonth((prev) =>
                                      prev.includes(num) ? prev.filter((d) => d !== num) : [...prev, num],
                                    )
                                  }
                                  className={`py-1 rounded text-[10px] font-mono font-semibold transition border ${
                                    isSel
                                      ? "bg-emerald-500 text-white border-emerald-500"
                                      : "bg-card text-muted-foreground border-border hover:bg-accent"
                                  }`}
                                >
                                  {num}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {addCustomMethod === "intervalDays" && (
                        <div className="space-y-1 pt-1.5 border-t border-border/50">
                          <div className="flex items-center justify-between">
                            <Label className="text-[11px] font-semibold text-foreground">Every X Days</Label>
                            <span className="text-[10px] text-muted-foreground font-mono">Reset every {addIntervalDays} day(s)</span>
                          </div>
                          <Input
                            type="number"
                            min={1}
                            max={365}
                            value={addIntervalDays}
                            onChange={(e) => setAddIntervalDays(Math.max(1, parseInt(e.target.value) || 1))}
                            className="h-7 text-xs font-mono"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span>Urgency</span>
                      <span className="font-mono">{urgency}</span>
                    </div>
                    <Slider
                      min={0}
                      max={100}
                      value={[urgency]}
                      onValueChange={([v]) => setUrgency(v!)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span>Importance</span>
                      <span className="font-mono">{importance}</span>
                    </div>
                    <Slider
                      min={0}
                      max={100}
                      value={[importance]}
                      onValueChange={([v]) => setImportance(v!)}
                    />
                  </div>
                </div>

                <div className="pt-3 mt-2 border-t border-border shrink-0">
                  <Button onClick={addTaskHandler} disabled={!name.trim()} className="w-full text-xs font-semibold">
                    <Plus className="h-4 w-4 mr-1" />
                    {matrixPath.length === 0 ? "Create Task" : "Create Subtask"}
                  </Button>
                </div>
              </div>
            ) : taskSidebarMode === "embed-matrix" ? (
              /* Inline Embed Matrix Form in Sidebar */
              <div className="flex-1 min-h-0 flex flex-col justify-between p-3 rounded-xl bg-card border border-primary/40 overflow-hidden animate-in fade-in duration-200">
                <div className="flex-1 min-h-0 overflow-y-auto space-y-3 px-1 py-1">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setTaskSidebarMode("list")}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground font-semibold"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span>Back to Tasks</span>
                    </button>
                    <span className="text-xs font-bold uppercase text-primary tracking-wider">
                      Embed Matrix
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Select Matrix to Embed</Label>
                    {availableMatrices.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic py-3 text-center border border-dashed border-border rounded-xl">
                        No other matrices available to embed.
                      </p>
                    ) : (
                      <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                        {availableMatrices.map((m) => {
                          const isSel = nestTargetId === m.id;
                          return (
                            <div
                              key={m.id}
                              onClick={() => setNestTargetId(m.id)}
                              className={`p-2 rounded-lg border cursor-pointer transition flex items-center justify-between text-xs ${
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

                  <div className="space-y-1.5 pt-2 border-t border-border">
                    <Label className="text-xs">Embedding Mode</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setNestMode("link")}
                        className={`p-2 rounded-lg border text-left space-y-0.5 transition ${
                          nestMode === "link"
                            ? "bg-primary/10 border-primary text-foreground"
                            : "bg-secondary/20 border-border hover:bg-secondary/40 text-muted-foreground"
                        }`}
                      >
                        <div className="flex items-center gap-1 font-bold text-[11px]">
                          <Link className="h-3 w-3 text-primary" />
                          <span>Direct Link</span>
                        </div>
                        <p className="text-[9px] text-muted-foreground leading-tight">Live sync</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setNestMode("copy")}
                        className={`p-2 rounded-lg border text-left space-y-0.5 transition ${
                          nestMode === "copy"
                            ? "bg-primary/10 border-primary text-foreground"
                            : "bg-secondary/20 border-border hover:bg-secondary/40 text-muted-foreground"
                        }`}
                      >
                        <div className="flex items-center gap-1 font-bold text-[11px]">
                          <Copy className="h-3 w-3 text-cyan-400" />
                          <span>Make Copy</span>
                        </div>
                        <p className="text-[9px] text-muted-foreground leading-tight">Snapshot</p>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-3 mt-2 border-t border-border shrink-0">
                  <Button
                    onClick={() => {
                      if (nestTargetId && onConfirmNestMatrix) {
                        onConfirmNestMatrix(nestTargetId, nestMode);
                        setNestTargetId("");
                        setTaskSidebarMode("list");
                      }
                    }}
                    disabled={!nestTargetId}
                    className="w-full text-xs font-semibold"
                  >
                    <Sparkles className="h-4 w-4 mr-1" />
                    Embed Matrix
                  </Button>
                </div>
              </div>
            ) : (
              /* Tasks List Display */
              <div className="flex-1 min-h-0 flex flex-col gap-2 overflow-hidden">
                <div className="flex-1 min-h-0 overflow-y-auto space-y-2 -mr-1 pr-1">
                  {visibleTasks.length === 0 && (
                    <p className="text-sm text-muted-foreground italic text-center py-4">
                      {matrixPath.length > 0 ? "No subtasks yet." : "No tasks in this matrix."}
                    </p>
                  )}
                  {visibleTasks.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => selectTask(t.id)}
                      className={`group p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedId === t.id
                          ? "bg-accent border-primary"
                          : "bg-background/40 border-border hover:bg-accent/50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-sm truncate flex items-center gap-1.5">
                            {t.nestedMatrixId && (
                              <Grid3X3 className="h-3.5 w-3.5 text-primary shrink-0" />
                            )}
                            <span className="truncate">{t.name}</span>
                          </div>
                          {t.description && (
                            <div className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                              {t.description}
                            </div>
                          )}
                          <div className="flex flex-wrap gap-2 mt-1.5 text-[10px] font-mono text-muted-foreground">
                            <span>U: {t.urgency}</span>
                            <span>I: {t.importance}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {!readOnly && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 shrink-0 text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 hover:bg-emerald-500/25 hover:text-emerald-300 rounded-lg transition"
                              onClick={(e) => {
                                e.stopPropagation();
                                completeTaskHandler(t.id);
                              }}
                              title="Mark complete"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bottom Swapping Trigger Bar */}
                {!readOnly && (
                  <div className="pt-2 flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setTaskSidebarMode("embed-matrix")}
                      className="flex-1 text-xs gap-1 border-primary/30 text-primary hover:bg-primary/10"
                    >
                      <Grid3X3 className="h-3.5 w-3.5" />
                      <span>Embed Matrix</span>
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => setTaskSidebarMode("add-task")}
                      className="flex-1 text-xs font-semibold gap-1"
                    >
                      <Plus className="h-4 w-4" />
                      <span>{matrixPath.length === 0 ? "Add Task" : "Add Subtask"}</span>
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Recently Completed */}
        {activeTab === "completed" && (
          <div className="flex-1 min-h-0 overflow-y-auto space-y-2 -mr-1 pr-1">
            {state.completedTasks.length === 0 && (
              <p className="text-sm text-muted-foreground italic text-center py-4">
                No completed tasks yet.
              </p>
            )}
            {state.completedTasks.map((ct) => (
              <div
                key={ct.id}
                className="p-2.5 rounded-lg border border-border bg-background/20 flex items-center justify-between gap-2 text-xs"
              >
                <div className="min-w-0 flex-1">
                  <div className="line-through text-muted-foreground truncate">{ct.name}</div>
                  <div className="text-[10px] text-muted-foreground/70">
                    Done {formatCompletedAt(ct.completedAt)}
                  </div>
                </div>
                {!readOnly && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
                    onClick={() => reinstateTaskHandler(ct.id)}
                    title="Reinstate task"
                  >
                    <Undo2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: Matrix Members & Invitations */}
        {activeTab === "members" && (
          <div className="flex-1 min-h-0 overflow-y-auto space-y-4 p-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              <span>Matrix Collaborators</span>
            </h3>

            {memberActionMsg && (
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/30 text-primary text-xs font-medium">
                {memberActionMsg}
              </div>
            )}

            {/* Members List */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Current Members</Label>
              {!activeMatrix || (!activeMatrix.sharedEmails?.length && !activeMatrix.ownerId) ? (
                <p className="text-xs text-muted-foreground italic py-2">No active members.</p>
              ) : (
                <div className="space-y-1.5">
                  {/* Owner */}
                  <div className="p-2 rounded-lg border border-border bg-card/60 flex items-center justify-between text-xs">
                    <div className="min-w-0">
                      <span className="font-semibold truncate block">
                        {activeMatrix.ownerId === currentUserId ? "You (Owner)" : "Matrix Owner"}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/20 text-primary">
                      Owner
                    </span>
                  </div>

                  {/* Collaborators */}
                  {activeMatrix.sharedEmails?.map((email) => {
                    const role = activeMatrix.collaboratorRoles?.[email.toLowerCase()] || "viewer";
                    return (
                      <div
                        key={email}
                        className="p-2 rounded-lg border border-border bg-card/40 flex items-center justify-between gap-2 text-xs"
                      >
                        <span className="truncate font-medium flex-1">{email}</span>
                        {isOwner ? (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <Select
                              value={role}
                              onValueChange={(val: "viewer" | "editor") => handleUpdateRole(email, val)}
                            >
                              <SelectTrigger className="h-7 text-[10px] w-20">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="viewer" className="text-[10px]">
                                  Viewer
                                </SelectItem>
                                <SelectItem value="editor" className="text-[10px]">
                                  Editor
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleRemoveUser(email)}
                              className="h-7 w-7 text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-secondary text-muted-foreground capitalize">
                            {role}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Invite New User Search Bar */}
            {!readOnly && (
              <div className="space-y-3 pt-3 border-t border-border">
                <Label className="text-xs font-bold uppercase tracking-wider text-primary block mb-1">
                  Invite New Member
                </Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search by name or email..."
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    className="pl-8 text-xs h-8"
                  />
                </div>

                {memberSearch.trim() && (
                  <div className="space-y-1.5 mt-2 max-h-36 overflow-y-auto pr-1">
                    {searchResults.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic text-center py-2">
                        No registered users found.
                      </p>
                    ) : (
                      searchResults.map((u) => {
                        const isAlreadyMember = activeMatrix?.sharedEmails?.includes(u.email.toLowerCase());
                        return (
                          <div
                            key={u.uid}
                            className="p-2 rounded-lg border border-border bg-card/60 flex items-center justify-between gap-2 text-xs"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold truncate">
                                {u.displayName || u.email}
                              </div>
                              <div className="text-[10px] text-muted-foreground truncate">
                                {u.email}
                              </div>
                            </div>
                            {isAlreadyMember ? (
                              <span className="text-[10px] text-emerald-400 font-semibold">
                                Joined
                              </span>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Select
                                  value={selectedInviteRole}
                                  onValueChange={(val: "viewer" | "editor") => setSelectedInviteRole(val)}
                                >
                                  <SelectTrigger className="h-7 text-[10px] w-24 px-2.5">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="viewer" className="text-[10px]">
                                      Viewer
                                    </SelectItem>
                                    <SelectItem value="editor" className="text-[10px]">
                                      Editor
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                                <Button
                                  size="sm"
                                  onClick={() => handleInviteUser(u)}
                                  className="h-7 text-[10px] px-2.5 font-semibold"
                                >
                                  Invite
                                </Button>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        {activeTab === "settings" && (
          <div className="flex-1 min-h-0 overflow-y-auto space-y-4 p-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-primary">
              Matrix Configuration
            </h3>

            <div className="space-y-1">
              <Label className="text-xs">Matrix Name</Label>
              <Input
                type="text"
                value={activeMatrix?.name || ""}
                onChange={(e) => {
                  if (activeMatrix && onSaveMatrixSettings) {
                    onSaveMatrixSettings(
                      e.target.value,
                      activeMatrix.description || "",
                      activeMatrix.schedule || { type: "none" },
                    );
                  }
                }}
                className="text-xs"
                disabled={readOnly}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Description</Label>
              <Textarea
                rows={2}
                value={activeMatrix?.description || ""}
                onChange={(e) => {
                  if (activeMatrix && onSaveMatrixSettings) {
                    onSaveMatrixSettings(
                      activeMatrix.name,
                      e.target.value,
                      activeMatrix.schedule || { type: "none" },
                    );
                  }
                }}
                className="text-xs resize-none"
                disabled={readOnly}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Default Task Reset Schedule</Label>
              <Select
                value={activeMatrix?.schedule?.type || "none"}
                onValueChange={(typeVal: any) => {
                  if (activeMatrix && onSaveMatrixSettings) {
                    onSaveMatrixSettings(activeMatrix.name, activeMatrix.description || "", {
                      type: typeVal,
                      activeAt: Date.now(),
                      lastResetAt: Date.now(),
                    });
                  }
                }}
                disabled={readOnly}
              >
                <SelectTrigger className="text-xs h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" className="text-xs">
                    Manual reset
                  </SelectItem>
                  <SelectItem value="daily" className="text-xs">
                    Daily Reset
                  </SelectItem>
                  <SelectItem value="weekly" className="text-xs">
                    Weekly Reset
                  </SelectItem>
                  <SelectItem value="monthly" className="text-xs">
                    Monthly Reset
                  </SelectItem>
                  <SelectItem value="custom" className="text-xs">
                    Custom Reset Interval
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
