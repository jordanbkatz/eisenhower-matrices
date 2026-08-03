export type Task = {
  id: string;
  name: string;
  description: string;
  urgency: number; // 0-100
  importance: number; // 0-100
  subtasks: Task[];
  nestedMatrixId?: string;
  nestMode?: "link" | "copy";
  schedule?: MatrixSchedule;
  isCompleted?: boolean;
  parentId?: string | null;
};

export type CompletedTask = Task & {
  completedAt: number;
  parentId?: string | null;
};

export type EisenhowerState = {
  tasks: Task[];
  completedTasks: CompletedTask[];
};

export type MatrixSchedule = {
  type: "none" | "one-time" | "daily" | "weekly" | "monthly" | "custom";
  activeAt?: number;
  dueAt?: number;
  lastResetAt?: number;
  customMethod?: "daysOfWeek" | "daysOfMonth" | "intervalDays";
  intervalDays?: number; // Custom interval in days: e.g. 3
  customDays?: number[]; // Days of month: e.g. [1, 15, 30]
  customDaysOfWeek?: number[]; // 0=Sun, 1=Mon, 2=Tue, ..., 6=Sat
};

export type MatrixDoc = {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  ownerEmail?: string;
  memberUids: string[];
  sharedEmails: string[];
  collaboratorRoles?: { [email: string]: "viewer" | "editor" };
  schedule?: MatrixSchedule;
  tasks: Task[];
  completedTasks: CompletedTask[];
  createdAt: number;
  updatedAt: number;
  isNestedOnly?: boolean;
};

/** @deprecated Legacy shape — used only when migrating saved data. */
type LegacyTaskSet = {
  id: string;
  name: string;
  tasks: Task[];
  completedTasks: CompletedTask[];
};

type LegacyEisenhowerState = {
  sets: LegacyTaskSet[];
  activeSetId: string;
};

const KEY = "eisenhower_matrix_app_v1_state";
export const MAX_COMPLETED_TASKS = 20;

export function loadState(): EisenhowerState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultState();
    return normalizeState(JSON.parse(raw));
  } catch {
    return defaultState();
  }
}

export function saveState(state: EisenhowerState) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function defaultState(): EisenhowerState {
  return { tasks: [], completedTasks: [] };
}

function normalizeState(parsed: unknown): EisenhowerState {
  if (!parsed || typeof parsed !== "object") return defaultState();
  const p = parsed as Record<string, unknown>;

  if (Array.isArray(p.tasks)) {
    return {
      tasks: p.tasks.map((t) => migrateTask(t as Task)),
      completedTasks: ((p.completedTasks as CompletedTask[]) ?? []).map(migrateTask),
    };
  }

  const legacy = parsed as LegacyEisenhowerState;
  if (legacy.sets?.length) {
    const active = legacy.sets.find((s) => s.id === legacy.activeSetId) ?? legacy.sets[0]!;
    return {
      tasks: (active.tasks ?? []).map(migrateTask),
      completedTasks: (active.completedTasks ?? []).map(migrateTask),
    };
  }

  return defaultState();
}

export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function cleanForFirestore<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

export function cloneTaskTreeWithNewIds(tasks: Task[], newParentId: string | null = null): Task[] {
  return tasks.map((t) => {
    const newId = uid();
    const cloned: Task = {
      ...t,
      id: newId,
      parentId: newParentId,
      subtasks: cloneTaskTreeWithNewIds(t.subtasks ?? [], newId),
    };
    return cleanForFirestore(cloned);
  });
}

export function createTask(
  partial: Pick<Task, "name"> & Partial<Omit<Task, "id" | "name">>,
): Task {
  const task: Task = {
    id: uid(),
    name: partial.name,
    description: partial.description ?? "",
    urgency: partial.urgency ?? 50,
    importance: partial.importance ?? 50,
    subtasks: partial.subtasks ?? [],
  };
  if (partial.nestedMatrixId) task.nestedMatrixId = partial.nestedMatrixId;
  if (partial.nestMode) task.nestMode = partial.nestMode;
  if (partial.schedule) task.schedule = partial.schedule;
  if (partial.isCompleted !== undefined) task.isCompleted = partial.isCompleted;
  if (partial.parentId !== undefined) task.parentId = partial.parentId;
  return cleanForFirestore(task);
}

function migrateTask<T extends Task>(task: T): T {
  const raw = task as T & { subtasks?: Task[] };
  return {
    ...raw,
    subtasks: (raw.subtasks ?? []).map(migrateTask),
  };
}

export function findTask(state: EisenhowerState, taskId: string): Task | null {
  for (const task of state.tasks) {
    const found = findTaskInTree(task, taskId);
    if (found) return found;
  }
  return null;
}

export function findTaskParentId(tasks: Task[], taskId: string, currentParentId: string | null = null): string | null {
  for (const task of tasks) {
    if (task.id === taskId) return currentParentId;
    if (task.subtasks && task.subtasks.length > 0) {
      const found = findTaskParentId(task.subtasks, taskId, task.id);
      if (found !== null) return found;
    }
  }
  return null;
}

function findTaskInTree(task: Task, taskId: string): Task | null {
  if (task.id === taskId) return task;
  for (const sub of task.subtasks) {
    const found = findTaskInTree(sub, taskId);
    if (found) return found;
  }
  return null;
}

/** Tasks shown on the matrix for a drill-down path (empty = root). */
export function getTasksAtPath(state: EisenhowerState, path: string[]): Task[] {
  if (path.length === 0) return state.tasks;
  const parent = findTask(state, path[path.length - 1]!);
  return parent?.subtasks ?? [];
}

/** Drop path segments that no longer exist in the tree. */
export function pruneMatrixPath(state: EisenhowerState, path: string[]): string[] {
  const out: string[] = [];
  let siblings = state.tasks;
  for (const id of path) {
    const task = siblings.find((t) => t.id === id);
    if (!task) break;
    out.push(id);
    siblings = task.subtasks;
  }
  return out;
}

export function mapTask(
  state: EisenhowerState,
  taskId: string,
  updater: (task: Task) => Task,
): EisenhowerState {
  return {
    ...state,
    tasks: state.tasks.map((t) => mapTaskInTree(t, taskId, updater)),
  };
}

function mapTaskInTree(task: Task, taskId: string, updater: (task: Task) => Task): Task {
  const next = task.id === taskId ? updater(task) : task;
  return {
    ...next,
    subtasks: next.subtasks.map((st) => mapTaskInTree(st, taskId, updater)),
  };
}

function removeTaskFromList(tasks: Task[], taskId: string): Task[] {
  return tasks
    .filter((t) => t.id !== taskId)
    .map((t) => ({ ...t, subtasks: removeTaskFromList(t.subtasks, taskId) }));
}

/** Parent id for a new task: selected task, else matrix container, else root. */
export function resolveAddParentId(
  state: EisenhowerState,
  path: string[],
  selectedId: string | null,
  visibleTaskIds: Set<string>,
): string | null {
  if (selectedId && visibleTaskIds.has(selectedId)) return selectedId;
  if (path.length > 0) return path[path.length - 1]!;
  return null;
}

export function addTask(
  state: EisenhowerState,
  parentId: string | null,
  task: Task,
): EisenhowerState {
  const taskWithParent = { ...task, parentId: parentId ?? null };
  if (!parentId) return { ...state, tasks: [...state.tasks, taskWithParent] };
  return mapTask(state, parentId, (t) => ({ ...t, subtasks: [...t.subtasks, taskWithParent] }));
}

export function completeTask(
  state: EisenhowerState,
  taskId: string,
  _matrixSchedule?: MatrixSchedule,
): EisenhowerState {
  const task = findTask(state, taskId);
  if (!task) return state;

  const parentId = findTaskParentId(state.tasks, taskId) ?? task.parentId ?? null;
  const completed: CompletedTask = {
    ...task,
    parentId,
    isCompleted: true,
    completedAt: Date.now(),
  };

  return {
    ...state,
    tasks: removeTaskFromList(state.tasks, taskId),
    completedTasks: [completed, ...state.completedTasks].slice(0, MAX_COMPLETED_TASKS),
  };
}

export function reinstateTask(state: EisenhowerState, taskId: string): EisenhowerState {
  const completed = state.completedTasks.find((t) => t.id === taskId);
  if (!completed) return state;
  const { completedAt: _, ...task } = completed;
  const restoredTask: Task = { ...task, isCompleted: false };
  const parentId = completed.parentId ?? restoredTask.parentId ?? null;

  let nextTasks = state.tasks;
  if (parentId && findTask(state, parentId)) {
    nextTasks = mapTask(state, parentId, (t) => ({
      ...t,
      subtasks: [...(t.subtasks ?? []), restoredTask],
    })).tasks;
  } else {
    nextTasks = [...state.tasks, restoredTask];
  }

  return {
    ...state,
    tasks: nextTasks,
    completedTasks: state.completedTasks.filter((t) => t.id !== taskId),
  };
}

export function deleteTask(state: EisenhowerState, taskId: string): EisenhowerState {
  return {
    tasks: removeTaskFromList(state.tasks, taskId),
    completedTasks: state.completedTasks.filter((t) => t.id !== taskId),
  };
}
