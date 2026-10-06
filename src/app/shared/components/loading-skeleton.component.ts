import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-skeleton',
  standalone: true,
  imports: [CommonModule],
  inputs: ['rows', 'className'],
  template: `
    <div class="w-full space-y-3 animate-pulse" [ngClass]="className">
      <div *ngFor="let row of rowArray" class="flex gap-4 items-center">
        <div
          *ngFor="let width of getWidths(row)"
          class="h-4 bg-slate-200 rounded"
          [style.width]="width"
        ></div>
      </div>
    </div>
  `
})
export class LoadingSkeletonComponent {
  @Input() rows: number = 4;
  @Input() className: string = '';

  get rowArray(): number[] {
    return Array.from({ length: this.rows }, (_, i) => i);
  }

  getWidths(rowIndex: number): string[] {
    const patterns = [
      ['20%', '35%', '15%', '15%', '15%'],
      ['18%', '40%', '12%', '18%', '12%'],
      ['22%', '30%', '18%', '14%', '16%'],
      ['15%', '38%', '16%', '15%', '16%'],
    ];
    return patterns[rowIndex % patterns.length];
  }
}
