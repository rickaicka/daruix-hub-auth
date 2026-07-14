import { InjectionToken } from '@angular/core';

export const HUB_ACCESS_TOKEN_KEY = new InjectionToken<string>(
  'HUB_ACCESS_TOKEN_KEY',
  {
    providedIn: 'root',
    factory: () => 'daruix_hub_access_token',
  }
);

export const HUB_REFRESH_TOKEN_KEY = new InjectionToken<string>(
  'HUB_REFRESH_TOKEN_KEY',
  {
    providedIn: 'root',
    factory: () => 'daruix_hub_refresh_token',
  }
);

export const HUB_USER_KEY = new InjectionToken<string>(
  'HUB_USER_KEY',
  {
    providedIn: 'root',
    factory: () => 'daruix_hub_user',
  }
);

export const HUB_SESSION_KEY = new InjectionToken<string>(
  'HUB_SESSION_KEY',
  {
    providedIn: 'root',
    factory: () => 'daruix_hub_session',
  }
);
