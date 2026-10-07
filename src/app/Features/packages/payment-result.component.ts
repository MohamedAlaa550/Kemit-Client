import { ChangeDetectionStrategy, Component, OnDestroy, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription, timer } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';
import { TranslationService } from '../../Core/I18n/translation.service';
import { AdvertisingBillingService } from '../../Core/Services/advertising-billing.service';

@Component({
  selector: 'app-payment-result',
  imports: [RouterLink],
  template: `
    <section class="result-page section"><div class="result-card">
      @if (status() === 'paid') {<span class="icon success">✓</span><h1>{{text('تم تفعيل الباقة','Plan activated')}}</h1><p>{{text('تم تأكيد الدفع ويمكنك الآن إضافة إعلانك.','Payment confirmed. You can publish your listing now.')}}</p><a class="primary" routerLink="/properties/create">{{text('إضافة إعلان','Create listing')}}</a>}
      @else if (status() === 'failed') {<span class="icon failed">!</span><h1>{{text('لم تكتمل عملية الدفع','Payment was not completed')}}</h1><p>{{text('لم يتم خصم أو تفعيل باقة. يمكنك إعادة المحاولة.','No plan was activated. You can try again.')}}</p><a class="primary" routerLink="/packages">{{text('العودة للباقات','Back to plans')}}</a>}
      @else {<span class="loader"></span><h1>{{text('نتأكد من عملية الدفع','Confirming your payment')}}</h1><p>{{text('قد يستغرق وصول تأكيد Paymob بضع ثوانٍ، لا تغلق الصفحة.','Paymob confirmation may take a few seconds. Keep this page open.')}}</p>}
    </div></section>`,
  styles: [`
    .result-page{display:grid;min-height:70vh;place-items:center;background:#0a0a0a}.result-card{display:grid;width:min(540px,92vw);place-items:center;padding:3rem 2rem;border:1px solid #e3b84f4d;border-radius:1.2rem;background:#151515;color:#fff;text-align:center;box-shadow:0 25px 70px #0008}.icon{display:grid;width:70px;height:70px;place-items:center;border-radius:50%;font-size:2rem;font-weight:900}.success{background:#2d9d5930;color:#62dc8c}.failed{background:#b23c3730;color:#ff827b}.loader{width:58px;height:58px;border:4px solid #ffffff20;border-top-color:var(--color-primary);border-radius:50%;animation:spin .8s linear infinite}.result-card p{color:var(--color-muted);line-height:1.8}.primary{padding:.8rem 1.2rem;border-radius:.7rem;background:var(--color-primary);color:#111;font-weight:900}@keyframes spin{to{transform:rotate(360deg)}}
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentResultComponent implements OnDestroy {
  private readonly billing = inject(AdvertisingBillingService);
  private readonly i18n = inject(TranslationService);
  readonly status = signal<'pending' | 'paid' | 'failed'>('pending');
  private readonly subscription: Subscription;

  constructor() {
    const reference = inject(ActivatedRoute).snapshot.queryParamMap.get('reference') ?? '';
    this.subscription = timer(0, 2000).pipe(take(15), switchMap(() => this.billing.getPaymentResult(reference))).subscribe({
      next: result => {
        const value = String(result.status).toLowerCase();
        if (value === '1' || value === 'paid') this.status.set('paid');
        else if (!['0', 'pending'].includes(value)) this.status.set('failed');
      },
      error: () => this.status.set('failed'),
    });
  }
  ngOnDestroy() { this.subscription.unsubscribe(); }
  text(ar: string, en: string) { return this.i18n.locale() === 'ar' ? ar : en; }
}
