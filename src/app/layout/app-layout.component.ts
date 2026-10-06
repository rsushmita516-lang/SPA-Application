import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from './header.component.js';
import { SidebarComponent } from './sidebar.component.js';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent, SidebarComponent],
  template: `
    <div class="min-h-screen bg-slate-50 flex">
      <!-- Dark Sidebar -->
      <app-sidebar [isOpen]="isSidebarOpen" (closeSidebar)="isSidebarOpen = false"></app-sidebar>

      <!-- Main Workspace (Light Workspace) -->
      <div class="flex-1 flex flex-col md:pl-64 min-w-0">
        <app-header (toggleSidebar)="isSidebarOpen = !isSidebarOpen"></app-header>

        <main class="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `
})
export class AppLayoutComponent {
  isSidebarOpen = false;
}
