import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../Core/Services/auth.service';
import { SeoService } from '../../../Core/Services/seo.service';
import { TranslatePipe } from '../../../Shared/Pipes/translate.pipe';

@Component({ selector: 'app-forgot-password', imports: [ReactiveFormsModule, RouterLink, TranslatePipe], templateUrl: './forgot-password.component.html', changeDetection: ChangeDetectionStrategy.OnPush })
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder); private auth = inject(AuthService);
  readonly submitting = signal(false); readonly sent = signal(false); readonly retry = signal(0);
  readonly form = this.fb.nonNullable.group({ email: ['', [Validators.required, Validators.email]] });
  private timer?: ReturnType<typeof setInterval>;
  constructor() { inject(SeoService).update('استعادة كلمة المرور', 'استعد حساب كيميت بأمان.', '/auth/forgot-password'); }
  submit() { if (this.form.invalid || this.submitting() || this.retry() > 0) { this.form.markAllAsTouched(); return; } this.submitting.set(true); this.auth.forgotPassword(this.form.getRawValue()).pipe(finalize(() => this.submitting.set(false))).subscribe({ next: () => { this.sent.set(true); this.cooldown(); } }); }
  private cooldown() { this.retry.set(60); clearInterval(this.timer); this.timer = setInterval(() => { this.retry.update(v => Math.max(0, v - 1)); if (!this.retry()) clearInterval(this.timer); }, 1000); }
}
