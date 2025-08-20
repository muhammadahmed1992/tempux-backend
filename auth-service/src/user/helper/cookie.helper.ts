import { Request, Response } from 'express';
export default class CookieHelper {
  public static setCookies(
    res: Response,
    key: string,
    value: any,
    isProd: boolean,
    dns: string,
    isRequestComingFromLocalHost: boolean,
    expiry?: number,
  ) {
    //TOOD: Will have to remove this condition
    res.cookie(key, value, {
      httpOnly: true,
      secure: isProd,
      sameSite: isRequestComingFromLocalHost ? 'none' : 'strict',
      domain: `.${dns}`,
      maxAge: expiry || 15552000000, // 180 days
    });
  }

  public static clearCookies(
    res: Response,
    key: string,
    sameSite: 'lax' | 'strict',
    isProd: boolean,
    frontendUrl?: string,
  ) {
    res.clearCookie(key, {
      httpOnly: true,
      secure: isProd,
      sameSite,
      domain: this.getDomain(isProd, frontendUrl),
    });
  }

  public static getCookieValue(req: Request, key: string): string | undefined {
    if (this.hasCookies(req)) {
      return req.cookies[key];
    }
    return undefined;
  }

  public static clearAllCookies(
    req: Request,
    res: Response,
    sameSite: 'lax' | 'strict',
    isProd: boolean,
    frontendUrl?: string,
  ) {
    if (!this.hasCookies(req)) return;

    for (const key of Object.keys(req.cookies)) {
      this.clearCookies(res, key, sameSite, isProd, frontendUrl);
    }
  }

  private static getDomain(
    isProd: boolean,
    frontendUrl?: string,
  ): string | undefined {
    if (!isProd || !frontendUrl) return undefined; // Let browser handle for dev/local

    try {
      const urlObj = new URL(frontendUrl);
      let cookieDomain = urlObj.hostname;

      // Strip subdomain for cross-subdomain cookies
      const parts = cookieDomain.split('.');
      if (parts.length > 2) {
        cookieDomain = '.' + parts.slice(-2).join('.');
      }
      console.log('in setting cookie');
      console.log(cookieDomain);
      return cookieDomain;
    } catch {
      return undefined;
    }
  }

  private static hasCookies(
    req: Request,
  ): req is Request & { cookies: Record<string, string> } {
    return typeof (req as any).cookies === 'object';
  }
}
