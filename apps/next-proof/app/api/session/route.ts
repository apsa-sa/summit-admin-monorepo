// © 2026 APSA / eng:samer alhamid — apsa.sa, Arab Planets Summit Architectural.
// SPDX-License-Identifier: MIT
// ADR-0001 boundary B3: HTTP entry delegates to request-scoped classes.
import { ProofCompositionRoot } from '../../../server/composition-root';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(request: Request): Promise<Response> {
  return new ProofCompositionRoot().handle(request);
}
