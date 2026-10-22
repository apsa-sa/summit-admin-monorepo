// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import { WorkspaceMessages } from "@summit/localization";
import type { User, UserInput } from "../../../packages/contracts/index.js";
import type { PermissionPolicy } from "../../../packages/contracts/ports.js";
import { ApiFailure } from "../browser/api.js";
import type { DraftAutosaveController } from "../browser/draft-controller.js";
import type { WorkspaceApi } from "./ports.js";
import type { WorkspaceStore } from "./state.js";
import type { BulkResult, BulkState, BulkStatus } from "./bulk-state.js";
interface ActiveBulkRun {
  readonly epoch: number;
  stopped: boolean;
}
/** Bounded, sequential existing user mutations. Each record is independently versioned/audited. */
export class BulkUserController {
  static readonly limit = 8;
  private active: ActiveBulkRun | null = null;
  constructor(
    private readonly store: WorkspaceStore,
    private readonly api: Pick<WorkspaceApi, "updateUser" | "endSession">,
    private readonly drafts: Pick<DraftAutosaveController, "deactivate">,
    private readonly policy: PermissionPolicy,
  ) {}
  private patch(value: Partial<BulkState>): void {
    this.store.patch({ bulk: { ...this.store.snapshot.bulk, ...value } });
  }
  private input(user: User, target: BulkStatus): UserInput {
    return {
      name: user.name,
      email: user.email,
      role: user.role,
      status: target,
      version: user.version,
    };
  }
  eligible(
    user: User,
    target: BulkStatus = this.store.snapshot.bulk.target,
  ): boolean {
    const actor = this.store.snapshot.user;
    if (!actor || user.status === target) return false;
    try {
      this.policy.require(
        actor,
        "users:update",
        user,
        this.input(user, target),
      );
      return true;
    } catch {
      return false;
    }
  }
  available(): boolean {
    return (
      this.store.snapshot.page?.rows.some((user) =>
        this.eligible(
          user,
          user.status === "suspended" ? "active" : "suspended",
        ),
      ) ?? false
    );
  }
  chosen(): readonly User[] {
    const s = this.store.snapshot;
    return (s.page?.rows ?? []).filter(
      (user) => s.bulk.selected.has(user.id) && this.eligible(user),
    );
  }
  toggle(id: string, selected: boolean): void {
    const s = this.store.snapshot,
      user = s.page?.rows.find((user) => user.id === id);
    if (s.busy || s.loading || !user || !this.eligible(user)) return;
    const ids = new Set(s.bulk.selected);
    if (selected && ids.size < BulkUserController.limit) ids.add(id);
    else if (!selected) ids.delete(id);
    this.patch({ selected: ids, results: [] });
  }
  target(value: unknown): void {
    if (
      this.store.snapshot.busy ||
      (value !== "active" && value !== "suspended")
    )
      return;
    this.patch({
      target: value,
      selected: new Set(),
      confirm: false,
      results: [],
    });
  }
  clear(): void {
    this.patch({ selected: new Set(), confirm: false });
  }
  isRunning(): boolean {
    return this.active?.epoch === this.store.epoch;
  }
  stop(): void {
    if (this.active?.epoch === this.store.epoch) {
      this.active.stopped = true;
      this.patch({ stopping: true });
    }
  }
  async run(): Promise<void> {
    const s = this.store.snapshot,
      rows = this.chosen();
    if (
      !s.user ||
      s.busy ||
      !s.bulk.confirm ||
      rows.length === 0 ||
      rows.length > BulkUserController.limit
    )
      return;
    const context: ActiveBulkRun = { epoch: this.store.epoch, stopped: false },
      results: BulkResult[] = [];
    this.active = context;
    this.patch({ confirm: false, results: [], stopping: false });
    this.store.patch({ busy: true });
    try {
      for (const user of rows) {
        if (context.epoch !== this.store.epoch) return;
        if (context.stopped) {
          results.push({
            id: user.id,
            name: user.name,
            outcome: "not_attempted",
            message: "",
          });
          continue;
        }
        try {
          if (!this.eligible(user, s.bulk.target))
            throw new ApiFailure(403, "forbidden");
          const saved = await this.api.updateUser(
            user.id,
            this.input(user, s.bulk.target),
          );
          if (
            saved.id !== user.id ||
            saved.version !== user.version + 1 ||
            saved.status !== s.bulk.target ||
            saved.role !== user.role
          )
            throw new ApiFailure(200, "invalid_response");
          if (context.epoch !== this.store.epoch) return;
          results.push({
            id: user.id,
            name: user.name,
            outcome: "updated",
            message: "",
          });
        } catch (error: unknown) {
          if (context.epoch !== this.store.epoch) return;
          if (error instanceof ApiFailure && error.status === 401) {
            this.store.advanceEpoch();
            this.api.endSession();
            this.drafts.deactivate();
            this.store.clear();
            this.store.patch({
              error: true,
              message: new WorkspaceMessages(this.store.snapshot.locale).error(
                error,
              ),
            });
            return;
          }
          const confirmed =
            error instanceof ApiFailure &&
            [403, 404, 409, 422, 429].includes(error.status);
          results.push({
            id: user.id,
            name: user.name,
            outcome: confirmed ? "rejected" : "unconfirmed",
            message: new WorkspaceMessages(this.store.snapshot.locale).error(
              error,
            ),
          });
          context.stopped = true;
        }
        if (context.epoch === this.store.epoch)
          this.patch({ results: [...results] });
      }
      if (context.epoch === this.store.epoch)
        this.patch({ results: [...results], selected: new Set() });
    } finally {
      if (this.active === context) this.active = null;
      if (context.epoch === this.store.epoch) {
        this.store.patch({ busy: false });
        this.patch({
          stopping: false,
          completion: this.store.snapshot.bulk.completion + 1,
        });
      }
    }
  }
}
