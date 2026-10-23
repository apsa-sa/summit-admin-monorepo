// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import { AttachmentHttpController } from './attachment-controller.js';
import { BoundedBody } from './bounded-body.js';
import { AttachmentApplicationService } from '../../../packages/application/attachments.js';
import { AttachmentLimits, AttachmentMedia } from '../../../packages/contracts/attachments.js';
import { AttachmentValidation } from '../../../packages/core/attachment-validation.js';
import { AttachmentClassifier } from '../../../packages/files/classifier.js';
import { SharpAttachmentPreparer } from '../../../packages/files/preparer.js';
import { PostgresAttachmentRepository } from '../../../packages/data-access/attachment-repository.js';
import { PdfExporter } from '../../../packages/exports/pdf.js';
import { PdfDocument } from '../../../packages/exports/pdf-document.js';
import { ChromiumPdfPrinter } from '../../../packages/exports/chromium-pdf.js';
import { PostgresExportLease } from '../../../packages/data-access/export-lease.js';
import { printFontCss } from '@summit/design-tokens/print-fonts';
import { PostgresRepository } from '../../../packages/data-access/index.js';
import { PostgresRateLimiter } from '../../../packages/data-access/rate-limiter.js';
import { DatabaseConnectionPolicy } from '../../../packages/data-access/connection-policy.js';
import { SessionService } from '../../../packages/auth/index.js';
import { AuthorizationPolicy } from '../../../packages/core-rbac/index.js';
import { PasswordHasher,SessionToken,RateLimiter } from '../../../packages/security/index.js';
import { SafeLogger } from '../../../packages/observability/index.js';
import { SpreadsheetExporter } from '../../../packages/exports/spreadsheet.js';
import { SpreadsheetText } from '../../../packages/exports/spreadsheet-text.js';
import { CsvExporter } from '../../../packages/exports/index.js';
import { AuthenticationService } from '../../../packages/application/authentication.js';
import { UserApplicationService } from '../../../packages/application/users.js';
import { DraftApplicationService } from '../../../packages/application/drafts.js';
import { AuditApplicationService } from '../../../packages/application/audit.js';
import { AdminHttpController } from './http-controller.js';
import { NodeAdminServer } from './node-server.js';
import { SessionCookie } from './session-cookie.js';
import { JsonBody } from './json-body.js';
import { PublicAssets } from './assets.js';
import { TablePreferenceService } from '../../../packages/application/table-preferences.js';
import { TablePreferenceValidation } from '../../../packages/core/table-preferences.js';
import { PostgresTablePreferenceRepository } from '../../../packages/data-access/table-preference-repository.js';
import { PostgresSessionGuard } from '../../../packages/data-access/session-guard.js';
export class AdminCompositionRoot {
  readonly repository:PostgresRepository;
  readonly controller:AdminHttpController;
  readonly server:NodeAdminServer;
  constructor(databaseUrl:string,origin:string,attempts: 'memory' | 'database' = 'memory'){
    const parsed=new URL(origin);
    if(!['http:','https:'].includes(parsed.protocol)||parsed.origin!==origin)throw new Error('APP_ORIGIN must be an absolute origin without a path');
    this.repository=new PostgresRepository(databaseUrl,new DatabaseConnectionPolicy());
    const sessions=new SessionService(this.repository.identities);const policy=new AuthorizationPolicy();
    const tokens=new SessionToken();const logger=new SafeLogger();const body=new JsonBody();
    this.controller=new AdminHttpController(
      new AuthenticationService(this.repository.identities,sessions,new PasswordHasher(),tokens,attempts === 'database' ? new PostgresRateLimiter(this.repository.pool) : new RateLimiter()),
      new UserApplicationService(this.repository.users,sessions,policy,new CsvExporter(),[new SpreadsheetExporter(new SpreadsheetText()),new PdfExporter(new PdfDocument(printFontCss),new ChromiumPdfPrinter(),new PostgresExportLease(this.repository.pool))]),
      new DraftApplicationService(this.repository.drafts,policy),new AuditApplicationService(this.repository.audit,sessions,policy),
      this.repository,new SessionCookie(tokens,parsed.protocol==='https:'),body,logger,origin,
      new TablePreferenceService(new PostgresTablePreferenceRepository(this.repository.pool,new PostgresSessionGuard(),new TablePreferenceValidation()),policy,new TablePreferenceValidation()),
      new AttachmentHttpController(new AttachmentApplicationService(
        new PostgresAttachmentRepository(this.repository.pool,new PostgresSessionGuard(),this.repository.audit),sessions,policy,
        new AttachmentValidation(),new SharpAttachmentPreparer(new AttachmentClassifier(),new AttachmentValidation()),new AttachmentMedia()),new BoundedBody(AttachmentLimits.bytes)));
    this.server=new NodeAdminServer(this.controller,new PublicAssets(),body,logger,origin);
  }
  async close():Promise<void>{await this.repository.pool.end();}
}
