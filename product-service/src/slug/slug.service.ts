import { Injectable } from '@nestjs/common';
import slugify from 'slugify';

// Define the Options interface manually, based on slugify's expected options.
// This ensures TypeScript knows it's always an object when we use it.
interface SlugifyOptions {
  replacement?: string;
  remove?: RegExp;
  lower?: boolean;
  strict?: boolean;
  locale?: string;
  trim?: boolean;
}

@Injectable()
export class SlugService {
  /**
   * Generates a URL-friendly slug from a given string.
   * @param text The input string (e.g., product name, combined names).
   * @param options Optional slugify options.
   * @returns The generated slug.
   */
  generateSlug(text: string, options?: SlugifyOptions): string {
    const defaultOptions: SlugifyOptions = {
      lower: true,
      strict: true,
      locale: 'en',
      remove: /[*+~.()'"!:@]/g,
    };

    return slugify(text, { ...defaultOptions, ...options });
  }
}
