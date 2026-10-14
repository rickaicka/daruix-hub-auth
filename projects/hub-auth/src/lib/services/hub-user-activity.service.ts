import { DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable, OnDestroy } from '@angular/core';
import { catchError, EMPTY, finalize } from 'rxjs';

import { HUB_AUTH_API_URL } from '../tokens/hub-auth-api.tokens';
import { HubSessionService } from './hub-session.service';

/**
 * Intervalo máximo entre heartbeats enquanto existe atividade humana.
 *
 * O timer local verifica a cada 30s, mas uma chamada HTTP só ocorre quando:
 * - existe sessão ativa;
 * - houve mouse/teclado/scroll/toque desde o último heartbeat;
 * - passaram pelo menos 5 minutos desde o último heartbeat.
 */
const HEARTBEAT_INTERVAL_MS = 5 * 60 * 1000;
const HEARTBEAT_CHECK_INTERVAL_MS = 30 * 1000;

@Injectable({
  providedIn: 'root',
})
export class HubUserActivityService implements OnDestroy {
  private readonly document = inject(DOCUMENT);
  private readonly http = inject(HttpClient);
  private readonly session = inject(HubSessionService);
  private readonly apiUrl = inject(HUB_AUTH_API_URL);

  private started = false;
  private heartbeatInFlight = false;
  private activityPending = false;
  private lastHumanActivityAt = 0;
  private lastHeartbeatAt = Date.now();
  private timerId: number | null = null;

  private readonly markActivityListener = () => this.markActivity();
  private readonly visibilityListener = () => {
    if (this.document.visibilityState === 'visible') {
      this.markActivity();
    }
  };

  start(): void {
    if (this.started) {
      return;
    }

    this.started = true;

    this.document.addEventListener('pointerdown', this.markActivityListener, {
      passive: true,
    });
    this.document.addEventListener('keydown', this.markActivityListener);
    this.document.addEventListener('wheel', this.markActivityListener, {
      passive: true,
    });
    this.document.addEventListener('touchstart', this.markActivityListener, {
      passive: true,
    });
    this.document.addEventListener('visibilitychange', this.visibilityListener);

    this.timerId = window.setInterval(
      () => this.flushActivityIfNeeded(),
      HEARTBEAT_CHECK_INTERVAL_MS,
    );
  }

  markActivity(): void {
    this.lastHumanActivityAt = Date.now();
    this.activityPending = true;
  }

  ngOnDestroy(): void {
    if (!this.started) {
      return;
    }

    this.document.removeEventListener('pointerdown', this.markActivityListener);
    this.document.removeEventListener('keydown', this.markActivityListener);
    this.document.removeEventListener('wheel', this.markActivityListener);
    this.document.removeEventListener('touchstart', this.markActivityListener);
    this.document.removeEventListener('visibilitychange', this.visibilityListener);

    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }

    this.started = false;
  }

  private flushActivityIfNeeded(): void {
    if (
      !this.activityPending ||
      this.heartbeatInFlight ||
      !this.session.isLoggedIn()
    ) {
      return;
    }

    const now = Date.now();

    if (now - this.lastHeartbeatAt < HEARTBEAT_INTERVAL_MS) {
      return;
    }

    /**
     * Não cria endpoint novo no BFF: /auth/me/ já é autenticado e a
     * SessionJWTAuthentication atualiza last_activity_at em toda chamada.
     *
     * O hubAuthInterceptor também atua nesta chamada. Se o access token
     * estiver perto de expirar, ele será renovado antes do /me/.
     */
    const activitySnapshot = this.lastHumanActivityAt;

    this.heartbeatInFlight = true;

    this.http
      .get<unknown>(this.authUrl('me/'))
      .pipe(
        catchError(() => EMPTY),
        finalize(() => {
          this.heartbeatInFlight = false;
        }),
      )
      .subscribe(() => {
        this.lastHeartbeatAt = Date.now();

        // Se houve nova interação enquanto a requisição estava em voo,
        // mantém activityPending=true para o próximo ciclo.
        this.activityPending = this.lastHumanActivityAt > activitySnapshot;
      });
  }

  private authUrl(path: string): string {
    const base = this.apiUrl.replace(/\/+$/, '');
    return `${base}/auth/${path}`;
  }
}
