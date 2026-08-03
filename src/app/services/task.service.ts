import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface MatrixTask {
  id: string;
  title: string;
  quadrant: 'do' | 'schedule' | 'delegate' | 'delete';
}

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  tasks$ = new BehaviorSubject<MatrixTask[]>([
    { id: '1', title: 'Submit quarterly budget proposal', quadrant: 'do' },
    { id: '2', title: 'Plan weekly workout schedule', quadrant: 'schedule' },
    { id: '3', title: 'Respond to routine team check-in emails', quadrant: 'delegate' },
    { id: '4', title: 'Clean up desktop downloads folder', quadrant: 'delete' }
  ]);

  getTasks(quadrant: 'do' | 'schedule' | 'delegate' | 'delete'): MatrixTask[] {
    return this.tasks$.value.filter(t => t.quadrant === quadrant);
  }

  addTask(title: string, quadrant: 'do' | 'schedule' | 'delegate' | 'delete') {
    const current = this.tasks$.value;
    this.tasks$.next([...current, { id: Date.now().toString(), title, quadrant }]);
  }

  deleteTask(id: string) {
    const current = this.tasks$.value;
    this.tasks$.next(current.filter(t => t.id !== id));
  }
}
