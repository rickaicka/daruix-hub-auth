export interface HubRemoteModule {
  remote_name: string;
  remote_entry: string;
  exposed_module: string;
}

export interface HubModulo {
  slug: string;
  nome: string;
  rota: string;
  icone: string;
  permissao: string;

  desktop_enabled: boolean;
  mobile_enabled: boolean;
  mfe_enabled: boolean;
  legacy_enabled: boolean;
  favorito: boolean;

  remote: HubRemoteModule | null;

  /**
   * Submódulos ou funcionalidades internas exibidas
   * dentro do card do módulo principal.
   */
  children?: HubModulo[];
}

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

export interface HubSessionInfo {
  id: string;
  expira_em: string;
  inatividade_minutos: number;
}

export interface HubAuthState {
  usuario: HubUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  sessao: HubSessionInfo | null;
}

export interface HubLoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: 'bearer';
  usuario: HubUser;
  sessao: HubSessionInfo;
}

export interface HubRefreshResponse {
  access_token: string;
  refresh_token: string;
  token_type: 'bearer';
  sessao: HubSessionInfo;
}
