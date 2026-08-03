import 'zone.js';
import { bootstrapApplication } from '@angular/platform-browser';
import { Component, ChangeDetectorRef, type OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskService, type MatrixTask } from './app/services/task.service';
import './styles.scss';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div style="min-height: 100vh; display: flex; flex-direction: column; background-color: #0f172a; color: #f8fafc;">
      <!-- Matrix Header -->
      <header class="matrix-header">
        <div class="header-content">
          <h1>📊 EISENHOWER MATRICES</h1>
          <button class="btn btn-primary" (click)="isAddingTask = true">+ Add Task</button>
        </div>
      </header>

      <!-- Task Creation Form -->
      <div *ngIf="isAddingTask" style="max-width: 600px; margin: 24px auto 0; width: 100%; padding: 0 24px; box-sizing: border-box;">
        <div style="background: #1e293b; border: 1px solid #334155; padding: 20px; border-radius: 12px;">
          <h3 style="margin-top: 0;">Create New Task</h3>
          <input type="text" [(ngModel)]="newTaskTitle" placeholder="Task description..." class="input-field" style="margin-bottom: 12px;">
          
          <label style="font-size: 12px; font-weight: 700; display: block; margin-bottom: 6px;">QUADRANT</label>
          <select [(ngModel)]="newTaskQuadrant" class="input-field" style="margin-bottom: 16px;">
            <option value="do">🔥 Urgent & Important (Do First)</option>
            <option value="schedule">📅 Not Urgent & Important (Schedule)</option>
            <option value="delegate">⚡ Urgent & Not Important (Delegate)</option>
            <option value="delete">🗑️ Not Urgent & Not Important (Delete)</option>
          </select>

          <div style="display: flex; gap: 12px;">
            <button class="btn btn-primary" (click)="addTask()">Save Task</button>
            <button class="btn" style="background: #334155; color: #fff;" (click)="isAddingTask = false">Cancel</button>
          </div>
        </div>
      </div>

      <!-- 4 Quadrant Grid -->
      <main class="matrix-grid">
        <!-- Quadrant 1: DO FIRST -->
        <div class="quadrant do-first">
          <div class="quadrant-title">
            <span>🔥 DO FIRST</span>
            <span style="font-size: 12px; opacity: 0.8;">Urgent & Important</span>
          </div>
          <div *ngFor="let task of taskService.getTasks('do')" class="task-card">
            <span class="task-text">{{ task.title }}</span>
            <button class="btn btn-danger" style="padding: 4px 8px; font-size: 11px;" (click)="taskService.deleteTask(task.id)">X</button>
          </div>
        </div>

        <!-- Quadrant 2: SCHEDULE -->
        <div class="quadrant schedule">
          <div class="quadrant-title">
            <span>📅 SCHEDULE</span>
            <span style="font-size: 12px; opacity: 0.8;">Not Urgent & Important</span>
          </div>
          <div *ngFor="let task of taskService.getTasks('schedule')" class="task-card">
            <span class="task-text">{{ task.title }}</span>
            <button class="btn btn-danger" style="padding: 4px 8px; font-size: 11px;" (click)="taskService.deleteTask(task.id)">X</button>
          </div>
        </div>

        <!-- Quadrant 3: DELEGATE -->
        <div class="quadrant delegate">
          <div class="quadrant-title">
            <span>⚡ DELEGATE</span>
            <span style="font-size: 12px; opacity: 0.8;">Urgent & Not Important</span>
          </div>
          <div *ngFor="let task of taskService.getTasks('delegate')" class="task-card">
            <span class="task-text">{{ task.title }}</span>
            <button class="btn btn-danger" style="padding: 4px 8px; font-size: 11px;" (click)="taskService.deleteTask(task.id)">X</button>
          </div>
        </div>

        <!-- Quadrant 4: DON'T DO -->
        <div class="quadrant dont-do">
          <div class="quadrant-title">
            <span>🗑️ DON'T DO</span>
            <span style="font-size: 12px; opacity: 0.8;">Not Urgent & Not Important</span>
          </div>
          <div *ngFor="let task of taskService.getTasks('delete')" class="task-card">
            <span class="task-text">{{ task.title }}</span>
            <button class="btn btn-danger" style="padding: 4px 8px; font-size: 11px;" (click)="taskService.deleteTask(task.id)">X</button>
          </div>
        </div>
      </main>

      <!-- Footer -->
      <footer class="jk-footer">
        <a href="https://jordankatz.dev" target="_blank" rel="noopener">a Jordan Katz project</a>
      </footer>
    </div>
  `
})
export class AppComponent implements OnInit {
  isAddingTask = false;
  newTaskTitle = '';
  newTaskQuadrant: 'do' | 'schedule' | 'delegate' | 'delete' = 'do';

  constructor(public taskService: TaskService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.taskService.tasks$.subscribe(() => {
      this.cdr.detectChanges();
    });
  }

  addTask() {
    if (!this.newTaskTitle.trim()) return;
    this.taskService.addTask(this.newTaskTitle.trim(), this.newTaskQuadrant);
    this.newTaskTitle = '';
    this.isAddingTask = false;
    this.cdr.detectChanges();
  }
}

bootstrapApplication(AppComponent);
