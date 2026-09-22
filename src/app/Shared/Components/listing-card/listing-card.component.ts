import { DecimalPipe, isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, effect, inject, input, PLATFORM_ID, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { TranslationService } from '../../../Core/I18n/translation.service';
import { Advertisement, Favorite, Project } from '../../../Core/Models/api.models';
import { AuthService } from '../../../Core/Services/auth.service';
import { FavoritesService } from '../../../Core/Services/favorites.service';
import { NotificationService } from '../../../Core/Services/notification.service';

@Component({
  selector: 'app-listing-card',
  imports: [DecimalPipe, RouterLink],
  host: { '[class.advertisement-card]': `kind() === 'property'` },
  template: `
    <article class="card">
      <div class="media">
        <a [routerLink]="link()" [attr.aria-label]="text('عرض تفاصيل الإعلان', 'View listing details')">
          <img [src]="currentImage()" width="560" height="360" loading="lazy" [alt]="title()">
        </a>
        <span class="badge">{{ kind() === 'project' ? text('مشروع', 'Project') : advertisementTypeLabel() }}</span>

        @if (images().length > 1) {
          <button class="gallery-arrow previous" type="button" (click)="previousImage($event)" [attr.aria-label]="text('الصورة السابقة', 'Previous image')">‹</button>
          <button class="gallery-arrow next" type="button" (click)="nextImage($event)" [attr.aria-label]="text('الصورة التالية', 'Next image')">›</button>
          <span class="image-count">{{ imageIndex() + 1 }} / {{ images().length }}</span>
        }

        @if (kind() === 'property') {
          <button class="favorite" type="button" [class.selected]="isFavorite()" [disabled]="favoriteBusy()" (click)="toggleFavorite($event)" [attr.aria-label]="isFavorite() ? text('إزالة من المفضلة', 'Remove from favorites') : text('إضافة للمفضلة', 'Add to favorites')">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z"/></svg>
          </button>
        }
      </div>

      <div class="body">
        @if (kind() === 'property') {
          <small class="published">{{ publishedAt() }}</small>
          <a class="listing-link" [routerLink]="link()">
            <div class="price"><strong>{{ price() | number:'1.0-0' }}</strong><span>{{ text('جنيه', 'EGP') }}</span></div>
            <h3>{{ title() }}</h3>
          </a>

          <div class="facts">
            <span><svg viewBox="0 0 24 24"><path d="M3 12h18v7H3zM5 8h5a2 2 0 0 1 2 2v2H3v-2a2 2 0 0 1 2-2Z"/></svg><b>{{ bedrooms() }}</b></span>
            <span><svg viewBox="0 0 24 24"><path d="M4 13h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-3Zm2 0V6a3 3 0 0 1 6 0"/></svg><b>{{ bathrooms() }}</b></span>
            <span><b>{{ area() }}</b> {{ text('م²', 'sqm') }}</span>
            <span><svg viewBox="0 0 24 24"><path d="M4 21V7l8-4 8 4v14M8 10h2m4 0h2m-8 4h2m4 0h2m-5 7v-4h2v4"/></svg><b>{{ propertyTypeLabel() }}</b></span>
          </div>

          <p class="location"><svg viewBox="0 0 24 24"><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Zm-8 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/></svg>{{ location() }}</p>

          <div class="footer">
            <div class="advertiser">
              <img [src]="advertiserAvatar()" width="36" height="36" [alt]="advertiserName()">
              <span><small>{{ text('المعلن', 'Listed by') }} · {{ publisherTypeLabel() }}</small><b>{{ advertiserName() }}</b></span>
            </div>
            @if (phone()) {
              <div class="actions">
                <a [href]="'tel:' + phone()"><svg viewBox="0 0 24 24"><path d="M6.6 10.8a15.5 15.5 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.24c1.1.36 2.3.54 3.6.54a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.3.18 2.5.54 3.6a1 1 0 0 1-.24 1Z"/></svg>{{ text('اتصال', 'Call') }}</a>
                <a class="whatsapp" [href]="whatsappUrl()" target="_blank" rel="noopener"><svg viewBox="0 0 24 24"><path d="M20 11.8a8 8 0 0 1-11.8 7l-4.2 1 1.1-4A8 8 0 1 1 20 11.8Z"/></svg>{{ text('واتساب', 'WhatsApp') }}</a>
              </div>
            }
          </div>
        } @else {
          <p class="eyebrow">{{ subtitle() }}</p><h3>{{ title() }}</h3><p class="muted">⌖ {{ location() }}</p>
          <div class="project-foot"><strong>{{ price() | number:'1.0-0' }} {{ text('جنيه', 'EGP') }}</strong><b>←</b></div>
        }
      </div>
    </article>
  `,
  styles: [`
    :host{display:block;width:100%;min-width:0;height:100%}:host(.advertisement-card) .card{height:485px}
    .card{display:flex;width:100%;min-width:0;height:100%;overflow:hidden;flex-direction:column;border:1px solid var(--color-border);border-radius:var(--card-radius);background:var(--card-bg);transition:.3s}.card:hover{transform:translateY(-5px);border-color:color-mix(in srgb,var(--color-primary),transparent 50%);box-shadow:var(--shadow-gold)}
    .media{position:relative;height:210px;flex:0 0 210px;overflow:hidden;background:#111}.media>a,.media img{display:block;width:100%;height:100%}.media img{object-fit:cover;transition:.45s}.card:hover .media img{transform:scale(1.025)}
    .badge{position:absolute;z-index:2;top:.8rem;inset-inline-start:.8rem;padding:.3rem .7rem;border-radius:99px;background:#050505dc;color:var(--color-primary);font-size:.7rem;font-weight:800;backdrop-filter:blur(5px)}
    .favorite,.gallery-arrow{position:absolute;z-index:3;display:grid;place-items:center;border:1px solid #ffffff5c;background:#090909a8;color:#fff;cursor:pointer;backdrop-filter:blur(6px)}.favorite{top:.7rem;inset-inline-end:.7rem;width:38px;height:38px;border-radius:50%}.favorite svg{width:20px;fill:transparent;stroke:currentColor;stroke-width:1.8}.favorite.selected{border-color:var(--color-primary);color:var(--color-primary)}.favorite.selected svg{fill:currentColor}.favorite:disabled{opacity:.55}
    .gallery-arrow{top:50%;width:34px;height:50px;border-radius:9px;font-size:2rem;line-height:1;transform:translateY(-50%);opacity:0;transition:.2s}.media:hover .gallery-arrow,.gallery-arrow:focus-visible{opacity:1}.previous{inset-inline-start:.65rem}.next{inset-inline-end:.65rem}.image-count{position:absolute;z-index:2;bottom:.65rem;inset-inline-end:.7rem;padding:.18rem .5rem;border-radius:99px;background:#080808bd;color:#fff;font-size:.65rem}
    .body{display:flex;min-width:0;min-height:0;flex:1;flex-direction:column;padding:.8rem 1rem}.published{display:block;margin-bottom:.1rem;color:var(--color-muted);font-size:.63rem}.listing-link{display:block;min-width:0}.price{display:flex;min-width:0;align-items:baseline;gap:.4rem;color:var(--color-primary)}.price strong{overflow:hidden;font-size:1.4rem;line-height:1.35;white-space:nowrap;text-overflow:ellipsis}.price span{flex:0 0 auto;font-size:.72rem;font-weight:800}.body h3{overflow:hidden;margin:.02rem 0 .4rem;color:var(--gray-300);font-size:.85rem;font-weight:600;line-height:1.5;white-space:nowrap;text-overflow:ellipsis}
    .facts{display:flex;min-width:0;align-items:center;gap:.55rem;margin:.2rem 0 .6rem;color:var(--gray-300);font-size:.72rem;white-space:nowrap}.facts span{display:flex;min-width:0;align-items:center;gap:.25rem;padding-inline-end:.55rem;border-inline-end:1px solid var(--color-border)}.facts span:last-child{overflow:hidden;border:0;text-overflow:ellipsis}.facts svg,.location svg,.actions svg{width:17px;height:17px;flex:0 0 auto;fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}.facts b{overflow:hidden;color:#fff;font-weight:700;text-overflow:ellipsis}
    .location{display:flex;align-items:center;gap:.35rem;overflow:hidden;margin:.25rem 0 .55rem;color:var(--color-muted);font-size:.72rem;white-space:nowrap;text-overflow:ellipsis}.location svg{flex:0 0 auto;color:var(--color-primary)}
    .footer{display:flex;align-items:center;justify-content:space-between;gap:.65rem;margin-top:auto;padding-top:.55rem;border-top:1px solid var(--color-border)}.advertiser{display:flex;align-items:center;min-width:0;gap:.5rem}.advertiser>img{width:34px;height:34px;flex:0 0 auto;border:1px solid var(--color-border);border-radius:50%;object-fit:cover;background:#191919}.advertiser>span{display:grid;min-width:0}.advertiser small{overflow:hidden;max-width:130px;color:var(--color-muted);font-size:.55rem;white-space:nowrap;text-overflow:ellipsis}.advertiser b{overflow:hidden;max-width:120px;font-size:.66rem;white-space:nowrap;text-overflow:ellipsis}
    .actions{display:flex;min-width:0;gap:.4rem}.actions a{display:flex;min-width:0;align-items:center;justify-content:center;gap:.3rem;padding:.43rem .55rem;border:1px solid #e3b84f70;border-radius:.55rem;color:var(--color-primary);font-size:.68rem;font-weight:800;white-space:nowrap}.actions a:hover{background:var(--color-primary);color:#080808}.actions .whatsapp{border-color:#3b9a5a;color:#66cf87}.project-foot{display:flex;justify-content:space-between;padding-top:1rem;border-top:1px solid var(--color-border)}.project-foot strong{color:var(--color-primary)}
    @media(max-width:450px){.body{padding:.9rem}.facts{gap:.35rem}.facts span{padding-inline-end:.35rem}.footer{align-items:flex-end}.advertiser b{max-width:82px}.actions a{min-width:52px;padding:.42rem}.gallery-arrow{opacity:1;width:32px;height:44px}}
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListingCardComponent {
  private readonly i18n = inject(TranslationService);
  private readonly auth = inject(AuthService);
  private readonly favorites = inject(FavoritesService);
  private readonly notices = inject(NotificationService);
  item = input.required<Project | Advertisement | Favorite>();
  kind = input<'project' | 'property'>('project');
  readonly imageIndex = signal(0);
  readonly favoriteBusy = signal(false);
  private readonly now = signal(Date.now());
  private value() { return this.item(); }
  private advertisement() { return this.value() as Advertisement; }
  readonly title = computed(() => { const item = this.value(); return ('name' in item ? item.name : item.title) || this.text('فرصة عقارية', 'Property opportunity'); });
  readonly price = computed(() => { const item = this.value(); return ('startingPrice' in item ? item.startingPrice : item.price) || 0; });
  readonly subtitle = computed(() => { const item = this.value(); return 'developerName' in item ? item.developerName : 'Kemit'; });
  readonly location = computed(() => { const item = this.value(); return `${'cityName' in item ? item.cityName : ''}${'governorateName' in item ? `، ${item.governorateName}` : ''}` || this.text('مصر', 'Egypt'); });
  readonly images = computed(() => { const item = this.value(); const paths = 'images' in item && item.images?.length ? item.images : ['coverImage' in item ? item.coverImage : '']; return paths.map(path => this.imageUrl(path)).filter(Boolean); });
  readonly currentImage = computed(() => this.images()[this.imageIndex()] || 'assets/brand/kemit-logo.jpeg');
  readonly link = computed(() => { const item = this.value(); const id = 'id' in item ? item.id : item.advertisementId; return this.kind() === 'project' ? ['/projects', id] : ['/properties', id]; });
  readonly bedrooms = computed(() => this.advertisement().numberOfBedrooms ?? 0);
  readonly bathrooms = computed(() => this.advertisement().numberOfBathrooms ?? 0);
  readonly area = computed(() => this.advertisement().area ?? 0);
  readonly phone = computed(() => this.advertisement().phoneNumber || '');
  readonly advertiserName = computed(() => this.advertisement().advertiserName || this.publisherTypeLabel());
  readonly advertiserAvatar = computed(() => this.imageUrl(this.advertisement().advertiserAvatarUrl || '') || 'assets/brand/kemit-logo.jpeg');
  readonly isFavorite = computed(() => this.favorites.favoriteIds().has(this.advertisementId()));
  readonly whatsappUrl = computed(() => `https://wa.me/${this.phone().replace(/\D/g, '').replace(/^0/, '20')}`);
  readonly publishedAt = computed(() => {
    const raw = this.advertisement().createdAt;
    const utcValue = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(raw) ? raw : `${raw}Z`;
    const elapsedSeconds = Math.max(0, Math.floor((this.now() - new Date(utcValue).getTime()) / 1000));
    const locale = this.i18n.locale() === 'ar' ? 'ar-EG' : 'en';
    const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    let value: number;
    let unit: Intl.RelativeTimeFormatUnit;
    if (elapsedSeconds < 60) { value = -elapsedSeconds; unit = 'second'; }
    else if (elapsedSeconds < 3600) { value = -Math.floor(elapsedSeconds / 60); unit = 'minute'; }
    else if (elapsedSeconds < 86400) { value = -Math.floor(elapsedSeconds / 3600); unit = 'hour'; }
    else if (elapsedSeconds < 2592000) { value = -Math.floor(elapsedSeconds / 86400); unit = 'day'; }
    else { value = -Math.floor(elapsedSeconds / 2592000); unit = 'month'; }
    return `${this.text('نُشر', 'Listed')} ${formatter.format(value, unit)}`;
  });
  constructor() {
    effect(() => { if (this.auth.isAuthenticated()) this.favorites.ensureLoaded().subscribe({ error: () => {} }); });
    if (isPlatformBrowser(inject(PLATFORM_ID))) {
      const timer = window.setInterval(() => this.now.set(Date.now()), 30_000);
      inject(DestroyRef).onDestroy(() => window.clearInterval(timer));
    }
  }
  text(arabic: string, english: string) { return this.i18n.locale() === 'ar' ? arabic : english; }
  previousImage(event: Event) { event.preventDefault(); event.stopPropagation(); this.imageIndex.update(index => (index - 1 + this.images().length) % this.images().length); }
  nextImage(event: Event) { event.preventDefault(); event.stopPropagation(); this.imageIndex.update(index => (index + 1) % this.images().length); }
  toggleFavorite(event: Event) {
    event.preventDefault(); event.stopPropagation();
    if (!this.auth.isAuthenticated()) { this.notices.show(this.text('سجّل الدخول لإضافة الإعلان إلى المفضلة.', 'Sign in to add this listing to favorites.'), 'info'); return; }
    if (this.favoriteBusy()) return;
    this.favoriteBusy.set(true);
    const request = this.isFavorite() ? this.favorites.remove(this.advertisementId()) : this.favorites.add(this.advertisementId());
    request.subscribe({ next: () => this.favoriteBusy.set(false), error: () => this.favoriteBusy.set(false) });
  }
  propertyTypeLabel() { return this.enumLabel(this.advertisement().propertyType, [['شقة','Apartment'],['منزل','House'],['محل تجاري','Commercial store'],['مكتب','Office'],['شاليه','Chalet'],['مخزن','Warehouse'],['أرض','Land'],['فيلا','Villa'],['دوبلكس','Duplex']], ['Apartment','House','CommercialStore','Office','chalet','Warehouse','Land','Villa','Duplex']); }
  advertisementTypeLabel() { return this.enumLabel(this.advertisement().advertisementType, [['للبيع','For sale'],['للإيجار','For rent']], ['Sell','Rent']); }
  publisherTypeLabel() { return this.enumLabel(this.advertisement().publisherType, [['وسيط عقاري','Broker'],['مالك','Owner']], ['Brokar','Owner']); }
  private advertisementId() { const item = this.value(); return 'advertisementId' in item ? item.advertisementId : item.id; }
  private imageUrl(path: string) { return path ? (path.startsWith('http') ? path : `${environment.apiOrigin}/${path.replace(/^\//, '')}`) : ''; }
  private enumLabel(value: string | number | undefined, labels: [string,string][], names: string[]) { const index = typeof value === 'number' ? value : names.indexOf(String(value)); const pair = labels[index]; return pair ? pair[this.i18n.locale() === 'ar' ? 0 : 1] : String(value ?? ''); }
}
