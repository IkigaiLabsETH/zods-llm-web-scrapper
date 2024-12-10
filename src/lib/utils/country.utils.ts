import { countries } from '@lib/data/countries';
import { languages } from '@lib/data/languages';

export const isValidCountry = (countryCode: string) =>
   countries.some((c) => c.country_code === countryCode);

export const getCountryName = (countryCode: string) =>
   countries.find((c) => c.country_code === countryCode)?.country_name;

export const getCountryCode = (countryName: string) =>
   countries.find((c) => c.country_name === countryName)?.country_code;

export const isValidLanguage = (languageCode: string) =>
   languages.some((l) => l.language_code === languageCode);

export const getLanguageName = (languageCode: string) =>
   languages.find((l) => l.language_code === languageCode)?.language_name;

export const getLanguageCode = (languageName: string) =>
   languages.find((l) => l.language_name === languageName)?.language_code;
