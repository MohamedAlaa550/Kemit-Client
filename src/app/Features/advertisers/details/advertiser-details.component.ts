import { DatePipe, DecimalPipe, DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { TranslationService } from '../../../Core/I18n/translation.service';
import { AdvertiserProfile } from '../../../Core/Models/api.models';
import { AdvertisersService } from '../../../Core/Services/advertisers.service';
import { NotificationService } from '../../../Core/Services/notification.service';
import { SeoService } from '../../../Core/Services/seo.service';
import { ListingCardComponent } from '../../../Shared/Components/listing-card/listing-card.component';

@Component({
  selector: 'app-advertiser-details',
  imports: [DatePipe, DecimalPipe, RouterLink, ListingCardComponent],
  template: `
    <section class="advertiser-page">
      <div class="container">
        @if (profile(); as advertiser) {
          <nav class="breadcrumbs" aria-label="Breadcrumb">
            <a routerLink="/">{{ text('الرئيسية', 'Home') }}</a><span>‹</span>
            <a routerLink="/properties">{{ text('العقارات', 'Properties') }}</a><span>‹</span>
            <span>{{ advertiser.name }}</span>
          </nav>

          <article class="profile-shell">
            <div class="cover" aria-hidden="true"><span></span><span></span><span></span></div>
            <button class="share-button" type="button" (click)="shareProfile()">
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.8 7.6-4.5M8.2 13.2l7.6 4.5"/></svg>
              {{ text('شارك الملف', 'Share profile') }}
            </button>

            <div class="profile-content">
              <img class="avatar" [src]="avatar()" width="164" height="164" [alt]="advertiser.name">
              <p class="verified-label"><span>✓</span>{{ text('معلن على كيميت', 'Kemet advertiser') }}</p>
              <h1>{{ advertiser.name }}</h1>
              @if(advertiser.memberBadge){<span class="premium-badge">{{advertiser.memberBadge==='VIP'?'VIP':text('عميل مميز','Premium member')}}</span>}
              <p class="joined">{{ text('عضو منذ', 'Member since') }} {{ advertiser.joinedAt | date:'MMMM y':'':dateLocale() }}</p>

              <div class="rating-line" [attr.aria-label]="text('التقييم', 'Rating') + ' ' + advertiser.rating + ' / 5'">
                <strong>{{ advertiser.rating | number:'1.1-1' }}</strong>
                <div class="stars" aria-hidden="true">@for (star of stars; track star) { <span [class.filled]="star <= roundedRating()">★</span> }</div>
                <small>{{ advertiser.ratingCount }} {{ text('تقييم', 'ratings') }}</small>
              </div>

              <div class="stats">
                <div><strong>{{ advertiser.advertisementsCount }}</strong><span>{{ text('إعلان نشط', 'Active listings') }}</span></div>
                <i></i>
                <div><strong>{{ advertiser.ratingCount }}</strong><span>{{ text('إجمالي التقييمات', 'Total ratings') }}</span></div>
              </div>
            </div>
          </article>

          <section class="listings-section">
            <div class="section-heading">
              <div><p>{{ text('عقارات المعلن', 'Advertiser properties') }}</p><h2>{{ text('أحدث الإعلانات', 'Latest listings') }}</h2></div>
              <span>{{ text('مرتبة من الأحدث للأقدم', 'Newest first') }}</span>
            </div>
            @if (advertiser.advertisements.length) {
              <div class="grid-cards">@for (item of advertiser.advertisements; track item.id) { <app-listing-card [item]="item" kind="property"/> }</div>
            } @else {
              <div class="empty-list"><strong>{{ text('لا توجد إعلانات نشطة', 'No active listings') }}</strong><p>{{ text('لم ينشر هذا المعلن أي عقارات متاحة حاليًا.', 'This advertiser has no available properties right now.') }}</p></div>
            }
          </section>
        } @else if (loadFailed()) {
          <div class="not-found"><span>?</span><h1>{{ text('المعلن غير موجود', 'Advertiser not found') }}</h1><a class="btn btn-gold" routerLink="/properties">{{ text('العودة للعقارات', 'Back to properties') }}</a></div>
        }
      </div>
    </section>
  `,
  styles: [`
    .advertiser-page{min-height:100vh;padding:1.35rem 0 5rem;background:linear-gradient(180deg,#0b0b0b 0,#111 42%,#0b0b0b 100%);color:var(--gray-100)}.breadcrumbs{display:flex;align-items:center;gap:.5rem;margin-bottom:1rem;color:var(--color-muted);font-size:.72rem}.breadcrumbs a{color:var(--color-primary);font-weight:700}.profile-shell{position:relative;overflow:hidden;border:1px solid #d6aa4552;border-radius:1.4rem;background:#151515;box-shadow:0 24px 70px #0008}.cover{position:relative;height:190px;overflow:hidden;background:linear-gradient(125deg,#17130b,#b98527 52%,#e7c66f)}.cover:before{position:absolute;inset:0;background:radial-gradient(circle at 25% 30%,#fff3 0,transparent 32%),linear-gradient(90deg,#0005,transparent 45%);content:''}.cover span{position:absolute;width:90px;height:280px;top:-55px;border:1px solid #fff2;border-radius:28px;background:#fff1;transform:rotate(25deg)}.cover span:nth-child(1){inset-inline-end:7%}.cover span:nth-child(2){inset-inline-end:17%}.cover span:nth-child(3){inset-inline-end:27%;opacity:.55}.share-button{position:absolute;z-index:3;top:215px;inset-inline-end:2rem;display:flex;align-items:center;gap:.5rem;padding:.7rem 1.1rem;border:1px solid #d6aa4575;border-radius:.7rem;background:#171717;color:var(--color-primary);font:inherit;font-size:.78rem;font-weight:900;cursor:pointer}.share-button:hover{background:var(--color-primary);color:#111}.share-button svg{width:18px;fill:none;stroke:currentColor;stroke-width:1.8}.profile-content{display:grid;place-items:center;padding:0 2rem 2rem;text-align:center}.avatar{width:164px;height:164px;margin-top:-82px;border:6px solid #151515;border-radius:50%;object-fit:cover;background:#e7c66f;box-shadow:0 0 0 2px var(--color-primary),0 14px 36px #0009}.verified-label{display:flex;align-items:center;gap:.35rem;margin:1rem 0 .25rem;color:var(--color-primary);font-size:.7rem;font-weight:900}.verified-label span{display:grid;width:17px;height:17px;place-items:center;border-radius:50%;background:var(--color-primary);color:#111}.profile-content h1{margin:0;font-size:clamp(1.6rem,4vw,2.25rem)}.joined{margin:.35rem 0;color:var(--color-muted);font-size:.75rem}.rating-line{display:flex;align-items:center;gap:.55rem;margin:.8rem 0}.rating-line>strong{font-size:.9rem}.stars{display:flex;direction:ltr;gap:.12rem}.stars span{color:#514b3d;font-size:1.15rem}.stars span.filled{color:var(--color-primary)}.rating-line small{color:var(--color-muted);font-size:.67rem}.stats{display:flex;align-items:center;gap:1.4rem;margin-top:.55rem;padding:.8rem 1.4rem;border:1px solid var(--color-border);border-radius:1rem;background:#0c0c0ca8}.stats div{display:grid;min-width:90px}.stats strong{color:var(--color-primary);font-size:1.25rem}.stats span{color:var(--color-muted);font-size:.67rem}.stats i{width:1px;height:36px;background:var(--color-border)}.listings-section{padding-top:3rem}.section-heading{display:flex;align-items:end;justify-content:space-between;gap:1rem;margin-bottom:1.3rem}.section-heading p{margin:0;color:var(--color-primary);font-size:.72rem;font-weight:900}.section-heading h2{margin:.25rem 0 0;font-size:clamp(1.35rem,3vw,1.9rem)}.section-heading>span{color:var(--color-muted);font-size:.7rem}.empty-list,.not-found{display:grid;place-items:center;padding:4rem 1rem;border:1px dashed var(--color-border);border-radius:1rem;text-align:center}.empty-list p{color:var(--color-muted)}.not-found{gap:1rem;margin-top:4rem}.not-found>span{display:grid;width:70px;height:70px;place-items:center;border-radius:50%;background:#d6aa4520;color:var(--color-primary);font-size:2rem;font-weight:900}@media(max-width:700px){.cover{height:150px}.avatar{width:132px;height:132px;margin-top:-66px}.share-button{position:static;width:max-content;margin:1rem auto 0}.profile-content{padding:0 1rem 1.5rem}.section-heading{align-items:start;flex-direction:column}.stats{width:100%;justify-content:center}}
    .cover{z-index:1}.profile-content{position:relative;z-index:2}.avatar{position:relative;z-index:3;object-position:center 20%}.premium-badge{margin-top:.45rem;padding:.25rem .7rem;border:1px solid var(--color-primary);border-radius:99px;background:#e3b84f18;color:var(--color-primary);font-size:.65rem;font-weight:900}
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdvertiserDetailsComponent {
  private readonly i18n = inject(TranslationService);
  private readonly document = inject(DOCUMENT);
  private readonly notices = inject(NotificationService);
  readonly profile = signal<AdvertiserProfile | null>(null);
  readonly loadFailed = signal(false);
  readonly stars = [1, 2, 3, 4, 5] as const;
  readonly roundedRating = computed(() => Math.round(this.profile()?.rating ?? 0));
  readonly avatar = computed(() => {
    const path = this.profile()?.avatarUrl;
    return path ? (path.startsWith('http') ? path : `${environment.apiOrigin}/${path.replace(/^\//, '')}`) : 'assets/brand/default-advertiser-avatar.png';
  });

  constructor() {
    const id = inject(ActivatedRoute).snapshot.paramMap.get('id') || '';
    const seo = inject(SeoService);
    inject(AdvertisersService).getById(id).subscribe({
      next: profile => {
        this.profile.set(profile);
        seo.updateLocalized(
          profile.name,
          profile.name,
          `إعلانات وتقييم ${profile.name} على كيميت.`,
          `Listings and ratings for ${profile.name} on Kemet.`,
          `/advertisers/${profile.id}`,
        );
      },
      error: () => this.loadFailed.set(true),
    });
  }

  async shareProfile() {
    const url = this.document.defaultView?.location.href ?? this.document.baseURI;
    try {
      const navigator = this.document.defaultView?.navigator;
      if (navigator?.share) await navigator.share({ title: this.profile()?.name, url });
      else if (navigator?.clipboard) await navigator.clipboard.writeText(url);
      else throw new Error('Sharing unavailable');
      this.notices.show(this.text('تمت مشاركة رابط المعلن', 'Advertiser link shared'), 'success');
    } catch (error) {
      if ((error as DOMException)?.name !== 'AbortError') this.notices.show(this.text('تعذرت مشاركة الرابط', 'Could not share the link'), 'error');
    }
  }

  text(arabic: string, english: string) { return this.i18n.locale() === 'ar' ? arabic : english; }
  dateLocale() { return this.i18n.locale() === 'ar' ? 'ar-EG' : 'en-US'; }
}
