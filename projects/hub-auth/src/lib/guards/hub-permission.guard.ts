import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { HubSessionService } from '../services/hub-session.service';

export const hubPermissionGuard: CanActivateFn = (route) => {
  const session = inject(HubSessionService);
  const router = inject(Router);

  session.reloadFromStorage();

  const requiredPermission = route.data?.['permission'] as string | undefined;

  if (!requiredPermission) {
    return true;
  }

  if (session.hasPermission(requiredPermission)) {
    return true;
  }

  return router.createUrlTree(['/unauthorized']);
};
