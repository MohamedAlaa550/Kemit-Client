import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { TranslationService } from '../../../Core/I18n/translation.service';
import { AuthService } from '../../../Core/Services/auth.service';

@Component({
  selector: 'app-confirm-email',
  imports: [RouterLink],
  template: `
    <section class="form-shell email-confirmation">
      @if (loading()) {
        <p class="eyebrow">{{ text('جارٍ تأكيد البريد...','Confirming your email...') }}</p>
      } @else if (confirmed()) {
        <div class="status success">✓</div>
        <h1>{{ text('تم تأكيد بريدك','Your email is confirmed') }}</h1>
        <p class="muted">{{ text('يمكنك الآن استخدام حسابك وتسجيل الدخول بالبريد الإلكتروني.','You can now use your account and sign in with your email.') }}</p>
        <a class="btn btn-gold" routerLink="/">{{ text('العودة للرئيسية','Go to home') }}</a>
      } @else {
        <div class="status error">!</div>
        <h1>{{ text('تعذر تأكيد البريد','Email confirmation failed') }}</h1>
        <p class="muted">{{ text('قد يكون الرابط غير صالح أو مستخدمًا من قبل.','The link may be invalid or already used.') }}</p>
        <a class="btn btn-gold" routerLink="/auth/login">{{ text('تسجيل الدخول','Sign in') }}</a>
      }
    </section>
  `,
  styles: [`
    .email-confirmation{text-align:center}.status{display:grid;place-items:center;width:64px;height:64px;margin:0 auto 1rem;border-radius:50%;font-size:2rem;font-weight:800}.success{background:#173d2a;color:#62d995}.error{background:#471f24;color:#ff8992}.btn{margin-top:1rem}
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmEmailComponent {
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  readonly i18n = inject(TranslationService);
  readonly loading = signal(true);
  readonly confirmed = signal(false);

  constructor() {
    const userId = this.route.snapshot.queryParamMap.get('userId');
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!userId || !token) { this.loading.set(false); return; }
    this.auth.confirmEmail(userId, token).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: () => this.confirmed.set(true),
      error: () => this.confirmed.set(false),
    });
  }

  text(ar: string, en: string) { return this.i18n.locale() === 'ar' ? ar : en; }
}
