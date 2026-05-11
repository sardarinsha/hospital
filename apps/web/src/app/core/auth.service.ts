import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  AuthUser,
  LoginRequest,
  LoginResponse,
  Permission,
  Role,
  permissionsForRole,
} from '@hospital/shared';
import { firstValueFrom } from 'rxjs';

const TOKEN_KEY = 'hospital_token';
const USER_KEY = 'hospital_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly tokenSignal = signal<string | null>(
    typeof localStorage !== 'undefined'
      ? localStorage.getItem(TOKEN_KEY)
      : null,
  );
  private readonly userSignal = signal<AuthUser | null>(this.readUserFromStorage());

  readonly token = this.tokenSignal.asReadonly();
  readonly user = this.userSignal.asReadonly();
  readonly isAdmin = computed(
    () => this.userSignal()?.role === Role.ADMIN,
  );

  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readUserFromStorage(): AuthUser | null {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      const u = JSON.parse(raw) as AuthUser;
      if (!u?.permissions?.length) {
        u.permissions = permissionsForRole(u.role);
      }
      return u;
    } catch {
      return null;
    }
  }

  async initFromStorage(): Promise<void> {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;
    this.tokenSignal.set(token);
    try {
      const me = await firstValueFrom(
        this.http.get<AuthUser>('/api/auth/me'),
      );
      this.setUser(me);
    } catch {
      this.clearSession();
    }
  }

  async login(body: LoginRequest): Promise<void> {
    const res = await firstValueFrom(
      this.http.post<LoginResponse>('/api/auth/login', {
        email: body.email.trim().toLowerCase(),
        password: body.password,
      }),
    );
    localStorage.setItem(TOKEN_KEY, res.accessToken);
    this.tokenSignal.set(res.accessToken);
    this.setUser(res.user);
    await this.router.navigateByUrl(this.homePath());
  }

  /** Default landing route for the signed-in role. */
  homePath(): string {
    const u = this.userSignal();
    if (!u) return '/login';
    switch (u.role) {
      case Role.ADMIN:
        return '/admin/dashboard';
      case Role.RECEPTIONIST:
        return '/reception/desk';
      case Role.LAB_TECH:
        return '/lab';
      case Role.DOCTOR:
        return '/patients';
      default:
        return '/login';
    }
  }

  hasPermission(p: Permission): boolean {
    const u = this.userSignal();
    if (!u) return false;
    const perms = u.permissions?.length
      ? u.permissions
      : permissionsForRole(u.role);
    return perms.includes(p);
  }

  logout(): void {
    this.clearSession();
    void this.router.navigateByUrl('/login');
  }

  private setUser(user: AuthUser): void {
    const normalized: AuthUser = {
      ...user,
      permissions: user.permissions?.length
        ? user.permissions
        : permissionsForRole(user.role),
    };
    localStorage.setItem(USER_KEY, JSON.stringify(normalized));
    this.userSignal.set(normalized);
  }

  private clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.tokenSignal.set(null);
    this.userSignal.set(null);
  }
}
