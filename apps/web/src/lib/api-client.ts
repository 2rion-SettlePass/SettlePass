export async function apiClient<T>(path: string, init?: RequestInit): Promise<T> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';
  const res = await fetch(`${baseUrl}${path}`, init);
  if (!res.ok) throw new Error(`API request failed: ${res.status}`);
  return res.json() as Promise<T>;
}
