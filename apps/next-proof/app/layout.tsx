// © 2026 APSA / eng:samer alhamid — apsa.sa, Arab Planets Summit Architectural.
// SPDX-License-Identifier: MIT
// ADR-0001 boundary B1: framework root entry, no business rules.
import { cookies } from 'next/headers';
import type { ReactNode } from 'react';
import { ProofPreferences } from '../presentation/preferences';
import './proof.css';
import '@summit/ui/css';
export default async function RootLayout({ children }: { children: ReactNode }) {
  const values = await cookies();
  const preferences = new ProofPreferences();
  const locale = preferences.locale(values.get('summit_locale')?.value);
  const theme = preferences.theme(values.get('summit_theme')?.value);
  return <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'} data-theme={theme}>
    <body>{children}</body>
  </html>;
}
