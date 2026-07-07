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

export interface HubSession {
  usuario: HubUser | null;
  accessToken: string | null;
  refreshToken: string | null;
}
