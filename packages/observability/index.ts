// © 2026 apsa.sa — Arab Planets Summit Architectural — Eng: Samer alhamid.
// SPDX-License-Identifier: MIT
export class SafeLogger { error(requestId: string, code: string): void { process.stderr.write(JSON.stringify({level:'error',requestId,code})+'\n'); } }
