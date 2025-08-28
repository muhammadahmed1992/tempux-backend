import { Request, Response } from 'express';
export default class CookieHelper {
  public static setCookies(
    res: Response,
    key: string,
    httpOnly: boolean,
    value: any,
    dns: string,
    expiry?: number,
  ) {
    // TODO: Will uncomment
    res.cookie(key, value, {
      httpOnly,
      secure: true,
      sameSite: 'strict',
      domain: dns,
      path: '/',
      maxAge: expiry || 15552000000, // 180 days
    });
  }

  public static clearCookies(
    res: Response,
    key: string,
    sameSite: 'lax' | 'strict',
    httpOnly: boolean,
    dns?: string,
  ) {
    const expiry = new Date(0);
    res.clearCookie(key, {
      secure: true,
      sameSite: sameSite,
      path: '/',
      httpOnly,
      expires: expiry,
      domain: dns,
    });
  }

  public static getCookieValue(req: Request, key: string): string | undefined {
    if (this.hasCookies(req)) {
      return req.cookies[key];
    }
    return undefined;
  }

  private static hasCookies(
    req: Request,
  ): req is Request & { cookies: Record<string, string> } {
    return typeof (req as any).cookies === 'object';
  }
}
