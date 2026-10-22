// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
"use client";
import { Component } from "react";
import { Button } from "@summit/ui";
export default class WorkspaceError extends Component<{
  error: Error;
  reset: () => void;
}> {
  override render() {
    return (
      <main lang="en">
        <h1>SUMMIT / قمة</h1>
        <p role="alert">تعذّر عرض الصفحة · Unable to display this page.</p>
        <Button onClick={this.props.reset}>إعادة المحاولة · Retry</Button>
      </main>
    );
  }
}
