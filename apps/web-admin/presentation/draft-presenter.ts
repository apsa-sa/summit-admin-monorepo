// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import { WorkspaceMessages } from "@summit/localization";
import type { Draft } from "../../../packages/contracts/index.js";
import type { DraftView } from "../browser/draft-controller.js";
import { WorkspaceStore } from "./state.js";
export class DraftPresenter implements DraftView {
  constructor(
    private readonly store: WorkspaceStore,
    private readonly abort: () => void,
  ) {}
  fields(): { name: string; organization: string } {
    return {
      name: this.store.snapshot.draft.name,
      organization: this.store.snapshot.draft.organization,
    };
  }
  fill(draft: Draft): void {
    this.store.patch({ draft, draftError: "" });
  }
  disabled(draftDisabled: boolean): void {
    this.store.patch({ draftDisabled });
  }
  status(draftStatus: "loading" | "saving" | "saved" | "unsaved"): void {
    this.store.patch({ draftStatus, draftError: "" });
  }
  error(error: unknown): void {
    const message = new WorkspaceMessages(this.store.snapshot.locale).error(
      error,
    );
    if (
      typeof error === "object" &&
      error !== null &&
      "status" in error &&
      error.status === 401
    ) {
      this.store.advanceEpoch();
      this.abort();
      this.store.clear();
      this.store.patch({ message, error: true });
    } else this.store.patch({ draftError: message });
  }
}
