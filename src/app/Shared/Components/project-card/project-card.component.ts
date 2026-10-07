import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { TranslationService } from '../../../Core/I18n/translation.service';
import { Project } from '../../../Core/Models/api.models';
import { localizedLocationName } from '../../Pipes/location-name.pipe';

@Component({
  selector: 'app-project-card',
  imports: [DecimalPipe, RouterLink],
  template: `
    <article class="project-card">
      <div class="media">
        <a class="image-link" [routerLink]="projectLink()" [attr.aria-label]="text('عرض تفاصيل المشروع', 'View project details')">
          <img [src]="currentImage()" width="640" height="420" loading="lazy" [alt]="project().name" (error)="useFallbackImage($event)">
        </a>
        <div class="media-shade" aria-hidden="true"></div>
        <span class="type-badge"><i></i>{{ text('مشروع عقاري', 'Property project') }}</span>
        <span class="status-badge"><i></i>{{ statusLabel() }}</span>
        @if (images().length > 1) {
          <button class="gallery-arrow previous" type="button" (click)="previousImage($event)" [attr.aria-label]="text('الصورة السابقة', 'Previous image')">‹</button>
          <button class="gallery-arrow next" type="button" (click)="nextImage($event)" [attr.aria-label]="text('الصورة التالية', 'Next image')">›</button>
          <span class="image-count">{{ imageIndex() + 1 }} / {{ images().length }}</span>
        }
        <div class="location"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Zm-8 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/></svg><span>{{ location() }}</span></div>
      </div>

      <div class="content">
        <div class="heading"><a [routerLink]="projectLink()"><h2>{{ project().name }}</h2></a><span>#{{ project().id }}</span></div>
        <div class="price-box">
          <span>{{ text('يبدأ من', 'Starting from') }}</span>
          <div><strong>{{ project().startingPrice | number:'1.0-0' }}</strong><b>{{ text('جنيه', 'EGP') }}</b></div>
          @if (project().maxPrice; as maximum) { <small>{{ text('حتى', 'Up to') }} {{ maximum | number:'1.0-0' }} {{ text('جنيه', 'EGP') }}</small> }
        </div>
        <div class="highlights">
          <div><svg viewBox="0 0 24 24"><path d="M3 7h18v10H3zM7 17v2m10-2v2M7 11h4"/></svg><span><small>{{ text('نظام الدفع', 'Payment') }}</small><strong>{{ paymentLabel() }}</strong></span></div>
          <div><svg viewBox="0 0 24 24"><path d="M7 3v3m10-3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z"/></svg><span><small>{{ text('موعد التسليم', 'Delivery') }}</small><strong>{{ deliveryLabel() }}</strong></span></div>
          <div><svg viewBox="0 0 24 24"><path d="M4 21V7l8-4 8 4v14M8 10h2m4 0h2m-8 4h2m4 0h2m-5 7v-4h2v4"/></svg><span><small>{{ text('الوحدات المتاحة', 'Available units') }}</small><strong>{{ project().unitsCount }} {{ text('وحدة', 'units') }}</strong></span></div>
        </div>
        <div class="card-footer">
          <a class="developer" [routerLink]="developerLink()" [attr.aria-label]="text('عرض صفحة المطور', 'View developer profile')"><img [src]="developerLogo()" width="44" height="44" [alt]="project().developerName" (error)="useDeveloperFallback($event)"><span><small>{{ text('المطور العقاري', 'Developed by') }}</small><strong>{{ project().developerName }}</strong></span></a>
          <a class="details-button" [routerLink]="projectLink()"><span>{{ text('عرض المشروع', 'View project') }}</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 6-6 6 6 6"/></svg></a>
        </div>
      </div>
    </article>
  `,
  styles: [`
    :host{display:block;min-width:0;height:100%}.project-card{display:flex;height:535px;overflow:hidden;flex-direction:column;border:1px solid #302a1e;border-radius:20px;background:linear-gradient(155deg,#171613 0%,#0c0c0b 74%);box-shadow:0 18px 45px #00000040;transform:translateZ(0);backface-visibility:hidden;transition:transform .35s ease,border-color .35s ease,box-shadow .35s ease}.project-card:hover{transform:translate3d(0,-7px,0);border-color:#e3b84f80;box-shadow:0 24px 55px #0009,0 0 0 1px #e3b84f18}.media{position:relative;height:225px;flex:0 0 225px;overflow:hidden;isolation:isolate;background:#111}.image-link{display:block;width:100%;height:100%;overflow:hidden}.image-link img{display:block;width:calc(100% + 2px);height:calc(100% + 2px);margin:-1px;object-fit:cover;transform:translateZ(0) scale(1.002);backface-visibility:hidden;will-change:transform;transition:transform .65s ease,filter .4s ease}.project-card:hover .image-link img{transform:translateZ(0) scale(1.06);filter:saturate(1.08)}.media-shade{position:absolute;z-index:1;inset:-1px;background:linear-gradient(180deg,#00000008 28%,#090806e8 100%);pointer-events:none}.type-badge,.status-badge{position:absolute;z-index:3;top:.8rem;display:flex;align-items:center;gap:.35rem;padding:.35rem .7rem;border-radius:99px;font-size:.65rem;font-weight:900;backdrop-filter:blur(8px)}.type-badge{inset-inline-start:.8rem;border:1px solid #ffffff2a;background:#0a0907b8;color:#f8e7b1}.type-badge i,.status-badge i{width:6px;height:6px;border-radius:50%}.type-badge i{background:var(--color-primary);box-shadow:0 0 9px var(--color-primary)}.status-badge{inset-inline-end:.8rem;border:1px solid #ffffff40;background:#f9f5ebec;color:#211b0f}.status-badge i{background:#238a4b;box-shadow:0 0 0 3px #238a4b20}.location{position:absolute;z-index:3;right:1rem;bottom:.85rem;left:1rem;display:flex;min-width:0;align-items:center;gap:.42rem;color:#fff;font-size:.73rem;font-weight:700;text-shadow:0 2px 8px #000}.location svg{width:17px;height:17px;flex:0 0 auto;fill:none;stroke:var(--color-primary);stroke-width:1.8}.location span{overflow:hidden;white-space:nowrap;text-overflow:ellipsis}.gallery-arrow{position:absolute;z-index:4;top:50%;display:grid;width:34px;height:48px;place-items:center;border:1px solid #ffffff4a;border-radius:10px;background:#090909a8;color:#fff;font-size:1.8rem;line-height:1;cursor:pointer;opacity:0;backdrop-filter:blur(6px);transform:translateY(-50%);transition:.2s}.media:hover .gallery-arrow,.gallery-arrow:focus-visible{opacity:1}.gallery-arrow:hover{border-color:var(--color-primary);color:var(--color-primary)}.previous{inset-inline-start:.65rem}.next{inset-inline-end:.65rem}.image-count{position:absolute;z-index:3;right:.8rem;bottom:2.75rem;padding:.2rem .52rem;border-radius:99px;background:#080808bd;color:#fff;font-size:.62rem}.content{display:flex;min-width:0;min-height:0;flex:1;flex-direction:column;padding:1rem 1.05rem 1.05rem}.heading{display:flex;min-width:0;align-items:center;justify-content:space-between;gap:.7rem}.heading>a{min-width:0}.heading h2{overflow:hidden;margin:0;color:#fff;font-size:1.08rem;font-weight:900;line-height:1.5;white-space:nowrap;text-overflow:ellipsis;transition:.2s}.heading a:hover h2{color:var(--color-primary)}.heading>span{flex:0 0 auto;color:#686156;font-size:.58rem;font-weight:800}.price-box{position:relative;display:grid;gap:.05rem;margin:.55rem 0 .7rem;padding:.65rem .78rem;overflow:hidden;border:1px solid #e3b84f35;border-radius:12px;background:linear-gradient(105deg,#e3b84f16,transparent)}.price-box::after{position:absolute;inset-block:0;inset-inline-start:0;width:3px;background:var(--color-primary);content:""}.price-box>span,.price-box small{color:var(--color-muted);font-size:.59rem}.price-box div{display:flex;align-items:baseline;gap:.38rem;color:var(--color-primary)}.price-box strong{font-size:1.28rem;line-height:1.25}.price-box b{font-size:.65rem}.price-box small{position:absolute;inset-inline-end:.75rem;bottom:.6rem}.highlights{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.42rem}.highlights>div{display:flex;min-width:0;align-items:center;gap:.38rem;padding:.48rem .4rem;border:1px solid #ffffff0d;border-radius:10px;background:#ffffff05}.highlights svg{width:18px;height:18px;flex:0 0 auto;fill:none;stroke:#d6ad4b;stroke-width:1.55;stroke-linecap:round;stroke-linejoin:round}.highlights span{display:grid;min-width:0}.highlights small{overflow:hidden;color:#817b70;font-size:.5rem;white-space:nowrap;text-overflow:ellipsis}.highlights strong{overflow:hidden;color:#eee9de;font-size:.61rem;white-space:nowrap;text-overflow:ellipsis}.card-footer{display:flex;align-items:center;gap:.6rem;margin-top:auto;padding-top:.75rem;border-top:1px solid #ffffff12;background:transparent}.developer{display:flex;align-items:center;min-width:0;gap:.55rem}.developer>img{width:44px;height:44px;flex:0 0 auto;padding:0;border:1px solid #e3b84f55;border-radius:50%;background:#f7f3e9;object-fit:cover}.developer>span{display:grid;min-width:0}.developer small{color:var(--color-muted);font-size:.55rem}.developer strong{overflow:hidden;max-width:105px;color:#fff;font-size:.69rem;white-space:nowrap;text-overflow:ellipsis}.developer:hover strong{color:var(--color-primary)}.details-button{display:flex;min-width:max-content;height:38px;align-items:center;gap:.35rem;margin-inline-start:auto;padding:.45rem .65rem;border:1px solid #e3b84f70;border-radius:10px;color:var(--color-primary);font-size:.63rem;font-weight:900;transition:.2s}.details-button svg{width:15px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}.details-button:hover{background:var(--color-primary);color:#0b0905;transform:translateX(-2px)}:host-context([dir="ltr"]) .details-button svg{transform:scaleX(-1)}:host-context([dir="ltr"]) .details-button:hover{transform:translateX(2px)}@media(max-width:450px){.gallery-arrow{width:32px;height:44px;opacity:1}.highlights{gap:.3rem}.highlights>div{padding:.42rem .3rem}.highlights svg{width:16px}.developer strong{max-width:82px}.details-button span{display:none}.details-button{min-width:38px;justify-content:center;padding:.4rem}}
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectCardComponent {
  private readonly i18n = inject(TranslationService);
  readonly project = input.required<Project>();
  readonly imageIndex = signal(0);
  readonly projectLink = computed(() => ['/projects', this.project().id]);
  readonly developerLink = computed(() => ['/developers', this.project().developerId]);
  readonly images = computed(() => this.project().images?.map(path => this.imageUrl(path)).filter(Boolean) ?? []);
  readonly currentImage = computed(() => this.images()[this.imageIndex()] || 'assets/brand/kemit-logo.jpeg');
  readonly developerLogo = computed(() => this.imageUrl(this.project().developerLogoUrl || '') || 'assets/brand/kemit-logo-128.png');
  readonly location = computed(() => {
    const locale = this.i18n.locale();
    const city = localizedLocationName(this.project().cityName, locale);
    const governorate = localizedLocationName(this.project().governorateName, locale);
    return [city, governorate].filter(Boolean).join(this.text('، ', ', ')) || this.text('مصر', 'Egypt');
  });
  text(arabic: string, english: string) { return this.i18n.locale() === 'ar' ? arabic : english; }
  previousImage(event: Event) { event.preventDefault(); event.stopPropagation(); this.imageIndex.update(index => (index - 1 + this.images().length) % this.images().length); }
  nextImage(event: Event) { event.preventDefault(); event.stopPropagation(); this.imageIndex.update(index => (index + 1) % this.images().length); }
  paymentLabel() { return this.localizedEnum(this.project().paymentMethod, { Cash: ['كاش', 'Cash'], Installment: ['تقسيط', 'Installment'], CashOrInstallment: ['كاش أو تقسيط', 'Cash or installment'] }); }
  statusLabel() { return this.localizedEnum(this.project().status, { UnderConstruction: ['تحت الإنشاء', 'Under construction'], Ready: ['جاهز', 'Ready'], ComingSoon: ['قريبًا', 'Coming soon'] }); }
  deliveryLabel() { const value = this.project().deliveryDate; if (!value) return this.text('غير محدد', 'Not specified'); const date = new Date(value); if (Number.isNaN(date.getTime())) return this.text('غير محدد', 'Not specified'); return new Intl.DateTimeFormat(this.i18n.locale() === 'ar' ? 'ar-EG' : 'en', { month: 'short', year: 'numeric' }).format(date); }
  useFallbackImage(event: Event) { (event.target as HTMLImageElement).src = 'assets/brand/kemit-logo.jpeg'; }
  useDeveloperFallback(event: Event) { (event.target as HTMLImageElement).src = 'assets/brand/kemit-logo-128.png'; }
  private localizedEnum(value: string | number, labels: Record<string, [string, string]>) { const names = Object.keys(labels); const key = typeof value === 'number' ? names[value] : String(value); const label = labels[key]; return label ? label[this.i18n.locale() === 'ar' ? 0 : 1] : key; }
  private imageUrl(path: string) { return path ? (path.startsWith('http') ? path : `${environment.apiOrigin}/${path.replace(/^\//, '')}`) : ''; }
}
