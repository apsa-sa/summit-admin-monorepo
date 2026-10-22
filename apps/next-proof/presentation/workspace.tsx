'use client';
// © 2026 APSA / eng:samer alhamid — apsa.sa, Arab Planets Summit Architectural.
// SPDX-License-Identifier: MIT
import { Component } from 'react';
import type { ProofLocale, ProofTheme } from './preferences';

interface Props { locale: ProofLocale; theme: ProofTheme; }
interface State extends Props { note: string; session: 'idle' | 'loading' | 'active' | 'expired' | 'error'; }
class ProofMessages {
  readonly ar = { title: 'قمة', subtitle: 'أساس واضح. توسّع بثقة.', badge: 'إثبات المعمارية · قيد التطوير',
    heading: 'مساحة المطوّر', body: 'نموذج محدود للتحقق من Next.js والكلاسات والجلسات واتجاه العرض. لم يُعتمد للإنتاج.',
    note: 'ملاحظة تجريبية غير محفوظة', check: 'فحص الجلسة', idle: 'لم تُفحص الجلسة', loading: 'جارٍ الفحص…',
    active: 'جلسة فعّالة', expired: 'تسجيل الدخول مطلوب', error: 'تعذّر الاتصال أو إعداد الخدمة',
    theme: 'تغيير المظهر', locale: 'English', foundation: 'الكلاسات والخدمات', isolation: 'قاعدة مستقلة لكل تثبيت', ownership: 'بياناتك تحت إدارتك' };
  readonly en: Record<keyof ProofMessages['ar'], string> = { title: 'SUMMIT', subtitle: 'A clear foundation. Room to grow.', badge: 'Architecture proof · Development',
    heading: 'Developer workspace', body: 'A limited proof of Next.js, classes, sessions and direction. Not approved for production.',
    note: 'Temporary note — not saved', check: 'Check session', idle: 'Session not checked', loading: 'Checking…',
    active: 'Active session', expired: 'Sign-in required', error: 'Connection or service configuration failed',
    theme: 'Toggle theme', locale: 'العربية', foundation: 'Class-based services', isolation: 'Independent database per installation', ownership: 'Your data, your operation' };
  for(locale: ProofLocale) { return locale === 'ar' ? this.ar : this.en; }
}

/** Interactive presentation stays class-based; no hooks or business rules. */
export class ProofWorkspace extends Component<Props, State> {
  private readonly messages = new ProofMessages();
  private request: AbortController | null = null;
  state: State = { ...this.props, note: '', session: 'idle' };

  componentWillUnmount(): void { this.request?.abort(); }

  private preferences(locale: ProofLocale, theme: ProofTheme): void {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.dataset.theme = theme;
    const secure = location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `summit_locale=${locale}; Path=/; SameSite=Lax; Max-Age=31536000${secure}`;
    document.cookie = `summit_theme=${theme}; Path=/; SameSite=Lax; Max-Age=31536000${secure}`;
    this.setState({ locale, theme });
  }

  private async session(): Promise<void> {
    this.request?.abort();
    const request = new AbortController();
    this.request = request;
    this.setState({ session: 'loading' });
    try {
      const result = await fetch('/api/session', { signal: request.signal, credentials: 'same-origin', cache: 'no-store' });
      if (!request.signal.aborted) this.setState({ session: result.ok ? 'active' : result.status === 401 ? 'expired' : 'error' });
    } catch {
      if (!request.signal.aborted) this.setState({ session: 'error' });
    }
  }

  render() {
    const text = this.messages.for(this.state.locale);
    return <main className="proof-shell">
      <header><a className="wordmark" href="/" aria-label="SUMMIT / قمة">SUMMIT<span> / قمة</span></a>
        <div className="tools"><button type="button" onClick={() => this.preferences(this.state.locale === 'ar' ? 'en' : 'ar', this.state.theme)}>{text.locale}</button>
          <button type="button" onClick={() => this.preferences(this.state.locale, this.state.theme === 'light' ? 'dark' : 'light')}>{text.theme}</button></div>
      </header>
      <section className="intro"><p className="eyebrow">{text.badge}</p><h1>{text.subtitle}</h1><p>{text.body}</p></section>
      <section className="proof-grid" aria-label={text.heading}>
        <article className="workspace-card"><p className="eyebrow">01 / WORKSPACE</p><h2>{text.heading}</h2>
          <label htmlFor="proof-note">{text.note}</label><input id="proof-note" value={this.state.note} maxLength={120} onChange={event => this.setState({ note: event.target.value })} />
          <div className="session-row"><button className="primary" type="button" disabled={this.state.session === 'loading'} onClick={() => { void this.session(); }}>{text.check}</button><p role="status">{text[this.state.session]}</p></div>
        </article>
        <aside className="principles"><p className="eyebrow">02 / FOUNDATION</p><h2>{text.title}</h2><ul><li>{text.foundation}</li><li>{text.isolation}</li><li>{text.ownership}</li></ul></aside>
      </section>
      <footer>© 2026 apsa.sa — Arab Planets Summit Architectural — Eng: Samer alhamid.</footer>
    </main>;
  }
}
