import { clearAccessToken, getAccessToken, setAccessToken } from '../auth/tokenStore';

describe('tokenStore', () => {
  beforeEach(() => {
    clearAccessToken();
  });

  it('armazena token apenas em memória', () => {
    setAccessToken('token-seguro');
    expect(getAccessToken()).toBe('token-seguro');
    expect(localStorage.getItem('token')).toBeNull();
  });
});

describe('api interceptor', () => {
  it('não desloga em erro 400', async () => {
    setAccessToken('fake-token');

    const instance = (await import('axios')).default.create();
    instance.interceptors.response.use(
      (response) => response,
      (error) => {
        const status = error.response?.status;
        if (status === 401) {
          clearAccessToken();
        }
        return Promise.reject(error);
      }
    );

    try {
      await instance.get('/test', {
        validateStatus: () => false,
        adapter: async (config) => ({
          data: { message: 'bad request' },
          status: 400,
          statusText: 'Bad Request',
          headers: {},
          config,
        }),
      });
    } catch {
      /* esperado */
    }

    expect(getAccessToken()).toBe('fake-token');
  });
});
