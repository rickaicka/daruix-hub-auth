import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';

export interface HubNavigationItem {
  rota: string;
  modulo_slug?: string;
  cor_icone?: string;
  icone?: string;
  children?: HubNavigationItem[];
}

@Injectable({
  providedIn: 'root',
})
export class HubNavigationService {
  private readonly router = inject(Router);

  navigateRoute(route: string, item?: HubNavigationItem): void {
    if (!route?.trim()) {
      return;
    }

    const resolvedRoute = this.resolveRoute(route, item);

    const cleanRoute = resolvedRoute
      .trim()
      .replace(/^\/hub\/?/, '')
      .replace(/^\/+|\/+$/g, '');

    if (!cleanRoute) {
      return;
    }

    void this.router.navigate(['/hub', ...cleanRoute.split('/')], {
      state: {
        moduleColor: item?.cor_icone,
        moduleIcone: item?.icone,
      },
    });
  }

  private resolveRoute(route: string, item?: HubNavigationItem): string {
    if (!item?.children?.length) {
      return route;
    }

    for (const child of item.children) {
      if (child.children?.length) {
        const target = child.children.find((nested) => nested.rota === route);

        if (target) {
          return `${child.rota}/${target.rota}`;
        }
      }

      if (child.rota === route) {
        return item.modulo_slug ? `${item.modulo_slug}/${route}` : route;
      }
    }

    return route;
  }
}
