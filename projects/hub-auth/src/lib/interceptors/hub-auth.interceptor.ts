import {
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';

import { HubAuthRefreshService } from '../services/hub-auth-refresh.service';
import { HubSessionService } from '../services/hub-session.service';

/**
 * Renova de forma preventiva quando falta até 90s para o access expirar.
 * Isso evita a corrida de o token vencer entre o início e o fim da request.
 */
const REFRESH_SKEW_SECONDS = 90;

let redirectingToLogin = false;

export const hubAuthInterceptor: HttpInterceptorFn = (req, next) => {
  const session = inject(HubSessionService);
  const refreshService = inject(HubAuthRefreshService);

  if (!shouldAttachAccessToken(req)) {
    return next(req);
  }

  const accessToken = session.accessToken();

  if (!accessToken) {
    return next(req).pipe(
      catchError((error: unknown) => {
        if (isUnauthorized(error)) {
          endLocalSession(session);
        }

        return throwError(() => error);
      }),
    );
  }

  if (isJwtNearExpiry(accessToken, REFRESH_SKEW_SECONDS)) {
    return refreshService.refreshAccessToken().pipe(
      switchMap(() => {
        const refreshedToken = session.accessToken();

        if (!refreshedToken) {
          endLocalSession(session);
          return throwError(() => new Error('Access token não disponível após refresh.'));
        }

        return next(withAccessToken(req, refreshedToken));
      }),
      catchError((error: unknown) => {
        endLocalSession(session);
        return throwError(() => error);
      }),
    );
  }

  return next(withAccessToken(req, accessToken)).pipe(
    catchError((error: unknown) => {
      if (!isUnauthorized(error)) {
        return throwError(() => error);
      }

      /**
       * Fallback para 401: mesmo que o relógio do browser esteja diferente,
       * ou o token tenha sido invalidado entre as verificações, tenta um único
       * refresh e repete a requisição original.
       */
      return refreshService.refreshAccessToken().pipe(
        switchMap(() => {
          const refreshedToken = session.accessToken();

          if (!refreshedToken) {
            endLocalSession(session);
            return throwError(() => new Error('Access token não disponível após refresh.'));
          }

          return next(withAccessToken(req, refreshedToken));
        }),
        catchError((refreshError: unknown) => {
          endLocalSession(session);
          return throwError(() => refreshError);
        }),
      );
    }),
  );
};

function withAccessToken(
  request: HttpRequest<unknown>,
  token: string,
): HttpRequest<unknown> {
  return request.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });
}

function shouldAttachAccessToken(request: HttpRequest<unknown>): boolean {
  const pathname = getPathname(request.url);

  return !isLoginEndpoint(pathname) && !isRefreshEndpoint(pathname);
}

function isUnauthorized(error: unknown): error is HttpErrorResponse {
  return error instanceof HttpErrorResponse && error.status === 401;
}

function endLocalSession(session: HubSessionService): void {
  session.clearSession();
  redirectToLogin();
}

function redirectToLogin(): void {
  if (redirectingToLogin) {
    return;
  }

  redirectingToLogin = true;
  window.location.replace('/login');
}

function isLoginEndpoint(pathname: string): boolean {
  return pathname.endsWith('/auth/login') || pathname.endsWith('/auth/login/');
}

function isRefreshEndpoint(pathname: string): boolean {
  return pathname.endsWith('/auth/refresh') || pathname.endsWith('/auth/refresh/');
}

function getPathname(url: string): string {
  try {
    return new URL(url, window.location.origin).pathname;
  } catch {
    return url.split('?')[0];
  }
}

function isJwtNearExpiry(token: string, skewSeconds: number): boolean {
  const expiresAt = readJwtExpiration(token);

  if (expiresAt === null) {
    return false;
  }

  return expiresAt * 1000 <= Date.now() + skewSeconds * 1000;
}

function readJwtExpiration(token: string): number | null {
  const parts = token.split('.');

  if (parts.length !== 3) {
    return null;
  }

  try {
    const normalized = parts[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(Math.ceil(parts[1].length / 4) * 4, '=');

    const payload = JSON.parse(atob(normalized)) as { exp?: unknown };

    return typeof payload.exp === 'number' ? payload.exp : null;
  } catch {
    return null;
  }
}
