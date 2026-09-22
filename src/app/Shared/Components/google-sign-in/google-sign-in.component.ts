import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { TranslationService } from '../../../Core/I18n/translation.service';
import { AuthService } from '../../../Core/Services/auth.service';
import { NotificationService } from '../../../Core/Services/notification.service';

type GoogleCredentialResponse = { credential?: string };

@Component({
  selector: 'app-google-sign-in',
  template: `
    <div class="separator">
      <span>{{ i18n.locale() === 'ar' ? 'أو' : 'or' }}</span>
    </div>
    @if (configured) {
      <div class="google-wrap" [class.busy]="submitting()">
        <div #googleButton></div>
        @if (submitting()) {
          <span class="google-loading">{{
            i18n.locale() === 'ar' ? 'جارٍ تسجيل الدخول…' : 'Signing in…'
          }}</span>
        }
      </div>
    } @else {
      <p class="config-note">
        {{
          i18n.locale() === 'ar'
            ? 'يلزم ضبط Google Client ID لتفعيل التسجيل بجوجل.'
            : 'Configure Google Client ID to enable Google sign-in.'
        }}
      </p>
    }
  `,
  styles: [
    `
      .separator {
        display: flex;
        align-items: center;
        gap: 0.8rem;
        margin: 1.25rem 0;
        color: var(--color-muted);
      }
      .separator:before,
      .separator:after {
        content: '';
        height: 1px;
        flex: 1;
        background: var(--color-border);
      }
      .separator span {
        font-size: 0.78rem;
      }
      .google-wrap {
        position: relative;
        display: grid;
        min-height: 44px;
        place-items: center;
        overflow: hidden;
      }
      .google-wrap.busy > div {
        visibility: hidden;
      }
      .google-loading {
        position: absolute;
        color: var(--color-muted);
        font-size: 0.85rem;
      }
      .config-note {
        margin: 1rem 0;
        text-align: center;
        color: var(--color-muted);
        font-size: 0.78rem;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GoogleSignInComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly notices = inject(NotificationService);
  private readonly document = inject(DOCUMENT);
  readonly i18n = inject(TranslationService);
  readonly mode = input<'signin' | 'signup'>('signin');
  readonly submitting = signal(false);
  readonly button = viewChild<ElementRef<HTMLElement>>('googleButton');
  readonly configured = !!environment.googleClientId;

  constructor() {
    afterNextRender(() => {
      if (this.configured) void this.initialize();
    });
  }

  private async initialize() {
    await this.loadGoogleScript();
    const google = (window as any).google;
    const host = this.button()?.nativeElement;
    if (!google?.accounts?.id || !host) return;
    google.accounts.id.initialize({
      client_id: environment.googleClientId,
      callback: (response: GoogleCredentialResponse) => this.handleCredential(response),
      auto_select: false,
      cancel_on_tap_outside: true,
    });
    google.accounts.id.renderButton(host, {
      type: 'standard',
      theme: 'filled_black',
      size: 'large',
      shape: 'pill',
      text: this.mode() === 'signup' ? 'signup_with' : 'signin_with',
      locale: this.i18n.locale(),
      width: Math.min(380, host.parentElement?.clientWidth ?? 380),
    });
  }

  private handleCredential(response: GoogleCredentialResponse) {
    if (!response.credential || this.submitting()) return;
    this.submitting.set(true);
    this.auth
      .googleLogin({ idToken: response.credential })
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => {
          this.notices.show(
            this.i18n.locale() === 'ar'
              ? 'تم تسجيل الدخول باستخدام Google'
              : 'Signed in with Google',
            'success',
          );
          void this.router.navigateByUrl(this.route.snapshot.queryParamMap.get('returnUrl') || '/');
        },
      });
  }

  private loadGoogleScript(): Promise<void> {
    if ((window as any).google?.accounts?.id) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const existing = this.document.getElementById(
        'google-identity-script',
      ) as HTMLScriptElement | null;
      if (existing) {
        existing.addEventListener('load', () => resolve(), { once: true });
        existing.addEventListener('error', reject, { once: true });
        return;
      }
      const script = this.document.createElement('script');
      script.id = 'google-identity-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = reject;
      this.document.head.appendChild(script);
    });
  }
}
