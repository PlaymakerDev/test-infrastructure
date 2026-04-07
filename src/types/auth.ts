export interface AuthState {
  auth_token: AuthToken;

}

export interface AuthToken {
  access_token: string | null;
  refresh_token: string | null;
}