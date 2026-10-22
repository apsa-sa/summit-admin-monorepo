// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import type { UserExportFormat } from "../../../packages/contracts/exports.js";
import { WorkspaceMessages } from "@summit/localization";
import type { Locale } from "@summit/localization";
import type { Theme } from "@summit/design-tokens";
import type {
  User,
  UserInput,
  UserQuery,
} from "../../../packages/contracts/index.js";
import { Validation } from "../../../packages/core/index.js";
import { AuthorizationPolicy } from "../../../packages/core-rbac/index.js";
import { ApiFailure } from "../browser/api.js";
import { DraftAutosaveController } from "../browser/draft-controller.js";
import type { TablePreferenceController } from "./table-preferences.js";
import { WorkspaceStore } from "./state.js";
import type { ViewName } from "./state.js";
import type {
  WorkspaceApi,
  FileDownloadPort,
  WorkspaceNavigation,
  WorkspacePreferenceWriter,
} from "./ports.js";
/** View orchestration only; server services remain authoritative for every mutation. */
import type { BulkUserController } from "./bulk-users.js";
export class WorkspaceController {
  private sequence = 0;
  constructor(
    readonly store: WorkspaceStore,
    private readonly api: WorkspaceApi,
    readonly drafts: DraftAutosaveController,
    private readonly navigation: WorkspaceNavigation,
    private readonly preferences: WorkspacePreferenceWriter,
    private readonly policy: AuthorizationPolicy,
    readonly table: TablePreferenceController,
    readonly bulk: BulkUserController,
    private readonly downloads: FileDownloadPort,
  ) {}
  can(action: string, resource?: User, input?: UserInput): boolean {
    const actor = this.store.snapshot.user;
    if (!actor) return false;
    try {
      this.policy.require(actor, action, resource, input);
      return true;
    } catch {
      return false;
    }
  }
  availableActions(): readonly string[] {
    const actor = this.store.snapshot.user;
    return actor ? this.policy.actionsFor(actor) : [];
  }
  destinations(): ViewName[] {
    return this.can("audit:read")
      ? ["overview", "users", "drafts", "audit", "settings"]
      : ["overview", "users", "drafts", "settings"];
  }
  private message(error: unknown): string {
    return new WorkspaceMessages(this.store.snapshot.locale).error(error);
  }
  private failure(error: unknown): void {
    if (error instanceof ApiFailure && error.status === 401) {
      this.invalidate();
      this.store.clear();
    }
    this.store.patch({ message: this.message(error), error: true });
  }
  private invalidate(): void {
    this.downloads.dispose();
    this.bulk.stop();
    this.store.advanceEpoch();
    this.sequence++;
    this.api.endSession();
    this.drafts.deactivate();
  }
  async mount(): Promise<void> {
    window.addEventListener("popstate", this.pop);
    window.addEventListener("keydown", this.key);
    window.addEventListener("offline", this.offline);
    window.addEventListener("online", this.online);
    this.store.patch({ offline: !navigator.onLine });
    const generation = (this.store.advanceEpoch(), this.store.epoch);
    try {
      const user = await this.api.me();
      if (generation === this.store.epoch) await this.enter(user);
    } catch (error: unknown) {
      if (generation === this.store.epoch) {
        if (error instanceof ApiFailure && error.status === 401) {
          if (this.store.snapshot.user) this.failure(error);
        } else this.failure(error);
      }
    } finally {
      if (generation === this.store.epoch) this.store.patch({ booting: false });
    }
  }
  dispose(): void {
    this.invalidate();
    window.removeEventListener("popstate", this.pop);
    window.removeEventListener("keydown", this.key);
    window.removeEventListener("offline", this.offline);
    window.removeEventListener("online", this.online);
  }
  private offline = (): void => {
    this.store.patch({ offline: true });
  };
  private online = (): void => {
    this.store.patch({ offline: false });
  };
  private pop = (): void => {
    this.bulk.stop();
    this.bulk.clear();
    this.readLocation();
    void this.load();
  };
  private key = (event: KeyboardEvent): void => {
    if (
      (event.ctrlKey || event.metaKey) &&
      event.key.toLowerCase() === "k" &&
      this.store.snapshot.user
    ) {
      event.preventDefault();
      this.store.patch({ palette: !this.store.snapshot.palette });
    }
  };
  preferencesChanged(locale: Locale, theme: Theme): void {
    this.preferences.apply(locale, theme);
    this.store.patch({ locale, theme });
  }
  private readLocation(): void {
    try {
      const value = this.navigation.read(this.store.snapshot.query);
      this.store.patch({
        ...value,
        view: this.destinations().includes(value.view)
          ? value.view
          : "overview",
      });
    } catch (error: unknown) {
      this.store.patch({
        view: "overview",
        message: this.message(error),
        error: true,
      });
    }
  }
  navigate(view: ViewName): void {
    if (!this.destinations().includes(view)) return;
    this.bulk.stop();
    this.bulk.clear();
    this.store.patch({
      view,
      mobile: false,
      palette: false,
      editing: undefined,
      removing: null,
      message: "",
      error: false,
    });
    this.navigation.write(view, this.store.snapshot.query);
    void this.load();
  }
  queryChanged(value: Partial<UserQuery>, load = false): void {
    this.bulk.stop();
    this.bulk.clear();
    const query = { ...this.store.snapshot.query, ...value };
    this.store.patch({ query });
    if (load) {
      this.navigation.write("users", query);
      void this.load();
    }
  }
  private async enter(user: User): Promise<void> {
    this.store.patch({ user, logoutFailed: false, booting: false });
    this.drafts.activate(user.id);
    const epoch = this.store.epoch;
    await this.table.load();
    if (epoch !== this.store.epoch) return;
    this.readLocation();
    await this.load();
  }
  async restoreTable(): Promise<void> {
    if (await this.table.load()) {
      this.navigation.write("users", this.store.snapshot.query, true);
      await this.load();
    }
  }
  async login(email: string, password: string): Promise<void> {
    if (this.store.snapshot.busy) return;
    this.invalidate();
    this.store.clear();
    const generation = this.store.epoch;
    this.store.patch({ busy: true });
    try {
      const user = await this.api.login(email, password);
      if (generation === this.store.epoch) await this.enter(user);
    } catch (error: unknown) {
      if (generation === this.store.epoch) this.failure(error);
    } finally {
      if (generation === this.store.epoch)
        this.store.patch({ busy: false, booting: false });
    }
  }
  async logout(): Promise<void> {
    if (this.store.snapshot.busy) return;
    this.invalidate();
    this.store.clear();
    this.store.patch({ busy: true });
    const generation = this.store.epoch;
    try {
      await this.api.logout();
      if (generation === this.store.epoch) {
        this.store.patch({ logoutFailed: false });
        this.navigation.write("overview", this.store.snapshot.query, true);
      }
    } catch (error: unknown) {
      if (generation === this.store.epoch)
        this.store.patch({
          logoutFailed: true,
          error: true,
          message: this.message(error),
        });
    } finally {
      if (generation === this.store.epoch)
        this.store.patch({ busy: false, booting: false });
    }
  }
  async load(): Promise<void> {
    const s = this.store.snapshot;
    if (!s.user) return;
    const generation = this.store.epoch,
      sequence = ++this.sequence;
    this.bulk.clear();
    this.store.patch({ loading: false });
    if (s.view === "drafts") {
      await this.drafts.load();
      return;
    }
    if (s.view === "settings") return;
    this.store.patch({ loading: true, message: "", error: false });
    try {
      if (s.view === "audit") {
        const audit = await this.api.audit();
        if (generation === this.store.epoch && sequence === this.sequence)
          this.store.patch({ audit });
      } else {
        const q: UserQuery =
          s.view === "overview"
            ? { search: "", role: "", status: "", page: 1, sort: "created_at" }
            : s.query;
        const page = await this.api.users(
          q.page,
          q.search,
          q.role,
          q.status,
          q.sort,
        );
        if (generation === this.store.epoch && sequence === this.sequence)
          this.store.patch({ page });
      }
    } catch (error: unknown) {
      if (generation === this.store.epoch && sequence === this.sequence)
        this.failure(error);
    } finally {
      if (generation === this.store.epoch && sequence === this.sequence)
        this.store.patch({ loading: false });
    }
  }
  async applyBulk(): Promise<void> {
    if (this.store.snapshot.busy || !this.store.snapshot.bulk.confirm) return;
    const epoch = this.store.epoch;
    await this.bulk.run();
    if (
      epoch === this.store.epoch &&
      this.store.snapshot.user &&
      this.store.snapshot.view === "users"
    )
      await this.load();
  }
  edit(user: User | null): void {
    this.store.patch({ editing: user, formError: "" });
  }
  async saveUser(value: unknown, id: string | null): Promise<void> {
    if (this.store.snapshot.busy) return;
    const generation = this.store.epoch;
    this.store.patch({ busy: true, formError: "" });
    try {
      const input = Validation.user(value);
      const saved = id
        ? await this.api.updateUser(id, input)
        : await this.api.createUser(input);
      if (generation === this.store.epoch) {
        this.store.patch({
          editing: undefined,
          ...(saved.id === this.store.snapshot.user?.id ? { user: saved } : {}),
        });
        await this.load();
        if (generation === this.store.epoch)
          this.store.patch({
            message: new WorkspaceMessages(this.store.snapshot.locale).t(
              "userSaved",
            ),
            error: false,
          });
      }
    } catch (error: unknown) {
      if (generation === this.store.epoch) {
        if (error instanceof ApiFailure && error.status === 401)
          this.failure(error);
        else this.store.patch({ formError: this.message(error) });
      }
    } finally {
      if (generation === this.store.epoch) this.store.patch({ busy: false });
    }
  }
  async removeUser(): Promise<void> {
    const user = this.store.snapshot.removing;
    if (!user || this.store.snapshot.busy) return;
    const generation = this.store.epoch;
    this.store.patch({ busy: true });
    try {
      await this.api.deleteUser(user.id);
      if (generation === this.store.epoch) {
        this.store.patch({ removing: null });
        await this.load();
        if (generation === this.store.epoch)
          this.store.patch({
            message: new WorkspaceMessages(this.store.snapshot.locale).t(
              "userRemoved",
            ),
            error: false,
          });
      }
    } catch (error: unknown) {
      if (generation === this.store.epoch) this.failure(error);
    } finally {
      if (generation === this.store.epoch) this.store.patch({ busy: false });
    }
  }
  draftChanged(name: string, organization: string): void {
    this.store.patch({
      draft: { ...this.store.snapshot.draft, name, organization },
    });
    this.drafts.changed();
  }
  async download(format: UserExportFormat): Promise<void> {
    const s = this.store.snapshot;
    if (s.exportBusy || !s.user || !this.can("users:export")) return;
    const generation = this.store.epoch,
      q = s.query;
    this.store.patch({ exportBusy: true, message: "", error: false });
    try {
      const file = await this.api.downloadExport(
        s.locale,
        q.search,
        q.role,
        q.status,
        format,
        q.sort,
      );
      if (generation === this.store.epoch) {
        this.downloads.save(file);
        this.store.patch({
          message: new WorkspaceMessages(this.store.snapshot.locale).t(
            "downloadStarted",
          ),
          error: false,
        });
      }
    } catch (error: unknown) {
      if (generation === this.store.epoch) this.failure(error);
    } finally {
      if (generation === this.store.epoch)
        this.store.patch({ exportBusy: false });
    }
  }
  exportUrl(format: UserExportFormat = "csv"): string {
    const s = this.store.snapshot,
      q = s.query;
    return this.api.exportUrl(
      s.locale,
      q.search,
      q.role,
      q.status,
      format,
      q.sort,
    );
  }
  href(view: ViewName): string {
    return this.navigation.url(view, this.store.snapshot.query);
  }
}
