Daruix Hub Auth (`@daruix/hub-auth`)
Biblioteca compartilhada de autenticação, sessão, permissões e interceptors para o Daruix Hub e seus micro front-ends.
Visão geral
O objetivo desta lib é permitir que o Shell e os MFEs compartilhem a mesma sessão de usuário sem acoplar os MFEs diretamente à `AuthStore` do Shell.
O Shell continua responsável por login, logout e chamadas de autenticação. Os MFEs consomem apenas a sessão compartilhada exposta por esta biblioteca.
Pacote npm
```txt
@daruix/hub-auth
```
Stack principal
Angular 21
TypeScript
ng-packagr
Signals
Functional HTTP Interceptor
Functional Guards
Instalação
```bash
npm install @daruix/hub-auth
```
Para desenvolvimento local, também é possível instalar a partir do build local:
```bash
npm install ../daruix-hub-auth/dist/hub-auth
```
Estrutura principal
```txt
projects/hub-auth/src/lib/
├─ guards/
│  ├─ hub-auth.guard.ts
│  └─ hub-permission.guard.ts
├─ interceptors/
│  └─ hub-auth.interceptor.ts
├─ models/
│  └─ hub-auth.models.ts
├─ services/
│  └─ hub-session.service.ts
└─ tokens/
   └─ hub-auth-storage.tokens.ts
```
Modelos principais
A lib trabalha com o usuário retornado pelo backend do Daruix Hub, incluindo permissões e módulos:
```ts
export interface HubUser {
  id_usuario: number;
  username: string;
  nome: string;
  email: string;
  tipo_usuario: string;
  grupo: string;
  permissoes: string[];
  modulos: HubModulo[];
  origem: string;
  ativo: boolean;
  is_staff: boolean;
  is_superuser: boolean;
}
```
HubSessionService
Serviço compartilhado responsável por:
salvar sessão no storage;
recuperar sessão salva;
limpar sessão;
expor usuário por signal;
verificar permissões;
verificar módulos disponíveis.
Exemplo:
```ts
import { Component, computed, inject } from '@angular/core';
import { HubSessionService } from '@daruix/hub-auth';

@Component({
  selector: 'app-example',
  standalone: true,
  template: `
    <p>Olá, {{ nomeUsuario() }}</p>
  `
})
export class ExampleComponent {
  private readonly session = inject(HubSessionService);

  readonly usuario = this.session.usuario;
  readonly nomeUsuario = computed(() =>
    this.usuario()?.nome ?? this.usuario()?.username ?? 'Usuário'
  );
}
```
Interceptor JWT
Use o interceptor para aplicar automaticamente o token nas chamadas HTTP:
```ts
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { hubAuthInterceptor } from '@daruix/hub-auth';

export const appConfig = {
  providers: [
    provideHttpClient(
      withInterceptors([hubAuthInterceptor])
    )
  ]
};
```
Guards
Autenticação
```ts
import { hubAuthGuard } from '@daruix/hub-auth';
```
Permissão
```ts
import { hubPermissionGuard } from '@daruix/hub-auth';
```
Exemplo:
```ts
{
  path: 'financeiro',
  canActivate: [hubPermissionGuard],
  data: {
    permission: 'financeiro.ver'
  },
  loadChildren: () => import('./financeiro.routes').then(r => r.routes)
}
```
Build
```bash
npm run build:auth
```
O build é gerado em:
```txt
dist/hub-auth
```
Empacotar localmente
```bash
npm run pack:auth
```
Publicação
```bash
npm run publish:auth
```
Antes de publicar nova versão:
```bash
npm run version:auth:patch
```
Native Federation
No Shell e nos MFEs, compartilhe a lib como singleton:
```js
shared: {
  ...shareAll({
    singleton: true,
    strictVersion: true,
    requiredVersion: 'auto'
  }),

  '@daruix/hub-auth': {
    singleton: true,
    strictVersion: true,
    requiredVersion: 'auto'
  }
}
```
Repositórios relacionados
`daruix-hub-shell`
`mfe-memorando-remessa`
`daruix-ds`
