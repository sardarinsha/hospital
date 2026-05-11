import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Permission, Role } from '@hospital/shared';
import { MenuItem } from 'primeng/api';
import { Menubar } from 'primeng/menubar';
import { Toast } from 'primeng/toast';
import { AuthService } from '../core/auth.service';
import { APP_BRANDING } from '../core/branding';
import { TrialService } from '../core/trial.service';

@Component({
  selector: 'app-shell',
  imports: [RouterModule, Menubar, Toast, DatePipe],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent implements OnInit {
  readonly auth = inject(AuthService);
  readonly trial = inject(TrialService);

  readonly branding = APP_BRANDING;

  ngOnInit(): void {
    void this.trial.refresh();
  }

  readonly menuModel = computed((): MenuItem[] => {
    const u = this.auth.user();
    const items: MenuItem[] = [];

    if (u?.role === Role.DOCTOR) {
      items.push(
        { label: 'Lab', icon: 'pi pi-flask', routerLink: ['/lab'] },
        {
          label: 'Patients',
          icon: 'pi pi-users',
          routerLink: ['/patients'],
        },
      );
    } else {
      items.push(
        {
          label:
            u?.role === Role.ADMIN
              ? 'Admin overview'
              : u?.role === Role.RECEPTIONIST
                ? 'Front desk'
                : 'Lab',
          icon: 'pi pi-home',
          routerLink: [this.auth.homePath()],
        },
        {
          label: 'Patients',
          icon: 'pi pi-users',
          routerLink: ['/patients'],
        },
      );
    }
    if (this.auth.hasPermission(Permission.PATIENT_REGISTER)) {
      items.push({
        label: 'Register patient',
        icon: 'pi pi-user-plus',
        routerLink: ['/patients/new'],
      });
    }
    if (this.auth.hasPermission(Permission.FINANCE_LEDGER)) {
      items.push({
        label: 'Finance',
        icon: 'pi pi-wallet',
        items: [
          {
            label: 'Ledger',
            icon: 'pi pi-list',
            routerLink: ['/finance/ledger'],
          },
          {
            label: 'Profit & loss',
            icon: 'pi pi-chart-line',
            routerLink: ['/finance/profit-loss'],
          },
        ],
      });
    }
    if (
      u?.role === Role.LAB_TECH ||
      u?.role === Role.ADMIN ||
      u?.role === Role.DOCTOR
    ) {
      items.push({
        label: 'Lab reports',
        icon: 'pi pi-file-edit',
        routerLink: ['/lab/reports'],
      });
    }
    if (u?.role === Role.ADMIN) {
      items.push({
        label: 'Admin',
        icon: 'pi pi-shield',
        items: [
          {
            label: 'Users',
            icon: 'pi pi-users',
            routerLink: ['/admin/users'],
          },
          {
            label: 'Doctors',
            icon: 'pi pi-heart',
            routerLink: ['/admin/doctors'],
          },
          {
            label: 'Fee catalog',
            icon: 'pi pi-list',
            routerLink: ['/admin/fee-catalog'],
          },
          {
            label: 'Lab report templates',
            icon: 'pi pi-link',
            routerLink: ['/admin/lab-report-templates'],
          },
          {
            label: 'Data backup',
            icon: 'pi pi-download',
            routerLink: ['/admin/backup'],
          },
        ],
      });
    }
    items.push({
      label:
        u?.role === Role.DOCTOR
          ? `Doctor · ${u.name}`
          : (u?.name ?? 'Account'),
      icon: 'pi pi-user',
      items: [
        {
          label: 'Logout',
          icon: 'pi pi-sign-out',
          command: () => this.auth.logout(),
        },
      ],
    });
    return items;
  });
}
