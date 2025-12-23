export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    email: string;
    role: 'admin' | 'customer';
    full_name: string;
  };
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
}