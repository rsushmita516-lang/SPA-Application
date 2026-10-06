import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  inputs: ['status'],
  template: `
    <span
      class="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium rounded border"
      [ngClass]="getBadgeClass()"
    >
      <span class="w-1.5 h-1.5 rounded-full" [ngClass]="getDotClass()"></span>
      {{ status }}
    </span>
  `
})
export class StatusBadgeComponent {
  @Input() status: string = 'Open';

  getBadgeClass(): string {
    switch (this.status) {
      case 'Active':
      case 'Completed':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'In Progress':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'Open':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Inactive':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  }

  getDotClass(): string {
    switch (this.status) {
      case 'Active':
      case 'Completed':
        return 'bg-emerald-600';
      case 'In Progress':
        return 'bg-blue-600 animate-pulse';
      case 'Open':
        return 'bg-amber-500';
      case 'Inactive':
        return 'bg-rose-500';
      default:
        return 'bg-slate-400';
    }
  }
}
