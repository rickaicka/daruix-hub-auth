import { InjectionToken } from '@angular/core';

/**
 * Base URL da API do Daruix Hub.
 *
 * O Shell deve sobrescrever este token com environment.apiUrl.
 * O valor padrão atende o deploy onde a API é publicada em /api.
 */
export const HUB_AUTH_API_URL = new InjectionToken<string>('HUB_AUTH_API_URL', {
  providedIn: 'root',
  factory: () => '/api',
});
