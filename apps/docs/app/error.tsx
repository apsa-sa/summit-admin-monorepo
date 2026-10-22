// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
"use client";
import { Component } from "react";
import { Button } from "@summit/ui";
export default class DocsError extends Component<{
  readonly error: Error;
  readonly reset: () => void;
}> {
  override render() {
    return (
      <main className="docs-main">
        <h1 lang="ar">تعذّر تحميل التوثيق</h1>
        <p lang="en">Unable to load documentation.</p>
        <Button onClick={this.props.reset}>إعادة المحاولة / Retry</Button>
      </main>
    );
  }
}
