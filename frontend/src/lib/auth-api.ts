import { api } from "./api";

export interface User {
  id: number;
  email: string;
  created_at: string;
}

interface TokenResponse {
  access_token: string;
  token_type: string;
}

export function register(email: string, password: string): Promise<User> {
  return api.post<User>("/auth/register", { email, password });
}

export function login(email: string, password: string): Promise<TokenResponse> {
  // Backend /auth/login expects an OAuth2 form with `username`.
  const form = new URLSearchParams();
  form.set("username", email);
  form.set("password", password);
  return api.postForm<TokenResponse>("/auth/login", form);
}

export function fetchMe(): Promise<User> {
  return api.get<User>("/auth/me", true);
}
