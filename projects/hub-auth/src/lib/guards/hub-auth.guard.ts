import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { HubSessionService } from '../services/hub-session.service';

export const hubAuthGuard: CanActivateFn = () => {
  const session = inject(HubSessionService);
  const router = inject(Router);

  session.reloadFromStorage();

  if (session.isLoggedIn()) {
    return true;
  }

  return router.createUrlTree(['/login']);
};
