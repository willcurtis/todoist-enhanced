import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { freshAccessToken, forgetCredentials, OAUTH_TIMEOUT_MS, completeSignIn } from './oauth';
const data = new Map<string, string>();
beforeEach(() => {
  vi.useFakeTimers();
  data.clear();
  data.set('tde.oauth', JSON.stringify({ accessToken: 'old', refreshToken: 'refresh', expiresAt: 0 }));
  const storage = { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => { data.set(k, v); }, removeItem: (k: string) => { data.delete(k); } };
  vi.stubGlobal('localStorage', storage);
  vi.stubGlobal('sessionStorage', storage);
  vi.stubGlobal('navigator', {});
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });
function stalledFetch(body = false) {
  return vi.fn((_url: unknown, options: RequestInit) => {
    const stalled = () => new Promise<never>((_resolve, reject) => {
      options.signal!.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
    });
    return body ? Promise.resolve({ ok: true, status: 200, json: stalled }) : stalled();
  });
}
it.each([false, true])('times out a stalled refresh (body: %s), then allows retry', async (body) => {
  vi.stubGlobal('fetch', stalledFetch(body));
  const failure = expect(freshAccessToken()).rejects.toMatchObject({ name: 'AbortError' });
  await vi.advanceTimersByTimeAsync(OAUTH_TIMEOUT_MS);
  await failure;
  expect(data.has('tde.oauth')).toBe(true);
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ access_token: 'new', refresh_token: 'rotated', expires_in: 3600 }) })));
  await expect(freshAccessToken()).resolves.toBe('new');
});
it('finishes a stalled sign-in instead of leaving startup pending', async () => {
  data.set('tde.oauth.pending', JSON.stringify({ verifier: 'v', state: 's', redirectUri: 'http://localhost:5192/', route: '' }));
  vi.stubGlobal('window', { location: { search: '?code=c&state=s', pathname: '/' }, history: { replaceState: vi.fn() } });
  vi.stubGlobal('fetch', stalledFetch());
  const result = completeSignIn();
  await vi.advanceTimersByTimeAsync(OAUTH_TIMEOUT_MS);
  await expect(result).resolves.toBe('failed');
});
it('does not restore credentials when a refresh completes after sign-out', async () => {
  let resolve!: (value: unknown) => void;
  vi.stubGlobal('fetch', vi.fn(() => new Promise(r => { resolve = r; })));
  const refresh = freshAccessToken();
  forgetCredentials();
  resolve({ ok: true, status: 200, json: async () => ({ access_token: 'late' }) });
  await expect(refresh).resolves.toBeNull();
  expect(data.has('tde.oauth')).toBe(false);
});
