import {
  BackendQueryClient,
  getAuthToken,
  hasAuthToken,
  normalizeBaseUrl,
  setAuthToken,
  withDefaultBaseUrl,
} from './api';

const API = 'https://api.example.com/SMA/API';

function mockFetch(body: unknown, init: { ok?: boolean; status?: number; statusText?: string } = {}) {
  const fetchMock = jest.fn().mockResolvedValue({
    ok: init.ok ?? true,
    status: init.status ?? 200,
    statusText: init.statusText ?? 'OK',
    json: async () => body,
  });
  (global as any).fetch = fetchMock;
  return fetchMock;
}

beforeEach(() => {
  localStorage.clear();
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('normalizeBaseUrl', () => {
  it.each([
    ['https://api.example.com', 'https://api.example.com'],
    ['  https://api.example.com/SMA/API/  ', 'https://api.example.com/SMA/API'],
    ['https://api.example.com/x?token=1#frag', 'https://api.example.com/x'],
    ['http://localhost:3000/api', 'http://localhost:3000/api'],
    ['http://127.0.0.1:8080', 'http://127.0.0.1:8080'],
    ['http://[::1]:8080/api', 'http://[::1]:8080/api'],
  ])('accepts %s', (input, expected) => {
    expect(normalizeBaseUrl(input)).toBe(expected);
  });

  it.each([
    [''],
    ['   '],
    [undefined],
    [null],
    ['not a url'],
    ['/relative/path'],
    ['http://api.example.com'],
    ['ftp://api.example.com'],
    ['javascript:alert(1)'],
    ['https://user:pass@api.example.com'],
  ])('rejects %p', (input) => {
    expect(normalizeBaseUrl(input as string)).toBeNull();
  });
});

describe('auth token storage', () => {
  it('is scoped to the API origin', () => {
    setAuthToken(API, 'secret');
    expect(getAuthToken(API)).toBe('secret');
    expect(getAuthToken('https://api.example.com/other/path')).toBe('secret');
    expect(getAuthToken('https://evil.example.net/SMA/API')).toBeNull();
    expect(getAuthToken('https://api.example.com:8443/SMA/API')).toBeNull();
    expect(hasAuthToken('https://evil.example.net')).toBe(false);
  });

  it('has no token without a base URL', () => {
    expect(getAuthToken(null)).toBeNull();
    expect(hasAuthToken(null)).toBe(false);
  });

  it('ignores the old global access_token key', () => {
    localStorage.setItem('access_token', 'legacy');
    expect(getAuthToken(API)).toBeNull();
  });
});

describe('BackendQueryClient.executeQuery', () => {
  it('refuses to run without a configured base URL', async () => {
    const fetchMock = mockFetch({ success: true, data: { data: [] } });
    await expect(new BackendQueryClient().executeQuery('Q')).rejects.toThrow(/API Base URL is not configured/);
    await expect(new BackendQueryClient('http://remote.example.com').executeQuery('Q')).rejects.toThrow(
      /not configured/
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('refuses to run without a token for that origin, and sends nothing', async () => {
    setAuthToken('https://other.example.com', 'other-secret');
    const fetchMock = mockFetch({ success: true, data: { data: [] } });
    await expect(new BackendQueryClient(API).executeQuery('Q')).rejects.toThrow(
      'No API token stored for https://api.example.com'
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('never sends one origin its token to another origin', async () => {
    setAuthToken(API, 'secret');
    const fetchMock = mockFetch({ success: true, data: { data: [] } });
    await expect(new BackendQueryClient('https://evil.example.net/SMA/API').executeQuery('Q')).rejects.toThrow(
      /No API token stored for https:\/\/evil\.example\.net/
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('posts the query with the bearer token, no cookies and no redirects', async () => {
    setAuthToken(API, 'secret');
    const fetchMock = mockFetch({ success: true, data: { data: [{ a: 1 }] } });

    const rows = await new BackendQueryClient(`${API}/`).executeQuery('MY QUERY', { DateArrete: '2024-01-15' });

    expect(rows).toEqual([{ a: 1 }]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${API}/CustomData/getWithFilter?Request=MY%20QUERY`);
    expect(init).toMatchObject({
      method: 'POST',
      credentials: 'omit',
      redirect: 'error',
      headers: { Authorization: 'Bearer secret', 'Content-Type': 'application/json' },
    });
    expect(JSON.parse(init.body)).toEqual([{ name: 'DateArrete', value: '2024-01-15', type: 'string' }]);
  });

  it('throws the backend message when success is false instead of returning []', async () => {
    setAuthToken(API, 'secret');
    mockFetch({ success: false, message: 'Invalid query name' });
    await expect(new BackendQueryClient(API).executeQuery('Q')).rejects.toThrow("Query 'Q' failed: Invalid query name");
  });

  it('throws when the response has no success flag at all', async () => {
    setAuthToken(API, 'secret');
    mockFetch({});
    await expect(new BackendQueryClient(API).executeQuery('Q')).rejects.toThrow("Query 'Q' failed");
  });

  it('throws on HTTP errors', async () => {
    setAuthToken(API, 'secret');
    mockFetch({}, { ok: false, status: 401, statusText: 'Unauthorized' });
    await expect(new BackendQueryClient(API).executeQuery('Q')).rejects.toThrow('HTTP 401 Unauthorized');
  });

  it('returns [] for a successful response with no rows', async () => {
    setAuthToken(API, 'secret');
    mockFetch({ success: true, data: {} });
    await expect(new BackendQueryClient(API).executeQuery('Q')).resolves.toEqual([]);
  });

  it('caches for cacheTime ms and drops the cache when the base URL changes', async () => {
    setAuthToken(API, 'secret');
    const fetchMock = mockFetch({ success: true, data: { data: [{ a: 1 }] } });
    const client = new BackendQueryClient(API);

    await client.executeQuery('Q', {}, 60_000);
    await client.executeQuery('Q', {}, 60_000);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    client.setBaseUrl(`${API}/v2`); // same origin (same token), different endpoint: cached rows are stale
    await client.executeQuery('Q', {}, 60_000);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][0]).toContain(`${API}/v2/CustomData/getWithFilter`);
  });

  it('clearCache(name) only clears that exact query', async () => {
    setAuthToken(API, 'secret');
    const fetchMock = mockFetch({ success: true, data: { data: [] } });
    const client = new BackendQueryClient(API);

    await client.executeQuery('Q', {}, 60_000);
    await client.executeQuery('Q2', {}, 60_000);
    client.clearCache('Q');
    await client.executeQuery('Q', {}, 60_000);
    await client.executeQuery('Q2', {}, 60_000);

    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});

describe('BackendQueryClient.setBaseUrl', () => {
  it('clearing the URL disables the client instead of keeping the old one', () => {
    const client = new BackendQueryClient(API);
    client.setBaseUrl('');
    expect(client.baseUrl).toBeNull();
  });

  it('rejects an unsafe URL instead of keeping the old one', () => {
    const client = new BackendQueryClient(API);
    client.setBaseUrl('http://evil.example.net');
    expect(client.baseUrl).toBeNull();
  });
});

describe('withDefaultBaseUrl', () => {
  it('lets pasted code call new BackendQueryClient() against the panel URL', () => {
    const PanelClient = withDefaultBaseUrl(API);
    expect(new PanelClient().baseUrl).toBe(API);
    expect(new PanelClient('https://other.example.com').baseUrl).toBe('https://other.example.com');
    expect(new PanelClient()).toBeInstanceOf(BackendQueryClient);
  });

  it('stays unconfigured when the panel has no valid URL', () => {
    expect(new (withDefaultBaseUrl(undefined))().baseUrl).toBeNull();
  });
});
