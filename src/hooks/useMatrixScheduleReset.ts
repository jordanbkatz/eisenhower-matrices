import { useEffect } from "react";
import type { User } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { COLLECTIONS } from "@/lib/firebase/paths";
import { reinstateTask, type EisenhowerState, type MatrixDoc, type MatrixSchedule } from "@/lib/eisenhower-storage";

export function useMatrixScheduleReset(
  activeMatrix: MatrixDoc | null,
  user: User | null,
  guestMatrices: MatrixDoc[],
  saveGuestMatrices: (list: MatrixDoc[]) => void,
) {
  useEffect(() => {
    if (
      !activeMatrix ||
      !activeMatrix.schedule ||
      activeMatrix.schedule.type === "none" ||
      activeMatrix.schedule.type === "one-time"
    ) {
      return;
    }

    const { type, lastResetAt, customMethod, intervalDays, customDaysOfWeek, customDays } =
      activeMatrix.schedule;
    const now = Date.now();
    let isResetDue = false;

    if (type === "daily") {
      isResetDue = !lastResetAt || now - lastResetAt >= 86400000;
    } else if (type === "weekly") {
      isResetDue = !lastResetAt || now - lastResetAt >= 7 * 86400000;
    } else if (type === "monthly") {
      isResetDue = !lastResetAt || now - lastResetAt >= 30 * 86400000;
    } else if (type === "custom") {
      const todayStr = new Date().toDateString();
      const lastResetDay = lastResetAt ? new Date(lastResetAt).toDateString() : "";

      if (customMethod === "intervalDays" || (!customMethod && intervalDays)) {
        isResetDue = !lastResetAt || now - lastResetAt >= (intervalDays || 1) * 86400000;
      } else if (customMethod === "daysOfWeek" || (!customMethod && customDaysOfWeek?.length)) {
        const todayIdx = new Date().getDay();
        isResetDue = (customDaysOfWeek || []).includes(todayIdx) && lastResetDay !== todayStr;
      } else if (customMethod === "daysOfMonth" || (!customMethod && customDays?.length)) {
        const todayNum = new Date().getDate();
        isResetDue = (customDays || []).includes(todayNum) && lastResetDay !== todayStr;
      } else {
        isResetDue = !lastResetAt || now - lastResetAt >= 86400000;
      }
    }

    if (isResetDue) {
      if (activeMatrix.completedTasks && activeMatrix.completedTasks.length > 0) {
        let currentState: EisenhowerState = {
          tasks: activeMatrix.tasks || [],
          completedTasks: activeMatrix.completedTasks,
        };
        for (const ct of activeMatrix.completedTasks) {
          currentState = reinstateTask(currentState, ct.id);
        }
        const newState = currentState;
        const updatedSchedule: MatrixSchedule = {
          ...activeMatrix.schedule,
          lastResetAt: now,
        };

        if (user) {
          const docRef = doc(db, COLLECTIONS.MATRICES, activeMatrix.id);
          updateDoc(docRef, {
            tasks: newState.tasks,
            completedTasks: newState.completedTasks,
            schedule: updatedSchedule,
            updatedAt: now,
          });
        } else {
          const updated = guestMatrices.map((m) =>
            m.id === activeMatrix.id
              ? {
                  ...m,
                  tasks: newState.tasks,
                  completedTasks: newState.completedTasks,
                  schedule: updatedSchedule,
                  updatedAt: now,
                }
              : m,
          );
          saveGuestMatrices(updated);
        }
      }
    }
  }, [activeMatrix, user, guestMatrices, saveGuestMatrices]);
}
