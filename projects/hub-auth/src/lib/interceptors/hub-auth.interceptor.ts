import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { HUB_ACCESS_TOKEN_KEY } from '../tokens/hub-auth-storage.tokens';

export const hubAuthInterceptor: HttpInterceptorFn = (req, next) => {
  const accessTokenKey = inject(HUB_ACCESS_TOKEN_KEY);
  const token = localStorage.getItem(accessTokenKey);

  if (!token) {
    return next(req);
  }

  const authRequest = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });

  return next(authRequest);
};
