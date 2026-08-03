import {
  createTask,
  addTask,
  completeTask,
  reinstateTask,
  deleteTask,
  findTask,
  getTasksAtPath,
  pruneMatrixPath,
  cloneTaskTreeWithNewIds,
  defaultState,
  type EisenhowerState,
} from "@/lib/eisenhower-storage";


describe("eisenhower-storage core logic", () => {
  it("should create a task with default parameters", () => {
    const task = createTask({ name: "Test Task" });
    expect(task.name).toBe("Test Task");
    expect(task.urgency).toBe(50);
    expect(task.importance).toBe(50);
    expect(task.subtasks).toEqual([]);
    expect(task.id).toBeDefined();
  });

  it("should add a task to root level", () => {
    const initial = defaultState();
    const task = createTask({ name: "Root Task" });
    const updated = addTask(initial, null, task);

    expect(updated.tasks.length).toBe(1);
    expect(updated.tasks[0]?.name).toBe("Root Task");
  });

  it("should add a subtask to an existing task", () => {
    const initial = defaultState();
    const parent = createTask({ name: "Parent" });
    const stateWithParent = addTask(initial, null, parent);

    const subtask = createTask({ name: "Subtask" });
    const stateWithSub = addTask(stateWithParent, parent.id, subtask);

    const foundParent = findTask(stateWithSub, parent.id);
    expect(foundParent?.subtasks.length).toBe(1);
    expect(foundParent?.subtasks[0]?.name).toBe("Subtask");
  });

  it("should complete a task and move it to completedTasks", () => {
    const initial = defaultState();
    const task = createTask({ name: "Task to complete" });
    const stateWithTask = addTask(initial, null, task);

    const completedState = completeTask(stateWithTask, task.id);
    expect(completedState.tasks.length).toBe(0);
    expect(completedState.completedTasks.length).toBe(1);
    expect(completedState.completedTasks[0]?.id).toBe(task.id);
    expect(completedState.completedTasks[0]?.isCompleted).toBe(true);
  });

  it("should reinstate a completed task back to tasks list", () => {
    const initial = defaultState();
    const task = createTask({ name: "Task to reinstate" });
    const stateWithTask = addTask(initial, null, task);
    const completedState = completeTask(stateWithTask, task.id);

    const reinstatedState = reinstateTask(completedState, task.id);
    expect(reinstatedState.completedTasks.length).toBe(0);
    expect(reinstatedState.tasks.length).toBe(1);
    expect(reinstatedState.tasks[0]?.isCompleted).toBe(false);
  });

  it("should delete a task from state", () => {
    const initial = defaultState();
    const task = createTask({ name: "Task to delete" });
    const stateWithTask = addTask(initial, null, task);

    const deletedState = deleteTask(stateWithTask, task.id);
    expect(deletedState.tasks.length).toBe(0);
  });

  it("should retrieve tasks at given path", () => {
    const parent = createTask({ name: "Parent" });
    const subtask = createTask({ name: "Child" });
    let state = addTask(defaultState(), null, parent);
    state = addTask(state, parent.id, subtask);

    const rootTasks = getTasksAtPath(state, []);
    expect(rootTasks.length).toBe(1);
    expect(rootTasks[0]?.id).toBe(parent.id);

    const childTasks = getTasksAtPath(state, [parent.id]);
    expect(childTasks.length).toBe(1);
    expect(childTasks[0]?.id).toBe(subtask.id);
  });

  it("should prune invalid matrix path segments", () => {
    const parent = createTask({ name: "Parent" });
    const state = addTask(defaultState(), null, parent);

    const validPath = pruneMatrixPath(state, [parent.id, "non-existent-id"]);
    expect(validPath).toEqual([parent.id]);
  });

  it("should clone task tree with new IDs", () => {
    const parent = createTask({ name: "Parent" });
    const subtask = createTask({ name: "Child" });
    parent.subtasks = [subtask];

    const cloned = cloneTaskTreeWithNewIds([parent]);
    expect(cloned.length).toBe(1);
    expect(cloned[0]?.name).toBe("Parent");
    expect(cloned[0]?.id).not.toBe(parent.id);
    expect(cloned[0]?.subtasks[0]?.id).not.toBe(subtask.id);
  });
});
