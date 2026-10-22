// © 2026 APSA / eng:samer alhamid — apsa.sa, Arab Planets Summit Architectural.
// SPDX-License-Identifier: MIT
export type ProofLocale = 'ar' | 'en';
export type ProofTheme = 'light' | 'dark';
export class ProofPreferences {
  locale(value: string | undefined): ProofLocale { return value === 'en' ? 'en' : 'ar'; }
  theme(value: string | undefined): ProofTheme { return value === 'dark' ? 'dark' : 'light'; }
}
