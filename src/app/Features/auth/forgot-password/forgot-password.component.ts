import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../Core/Services/auth.service';
import { SeoService } from '../../../Core/Services/seo.service';
import { TranslationService } from '../../../Core/I18n/translation.service';

@Component({ selector: 'app-forgot-password', imports: [ReactiveFormsModule, RouterLink], templateUrl: './forgot-password.component.html', changeDetection: ChangeDetectionStrategy.OnPush })
export class ForgotPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  readonly i18n = inject(TranslationService);
  readonly submitting = signal(false);
  readonly sent = signal(false);
  readonly form = this.fb.nonNullable.group({ email: ['', [Validators.required, Validators.email]] });

  constructor() {
    inject(SeoService).updateLocalized('استعادة كلمة المرور', 'Recover password', 'استعد حساب كيميت من خلال بريدك الإلكتروني.', 'Recover your Kemet account through email.', '/auth/forgot-password');
  }

  text(ar: string, en: string) { return this.i18n.locale() === 'ar' ? ar : en; }
  submit() {
    if (this.form.invalid || this.submitting()) { this.form.markAllAsTouched(); return; }
    this.submitting.set(true);
    this.auth.forgotPassword({ email: this.form.controls.email.value.trim() }).pipe(finalize(() => this.submitting.set(false))).subscribe({ next: () => this.sent.set(true) });
  }
}
