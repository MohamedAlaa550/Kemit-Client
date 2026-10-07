import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { TranslationService } from '../../Core/I18n/translation.service';
import { AdvertisingAccount, AdvertisingPlan } from '../../Core/Models/api.models';
import { AdvertisingBillingService } from '../../Core/Services/advertising-billing.service';
import { AuthService } from '../../Core/Services/auth.service';
import { NotificationService } from '../../Core/Services/notification.service';
import { SeoService } from '../../Core/Services/seo.service';

@Component({
  selector: 'app-packages',
  imports: [DecimalPipe],
  templateUrl: './packages.component.html',
  styleUrl: './packages.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PackagesComponent {
  private readonly billing = inject(AdvertisingBillingService);
  private readonly router = inject(Router);
  private readonly notices = inject(NotificationService);
  readonly auth = inject(AuthService);
  readonly i18n = inject(TranslationService);
  readonly plans = signal<AdvertisingPlan[]>([]);
  readonly account = signal<AdvertisingAccount | null>(null);
  readonly purchasing = signal<number | null>(null);

  constructor() {
    inject(SeoService).updateLocalized(
      'باقات إعلانات كيميت', 'Kemet advertising plans',
      'اختر الباقة المناسبة وزد فرص ظهور إعلانك.',
      'Choose a plan and increase your listing visibility.', '/packages');
    this.billing.getPlans().subscribe({ next: plans => this.plans.set(plans), error: () => {} });
    if (this.auth.isAuthenticated()) {
      this.auth.getCurrentUser().subscribe({ error: () => {} });
      this.loadAccount();
    }
  }

  buy(plan: AdvertisingPlan) {
    if (!this.auth.isAuthenticated()) {
      void this.router.navigate(['/auth/login'], { queryParams: { returnUrl: '/packages' } });
      return;
    }
    const user = this.auth.currentUser();
    if (user?.phoneNumberConfirmed === false && !this.auth.isAdministrator()) {
      this.notices.show(this.text('أكد رقم واتساب من حسابك أولًا.', 'Verify your WhatsApp number from your account first.'), 'info');
      void this.router.navigate(['/profile']);
      return;
    }
    this.purchasing.set(plan.type);
    this.billing.createCheckout(plan.type).pipe(finalize(() => this.purchasing.set(null))).subscribe({
      next: checkout => window.location.assign(checkout.checkoutUrl),
    });
  }

  planTitle(type: number) {
    if (type === 1) return this.text('إعلان مميز واحد', 'One featured listing');
    if (type === 2) return this.text('باقة المحترف', 'Professional plan');
    return this.text('باقة VIP', 'VIP plan');
  }

  priority(type: number) {
    if (type === 1) return this.text('أولوية في الظهور', 'Priority placement');
    if (type === 2) return this.text('أولوية أعلى في الظهور والبحث', 'Higher placement and search priority');
    return this.text('أعلى أولوية في الموقع والبحث', 'Highest site and search priority');
  }

  text(ar: string, en: string) { return this.i18n.locale() === 'ar' ? ar : en; }
  private loadAccount() { this.billing.getAccount().subscribe({ next: account => this.account.set(account) }); }
}
