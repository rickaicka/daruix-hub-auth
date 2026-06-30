import { computed, inject, Injectable, signal } from '@angular/core';

import { HubUser } from '../models/hub-auth.models';
import {
  HUB_ACCESS_TOKEN_KEY,
  HUB_REFRESH_TOKEN_KEY,
  HUB_USER_KEY,
} from '../tokens/hub-auth-storage.tokens';

@Injectable({
  providedIn: 'root',
})
export class HubSessionService {
  private readonly accessTokenKey = inject(HUB_ACCESS_TOKEN_KEY);
  private readonly refreshTokenKey = inject(HUB_REFRESH_TOKEN_KEY);
  private readonly userKey = inject(HUB_USER_KEY);

  private readonly usuarioSignal = signal<HubUser | null>(
    this.loadUserFromStorage()
  );

  private readonly accessTokenSignal = signal<string | null>(
    localStorage.getItem(this.accessTokenKey)
  );

  private readonly refreshTokenSignal = signal<string | null>(
    localStorage.getItem(this.refreshTokenKey)
  );

  readonly usuario = this.usuarioSignal.asReadonly();
  readonly accessToken = this.accessTokenSignal.asReadonly();
  readonly refreshToken = this.refreshTokenSignal.asReadonly();

  readonly isLoggedIn = computed(() =>
    !!this.accessToken() && !!this.usuario()
  );

  readonly userName = computed(() =>
    this.usuario()?.nome ?? this.usuario()?.username ?? ''
  );

  readonly userPermissions = computed(() =>
    this.usuario()?.permissoes ?? []
  );

  readonly userModules = computed(() =>
    this.usuario()?.modulos ?? []
  );

  hasPermission(permission: string): boolean {
    return this.userPermissions().includes(permission);
  }

  hasModule(moduleSlug: string): boolean {
    return this.userModules().some((modulo) => modulo.slug === moduleSlug);
  }


  setSession(params: {
    usuario: HubUser;
    accessToken: string;
    refreshToken: string;
  }): void {
    localStorage.setItem(this.userKey, JSON.stringify(params.usuario));
    localStorage.setItem(this.accessTokenKey, params.accessToken);
    localStorage.setItem(this.refreshTokenKey, params.refreshToken);

    this.usuarioSignal.set(params.usuario);
    this.accessTokenSignal.set(params.accessToken);
    this.refreshTokenSignal.set(params.refreshToken);
  }

  setUsuario(usuario: HubUser): void {
    localStorage.setItem(this.userKey, JSON.stringify(usuario));
    this.usuarioSignal.set(usuario);
  }

  setAccessToken(accessToken: string): void {
    localStorage.setItem(this.accessTokenKey, accessToken);
    this.accessTokenSignal.set(accessToken);
  }

  clearSession(): void {
    localStorage.removeItem(this.userKey);
    localStorage.removeItem(this.accessTokenKey);
    localStorage.removeItem(this.refreshTokenKey);

    this.usuarioSignal.set(null);
    this.accessTokenSignal.set(null);
    this.refreshTokenSignal.set(null);
  }

  reloadFromStorage(): void {
    this.usuarioSignal.set(this.loadUserFromStorage());
    this.accessTokenSignal.set(localStorage.getItem(this.accessTokenKey));
    this.refreshTokenSignal.set(localStorage.getItem(this.refreshTokenKey));
  }

  private loadUserFromStorage(): HubUser | null {
    const usuario = localStorage.getItem(this.userKey);

    if (!usuario) {
      return null;
    }

    try {
      return JSON.parse(usuario) as HubUser;
    } catch {
      localStorage.removeItem(this.userKey);
      return null;
    }
  }
}
