export interface HubUser {
  id_usuario: number;
  username: string;
  nome: string;
  email: string;
  permissions?: string[];
  apps?: string[];
}

export interface HubSession {
  usuario: HubUser | null;
  accessToken: string | null;
  refreshToken: string | null;
}
