import { HttpBackend, HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { finalize, Observable, shareReplay, tap, throwError } from 'rxjs';

import { HubRefreshResponse } from '../models/hub-auth.models';
import { HUB_AUTH_API_URL } from '../tokens/hub-auth-api.tokens';
import { HubSessionService } from './hub-session.service';

@Injectable({
  providedIn: 'root',
})
export class HubAuthRefreshService {
  private readonly backend = inject(HttpBackend);
  private readonly session = inject(HubSessionService);
  private readonly apiUrl = inject(HUB_AUTH_API_URL);

  /**
   * Cliente sem interceptors.
   *
   * O refresh precisa ignorar o próprio hubAuthInterceptor para evitar
   * recursão quando o access token já está expirado.
   */
  private readonly rawHttp = new HttpClient(this.backend);

  /**
   * Compartilha um único refresh entre todas as requisições concorrentes.
   * Cinco chamadas que perceberem o JWT expirado ao mesmo tempo geram
   * somente um POST /auth/refresh/.
   */
  private refreshInFlight$: Observable<HubRefreshResponse> | null = null;

  refreshAccessToken(): Observable<HubRefreshResponse> {
    if (this.refreshInFlight$) {
      return this.refreshInFlight$;
    }

    const refreshToken = this.session.refreshToken();

    if (!refreshToken) {
      return throwError(() => new Error('Refresh token não disponível.'));
    }

    const request$ = this.rawHttp
      .post<HubRefreshResponse>(this.authUrl('refresh/'), {
        refresh_token: refreshToken,
      })
      .pipe(
        tap((response) => this.session.setRefreshResponse(response)),
        finalize(() => {
          this.refreshInFlight$ = null;
        }),
        shareReplay({
          bufferSize: 1,
          refCount: false,
        }),
      );

    this.refreshInFlight$ = request$;

    return request$;
  }

  private authUrl(path: string): string {
    const base = this.apiUrl.replace(/\/+$/, '');
    return `${base}/auth/${path}`;
  }
}
