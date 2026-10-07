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
    <div class="app-shell min-h-screen flex">
      <!-- Dark Sidebar -->
      <app-sidebar [isOpen]="isSidebarOpen" (closeSidebar)="isSidebarOpen = false"></app-sidebar>

      <!-- Main Workspace (Light Workspace) -->
      <div class="flex-1 flex flex-col md:pl-64 min-w-0">
        <app-header (toggleSidebar)="isSidebarOpen = !isSidebarOpen"></app-header>

        <main class="app-main flex-1 px-4 md:px-8 w-full mx-auto">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `
})
export class AppLayoutComponent {
  isSidebarOpen = false;
}
