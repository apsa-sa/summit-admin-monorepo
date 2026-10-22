// © 2026 apsa.sa — Arab Planets Summit Architectural — Eng: Samer alhamid.
// SPDX-License-Identifier: MIT
import type { User } from '../contracts/index.js';
export class CsvExporter {
  cell(value: string): string { const safe=/^[\s]*[=+@\-\t\r]/.test(value) ? `'${value}` : value; return `"${safe.replaceAll('"','""')}"`; }
  render(rows: User[], locale: string): string { const header=locale==='en'?['Name','Email','Role','Status']:['الاسم','البريد الإلكتروني','الدور','الحالة']; const lines=[header,...rows.map(row=>[row.name,row.email,row.role,row.status])]; return '\ufeff'+lines.map(row=>row.map(cell=>this.cell(cell)).join(',')).join('\r\n'); }
}
