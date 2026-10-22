// © 2026 APSA / eng:samer alhamid — apsa.sa, Arab Planets Summit Architectural.
// SPDX-License-Identifier: MIT
// ADR-0001 boundary B2: server-to-client plain-data handoff only.
import { cookies } from 'next/headers';
import { ProofPreferences } from '../presentation/preferences';
import { ProofWorkspace } from '../presentation/workspace';
export default async function Page() {
  const values = await cookies();
  const preferences = new ProofPreferences();
  return <ProofWorkspace locale={preferences.locale(values.get('summit_locale')?.value)} theme={preferences.theme(values.get('summit_theme')?.value)} />;
}
