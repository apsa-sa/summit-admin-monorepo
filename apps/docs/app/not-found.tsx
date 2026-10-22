// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
"use client";
import { Component } from "react";
export default class DocsNotFound extends Component {
  override render() {
    return (
      <main className="docs-main">
        <h1>404</h1>
        <p lang="ar">صفحة التوثيق غير موجودة.</p>
        <p lang="en">Documentation page not found.</p>
        <a href="/">التوثيق / Documentation</a>
      </main>
    );
  }
}
