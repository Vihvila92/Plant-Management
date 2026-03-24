let authToken: string | null = null;

export function loadAuthToken(): string | null {
  return authToken;
}

export function storeAuthToken(token: string): void {
  authToken = token;
}

export function clearAuthToken(): void {
  authToken = null;
}
