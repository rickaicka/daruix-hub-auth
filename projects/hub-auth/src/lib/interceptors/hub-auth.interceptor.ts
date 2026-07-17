import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';

import { inject } from '@angular/core';

import { catchError, throwError } from 'rxjs';

import {
  HUB_ACCESS_TOKEN_KEY,
  HUB_REFRESH_TOKEN_KEY,
  HUB_USER_KEY,
} from '../tokens/hub-auth-storage.tokens';

let redirectingToLogin = false;

export const hubAuthInterceptor: HttpInterceptorFn = (req, next) => {
  const accessTokenKey = inject(HUB_ACCESS_TOKEN_KEY);
  const refreshTokenKey = inject(HUB_REFRESH_TOKEN_KEY);
  const userKey = inject(HUB_USER_KEY);

  const token = localStorage.getItem(accessTokenKey);

  const request =
    shouldAttachAccessToken(req) && token
      ? req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`,
          },
        })
      : req;

  return next(request).pipe(
    catchError((error: unknown) => {
      if (shouldLogoutUser(error, req.url)) {
        clearAuthentication({
          accessTokenKey,
          refreshTokenKey,
          userKey,
        });

        redirectToLogin();
      }

      return throwError(() => error);
    }),
  );
};

interface AuthenticationStorageKeys {
  accessTokenKey: string;
  refreshTokenKey: string;
  userKey: string;
}

function shouldAttachAccessToken(request: HttpRequest<unknown>): boolean {
  const pathname = getPathname(request.url);

  return !isLoginEndpoint(pathname) && !isRefreshEndpoint(pathname);
}

function shouldLogoutUser(error: unknown, requestUrl: string): boolean {
  if (!(error instanceof HttpErrorResponse)) {
    return false;
  }

  if (error.status !== 401) {
    return false;
  }

  const pathname = getPathname(requestUrl);

  /*
   * Um login com credenciais incorretas também pode retornar 401.
   * Nesse caso, apenas mostramos o erro no formulário.
   */
  if (isLoginEndpoint(pathname)) {
    return false;
  }

  return true;
}

function clearAuthentication(keys: AuthenticationStorageKeys): void {
  localStorage.removeItem(keys.accessTokenKey);
  localStorage.removeItem(keys.refreshTokenKey);
  localStorage.removeItem(keys.userKey);

  sessionStorage.removeItem(keys.accessTokenKey);
  sessionStorage.removeItem(keys.refreshTokenKey);
  sessionStorage.removeItem(keys.userKey);
}

function redirectToLogin(): void {
  if (redirectingToLogin) {
    return;
  }

  redirectingToLogin = true;

  /*
   * O replace recarrega o Shell e limpa também o estado
   * mantido em memória pelo SignalStore.
   */
  window.location.replace('/login');
}

function isLoginEndpoint(pathname: string): boolean {
  return pathname.endsWith('/api/auth/login') || pathname.endsWith('/api/auth/login/');
}

function isRefreshEndpoint(pathname: string): boolean {
  return pathname.endsWith('/api/auth/refresh') || pathname.endsWith('/api/auth/refresh/');
}

function getPathname(url: string): string {
  try {
    return new URL(url, window.location.origin).pathname;
  } catch {
    return url.split('?')[0];
  }
}
