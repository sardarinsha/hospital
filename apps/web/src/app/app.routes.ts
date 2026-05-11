import { Route } from '@angular/router';
import { Role } from '@hospital/shared';
import { environment } from '../environments/environment';
import { authGuard } from './core/auth.guard';
import { roleGuard } from './core/role.guard';

export const appRoutes: Route[] = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  {
    path: environment.trialMgmtPath,
    loadComponent: () =>
      import('./pages/trial/trial-recovery.component').then(
        (m) => m.TrialRecoveryComponent,
      ),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    loadComponent: () =>
      import('./layout/shell.component').then((m) => m.ShellComponent),
    canActivate: [authGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('./pages/home/home-redirect.component').then(
            (m) => m.HomeRedirectComponent,
          ),
      },
      {
        path: 'dashboard',
        pathMatch: 'full',
        redirectTo: 'admin/dashboard',
      },
      {
        path: 'admin/dashboard',
        loadComponent: () =>
          import('./pages/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent,
          ),
        canActivate: [roleGuard],
        data: { roles: [Role.ADMIN] },
      },
      {
        path: 'reception/desk',
        loadComponent: () =>
          import('./pages/reception/reception-desk.component').then(
            (m) => m.ReceptionDeskComponent,
          ),
        canActivate: [roleGuard],
        data: { roles: [Role.RECEPTIONIST] },
      },
      {
        path: 'lab/reports/recent',
        loadComponent: () =>
          import('./pages/lab/lab-report-recent.component').then(
            (m) => m.LabReportRecentComponent,
          ),
        canActivate: [roleGuard],
        data: { roles: [Role.LAB_TECH, Role.ADMIN, Role.DOCTOR] },
      },
      {
        path: 'lab/reports/new/:templateId',
        loadComponent: () =>
          import('./pages/lab/lab-report-form.component').then(
            (m) => m.LabReportFormComponent,
          ),
        canActivate: [roleGuard],
        data: { roles: [Role.LAB_TECH, Role.ADMIN, Role.DOCTOR] },
      },
      {
        path: 'lab/reports/print/:recordId',
        loadComponent: () =>
          import('./pages/lab/lab-report-print.component').then(
            (m) => m.LabReportPrintComponent,
          ),
        canActivate: [roleGuard],
        data: {
          roles: [Role.LAB_TECH, Role.ADMIN, Role.DOCTOR, Role.RECEPTIONIST],
        },
      },
      {
        path: 'lab/reports',
        loadComponent: () =>
          import('./pages/lab/lab-report-list.component').then(
            (m) => m.LabReportListComponent,
          ),
        canActivate: [roleGuard],
        data: { roles: [Role.LAB_TECH, Role.ADMIN, Role.DOCTOR] },
      },
      {
        path: 'lab',
        loadComponent: () =>
          import('./pages/lab/lab-home.component').then((m) => m.LabHomeComponent),
        canActivate: [roleGuard],
        data: { roles: [Role.LAB_TECH, Role.ADMIN, Role.DOCTOR] },
      },
      {
        path: 'patients',
        loadComponent: () =>
          import('./pages/patients/patient-list.component').then(
            (m) => m.PatientListComponent,
          ),
        canActivate: [roleGuard],
        data: {
          roles: [Role.ADMIN, Role.RECEPTIONIST, Role.LAB_TECH, Role.DOCTOR],
        },
      },
      {
        path: 'patients/new',
        loadComponent: () =>
          import('./pages/patients/patient-form.component').then(
            (m) => m.PatientFormComponent,
          ),
        canActivate: [roleGuard],
        data: { roles: [Role.ADMIN, Role.RECEPTIONIST] },
      },
      {
        path: 'patients/:id/edit',
        loadComponent: () =>
          import('./pages/patients/patient-form.component').then(
            (m) => m.PatientFormComponent,
          ),
        canActivate: [roleGuard],
        data: { roles: [Role.ADMIN, Role.RECEPTIONIST] },
      },
      {
        path: 'patients/:id/print',
        loadComponent: () =>
          import('./pages/patients/patient-print.component').then(
            (m) => m.PatientPrintComponent,
          ),
        canActivate: [roleGuard],
        data: { roles: [Role.ADMIN, Role.RECEPTIONIST] },
      },
      {
        path: 'patients/:id/fees-print',
        loadComponent: () =>
          import('./pages/patients/fee-slip-print.component').then(
            (m) => m.FeeSlipPrintComponent,
          ),
        canActivate: [roleGuard],
        data: { roles: [Role.ADMIN, Role.RECEPTIONIST], feeSlipLayout: 'a4' },
      },
      {
        path: 'patients/:id/fees-print/:lineId',
        loadComponent: () =>
          import('./pages/patients/fee-slip-print.component').then(
            (m) => m.FeeSlipPrintComponent,
          ),
        canActivate: [roleGuard],
        data: { roles: [Role.ADMIN, Role.RECEPTIONIST], feeSlipLayout: 'a4' },
      },
      {
        path: 'patients/:id/fees-print-pos',
        loadComponent: () =>
          import('./pages/patients/fee-slip-print.component').then(
            (m) => m.FeeSlipPrintComponent,
          ),
        canActivate: [roleGuard],
        data: { roles: [Role.ADMIN, Role.RECEPTIONIST], feeSlipLayout: 'pos' },
      },
      {
        path: 'patients/:id/fees-print-pos/:lineId',
        loadComponent: () =>
          import('./pages/patients/fee-slip-print.component').then(
            (m) => m.FeeSlipPrintComponent,
          ),
        canActivate: [roleGuard],
        data: { roles: [Role.ADMIN, Role.RECEPTIONIST], feeSlipLayout: 'pos' },
      },
      {
        path: 'patients/:id',
        loadComponent: () =>
          import('./pages/patients/patient-detail.component').then(
            (m) => m.PatientDetailComponent,
          ),
        canActivate: [roleGuard],
        data: {
          roles: [Role.ADMIN, Role.RECEPTIONIST, Role.LAB_TECH, Role.DOCTOR],
        },
      },
      {
        path: 'finance/ledger',
        loadComponent: () =>
          import('./pages/finance/office-ledger.component').then(
            (m) => m.OfficeLedgerComponent,
          ),
        canActivate: [roleGuard],
        data: { roles: [Role.ADMIN, Role.RECEPTIONIST] },
      },
      {
        path: 'finance/profit-loss',
        loadComponent: () =>
          import('./pages/finance/profit-loss-sheet.component').then(
            (m) => m.ProfitLossSheetComponent,
          ),
        canActivate: [roleGuard],
        data: { roles: [Role.ADMIN, Role.RECEPTIONIST] },
      },
      {
        path: 'admin/users',
        loadComponent: () =>
          import('./pages/admin/admin-users.component').then(
            (m) => m.AdminUsersComponent,
          ),
        canActivate: [roleGuard],
        data: { roles: [Role.ADMIN] },
      },
      {
        path: 'admin/doctors',
        loadComponent: () =>
          import('./pages/admin/admin-doctors.component').then(
            (m) => m.AdminDoctorsComponent,
          ),
        canActivate: [roleGuard],
        data: { roles: [Role.ADMIN] },
      },
      {
        path: 'admin/fee-catalog',
        loadComponent: () =>
          import('./pages/admin/admin-fee-catalog.component').then(
            (m) => m.AdminFeeCatalogComponent,
          ),
        canActivate: [roleGuard],
        data: { roles: [Role.ADMIN] },
      },
      {
        path: 'admin/lab-report-templates',
        loadComponent: () =>
          import('./pages/admin/admin-lab-templates.component').then(
            (m) => m.AdminLabTemplatesComponent,
          ),
        canActivate: [roleGuard],
        data: { roles: [Role.ADMIN] },
      },
      {
        path: 'admin/backup',
        loadComponent: () =>
          import('./pages/admin/admin-backup.component').then(
            (m) => m.AdminBackupComponent,
          ),
        canActivate: [roleGuard],
        data: { roles: [Role.ADMIN] },
      },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
