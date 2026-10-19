import es from './dictionaries/es';
import en from './dictionaries/en';
import type { Locale } from './config';

export * from './config';
export { localizePath } from './routes';
export type { Dictionary } from './dictionaries/es';

const dictionaries = { es, en };

export function getDictionary(locale: Locale) {
  return dictionaries[locale];
}
