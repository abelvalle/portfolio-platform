import type { Response } from 'express';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController cookies', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    jest.restoreAllMocks();
  });

  it('writes access and refresh cookies as httpOnly in production', async () => {
    process.env.NODE_ENV = 'production';
    const authService = {
      login: jest.fn().mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      }),
    } as unknown as AuthService;
    const response = mockResponse();
    const controller = new AuthController(authService);

    await controller.login(
      { email: 'abel@example.com', password: 'Password123' },
      response as unknown as Response,
    );

    expect(response.cookie).toHaveBeenCalledWith(
      'accessToken',
      'access-token',
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'lax',
        secure: true,
        maxAge: 15 * 60 * 1000,
      }),
    );
    expect(response.cookie).toHaveBeenCalledWith(
      'refreshToken',
      'refresh-token',
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'lax',
        secure: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      }),
    );
  });

  it('clears auth cookies with matching security options', async () => {
    process.env.NODE_ENV = 'production';
    const logout = jest.fn().mockResolvedValue({ ok: true });
    const authService = {
      logout,
    } as unknown as AuthService;
    const response = mockResponse();
    const controller = new AuthController(authService);

    await controller.logout({ id: 'user-1' }, response as unknown as Response);

    expect(response.clearCookie).toHaveBeenCalledWith(
      'accessToken',
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'lax',
        secure: true,
      }),
    );
    expect(response.clearCookie).toHaveBeenCalledWith(
      'refreshToken',
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'lax',
        secure: true,
      }),
    );
    expect(logout).toHaveBeenCalledWith('user-1');
  });
});

function mockResponse() {
  return {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  };
}
