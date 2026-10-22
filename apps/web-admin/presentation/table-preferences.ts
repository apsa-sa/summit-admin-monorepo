// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import { WorkspaceMessages } from "@summit/localization";
import type { UserTableColumn } from "../../../packages/contracts/table-preferences.js";
import { TablePreferenceValidation } from "../../../packages/core/table-preferences.js";
import { ApiFailure } from "../browser/api.js";
import type { DraftAutosaveController } from "../browser/draft-controller.js";
import type { WorkspaceApi } from "./ports.js";
import type { WorkspaceStore } from "./state.js";
/** Explicit save/reload, optimistic versions and session epochs; no background write queue. */
export class TablePreferenceController {
  private sequence = 0;
  constructor(
    private readonly store: WorkspaceStore,
    private readonly api: WorkspaceApi,
    private readonly drafts: DraftAutosaveController,
  ) {}
  toggle(column: UserTableColumn, visible: boolean): void {
    const s = this.store.snapshot;
    if (column === "name" || s.tableBusy || !s.tableReady) return;
    const selected = new Set(s.tablePreferences.columns);
    if (visible) selected.add(column);
    else selected.delete(column);
    const columns = new TablePreferenceValidation()
      .defaults()
      .columns.filter((key) => selected.has(key));
    this.store.patch({
      tablePreferences: { ...s.tablePreferences, columns },
      tableMessage: "",
      tableError: false,
    });
  }
  async load(): Promise<boolean> {
    if (!this.store.snapshot.user || this.store.snapshot.tableBusy)
      return false;
    const epoch = this.store.epoch,
      sequence = ++this.sequence;
    this.store.patch({ tableBusy: true, tableMessage: "", tableError: false });
    try {
      const value = await this.api.tablePreferences();
      if (epoch !== this.store.epoch || sequence !== this.sequence)
        return false;
      this.store.patch({
        tablePreferences: value,
        query: { ...value.query },
        tableReady: true,
      });
      return true;
    } catch (error: unknown) {
      if (epoch === this.store.epoch && sequence === this.sequence)
        this.failure(error, true);
      return false;
    } finally {
      if (epoch === this.store.epoch && sequence === this.sequence)
        this.store.patch({ tableBusy: false });
    }
  }
  async save(): Promise<void> {
    const s = this.store.snapshot;
    if (!s.user || s.tableBusy || !s.tableReady) return;
    const epoch = this.store.epoch,
      sequence = ++this.sequence;
    const input = { ...s.tablePreferences, query: { ...s.query } };
    this.store.patch({ tableBusy: true, tableMessage: "", tableError: false });
    try {
      const saved = await this.api.saveTablePreferences(input);
      if (epoch === this.store.epoch && sequence === this.sequence)
        this.store.patch({
          tablePreferences: saved,
          tableMessage: new WorkspaceMessages(this.store.snapshot.locale).t(
            "viewSaved",
          ),
          tableError: false,
        });
    } catch (error: unknown) {
      if (epoch === this.store.epoch && sequence === this.sequence)
        this.failure(error, false);
    } finally {
      if (epoch === this.store.epoch && sequence === this.sequence)
        this.store.patch({ tableBusy: false });
    }
  }
  private failure(error: unknown, loading: boolean): void {
    if (error instanceof ApiFailure && error.status === 401) {
      this.store.advanceEpoch();
      this.api.endSession();
      this.drafts.deactivate();
      this.store.clear();
      this.store.patch({
        message: new WorkspaceMessages(this.store.snapshot.locale).error(error),
        error: true,
      });
      return;
    }
    this.store.patch({
      tableMessage: new WorkspaceMessages(this.store.snapshot.locale).error(
        error,
      ),
      tableError: true,
      ...(loading || (error instanceof ApiFailure && error.status === 409)
        ? { tableReady: false }
        : {}),
    });
  }
}
