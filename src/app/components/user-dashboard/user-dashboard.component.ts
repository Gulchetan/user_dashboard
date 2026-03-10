import { Component, OnInit, OnDestroy, ViewChild, ElementRef, ViewContainerRef, ComponentRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { User, RoleDistribution } from '../../models/user.model';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-dashboard.component.html',
  styleUrls: ['./user-dashboard.component.css']
})
export class UserDashboardComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('chartCanvas', { static: false }) chartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('modalContainer', { read: ViewContainerRef }) modalContainer!: ViewContainerRef;

  users: User[] = [];
  filteredUsers: User[] = [];
  paginatedUsers: User[] = [];
  showModal = false;
  isLoading = false;
  chart: any;
  userFormComponent: any = null;
  private userFormRef: ComponentRef<any> | null = null;
  private destroy$ = new Subject<void>();

  // Pagination stuff
  currentPage = 1;
  pageSize = 5;
  totalPages = 1;

  // Search and filter
  searchTerm = '';
  selectedRole = '';

  constructor(private userService: UserService) { }

  ngOnInit(): void {
    this.isLoading = true;
    this.userService.users$
      .pipe(takeUntil(this.destroy$))
      .subscribe(users => {
        this.users = users;
        this.applyFilters();
        this.updateChart();
        this.isLoading = false;
      });
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.updateChart(), 0);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.chart) {
      this.chart.destroy();
    }
  }

  async openModal(): Promise<void> {
    this.showModal = true;
    // Load form component only when needed
    const { UserFormComponent } = await import('../user-form/user-form.component');
    this.userFormComponent = UserFormComponent;

    if (this.modalContainer) {
      this.modalContainer.clear();
      this.userFormRef = this.modalContainer.createComponent(UserFormComponent);

      // Wire up form events
      this.userFormRef.instance.userSubmitted.subscribe((user: Omit<User, 'id'>) => {
        this.onUserSubmitted(user);
      });

      this.userFormRef.instance.closeModal.subscribe(() => {
        this.closeModal();
      });
    }
  }

  closeModal(): void {
    this.showModal = false;
    this.userFormComponent = null;
    if (this.userFormRef) {
      this.userFormRef.destroy();
      this.userFormRef = null;
    }
    if (this.modalContainer) {
      this.modalContainer.clear();
    }
  }

  async onUserSubmitted(user: Omit<User, 'id'>): Promise<void> {
    this.isLoading = true;
    this.userService.addUser(user);
    this.closeModal();
    // Quick delay for smooth UX
    setTimeout(() => {
      this.isLoading = false;
    }, 300);
  }

  applyFilters(): void {
    this.filteredUsers = this.users.filter(user => {
      const matchesSearch = !this.searchTerm ||
        user.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchesRole = !this.selectedRole || user.role === this.selectedRole;

      return matchesSearch && matchesRole;
    });

    this.totalPages = Math.ceil(this.filteredUsers.length / this.pageSize);
    this.currentPage = Math.min(this.currentPage, Math.max(1, this.totalPages));
    this.updatePagination();
  }

  updatePagination(): void {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedUsers = this.filteredUsers.slice(startIndex, endIndex);
  }

  onSearchChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  onRoleFilterChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  nextPage(): void {
    this.goToPage(this.currentPage + 1);
  }

  previousPage(): void {
    this.goToPage(this.currentPage - 1);
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  private async updateChart(): Promise<void> {
    if (!this.chartCanvas) return;

    const roleDistribution = this.calculateRoleDistribution();

    // Load Chart.js on demand
    const { Chart, registerables } = await import('chart.js');

    if (!Chart.getChart(this.chartCanvas.nativeElement)) {
      Chart.register(...registerables);
    }

    if (this.chart) {
      this.chart.destroy();
    }

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (ctx) {
      this.chart = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: ['Admin', 'Editor', 'Viewer'],
          datasets: [{
            data: [
              roleDistribution.Admin,
              roleDistribution.Editor,
              roleDistribution.Viewer
            ],
            backgroundColor: ['#1c4980', '#383838', '#6c757d']
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom'
            },
            title: {
              display: true,
              text: 'User Role Distribution'
            }
          }
        }
      });
    }
  }

  private calculateRoleDistribution(): RoleDistribution {
    return this.users.reduce((acc, user) => {
      acc[user.role]++;
      return acc;
    }, { Admin: 0, Editor: 0, Viewer: 0 } as RoleDistribution);
  }
}
