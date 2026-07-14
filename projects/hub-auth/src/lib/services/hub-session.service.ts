import { computed, inject, Injectable, signal } from '@angular/core';

import {
  HubLoginResponse,
  HubRefreshResponse,
  HubSessionInfo,
  HubUser,
} from '../models/hub-auth.models';

import {
  HUB_ACCESS_TOKEN_KEY,
  HUB_REFRESH_TOKEN_KEY,
  HUB_SESSION_KEY,
  HUB_USER_KEY,
} from '../tokens/hub-auth-storage.tokens';

@Injectable({
  providedIn: 'root',
})
export class HubSessionService {
  private readonly accessTokenKey = inject(HUB_ACCESS_TOKEN_KEY);
  private readonly refreshTokenKey = inject(HUB_REFRESH_TOKEN_KEY);
  private readonly userKey = inject(HUB_USER_KEY);
  private readonly sessionKey = inject(HUB_SESSION_KEY);

  private readonly usuarioSignal = signal<HubUser | null>(
    this.loadUserFromStorage()
  );

  private readonly accessTokenSignal = signal<string | null>(
    localStorage.getItem(this.accessTokenKey)
  );

  private readonly refreshTokenSignal = signal<string | null>(
    localStorage.getItem(this.refreshTokenKey)
  );

  private readonly sessaoSignal = signal<HubSessionInfo | null>(
    this.loadSessionFromStorage()
  );

  readonly usuario = this.usuarioSignal.asReadonly();
  readonly accessToken = this.accessTokenSignal.asReadonly();
  readonly refreshToken = this.refreshTokenSignal.asReadonly();
  readonly sessao = this.sessaoSignal.asReadonly();

  readonly isSessionExpired = computed(() => {
    const sessao = this.sessao();

    if (!sessao?.expira_em) {
      return false;
    }

    return new Date(sessao.expira_em).getTime() <= Date.now();
  });

  readonly isLoggedIn = computed(() =>
    !!this.accessToken() &&
    !!this.usuario() &&
    !this.isSessionExpired()
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
    sessao: HubSessionInfo;
  }): void {
    localStorage.setItem(this.userKey, JSON.stringify(params.usuario));
    localStorage.setItem(this.accessTokenKey, params.accessToken);
    localStorage.setItem(this.refreshTokenKey, params.refreshToken);
    localStorage.setItem(this.sessionKey, JSON.stringify(params.sessao));

    this.usuarioSignal.set(params.usuario);
    this.accessTokenSignal.set(params.accessToken);
    this.refreshTokenSignal.set(params.refreshToken);
    this.sessaoSignal.set(params.sessao);
  }

  setLoginResponse(response: HubLoginResponse): void {
    this.setSession({
      usuario: response.usuario,
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
      sessao: response.sessao,
    });
  }

  setRefreshResponse(response: HubRefreshResponse): void {
    localStorage.setItem(this.accessTokenKey, response.access_token);
    localStorage.setItem(this.refreshTokenKey, response.refresh_token);
    localStorage.setItem(this.sessionKey, JSON.stringify(response.sessao));

    this.accessTokenSignal.set(response.access_token);
    this.refreshTokenSignal.set(response.refresh_token);
    this.sessaoSignal.set(response.sessao);
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
    localStorage.removeItem(this.sessionKey);

    this.usuarioSignal.set(null);
    this.accessTokenSignal.set(null);
    this.refreshTokenSignal.set(null);
    this.sessaoSignal.set(null);
  }

  reloadFromStorage(): void {
    this.usuarioSignal.set(this.loadUserFromStorage());
    this.accessTokenSignal.set(localStorage.getItem(this.accessTokenKey));
    this.refreshTokenSignal.set(localStorage.getItem(this.refreshTokenKey));
    this.sessaoSignal.set(this.loadSessionFromStorage());

    if (this.isSessionExpired()) {
      this.clearSession();
    }
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

  private loadSessionFromStorage(): HubSessionInfo | null {
    const sessao = localStorage.getItem(this.sessionKey);

    if (!sessao) {
      return null;
    }

    try {
      return JSON.parse(sessao) as HubSessionInfo;
    } catch {
      localStorage.removeItem(this.sessionKey);
      return null;
    }
  }
}
