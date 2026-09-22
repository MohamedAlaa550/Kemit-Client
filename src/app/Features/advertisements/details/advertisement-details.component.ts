import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { AdvertisementDetails } from '../../../Core/Models/api.models';
import { AdvertisementsService } from '../../../Core/Services/advertisements.service';
import { AuthService } from '../../../Core/Services/auth.service';
import { FavoritesService } from '../../../Core/Services/favorites.service';
import { NotificationService } from '../../../Core/Services/notification.service';
import { SeoService } from '../../../Core/Services/seo.service';
import { TranslationService } from '../../../Core/I18n/translation.service';

@Component({
  selector: 'app-advertisement-details',
  imports: [DecimalPipe, DatePipe, RouterLink],
  template: `
    <section class="property-page">
      <div class="container">
        @if (item(); as ad) {
          <nav class="breadcrumbs" aria-label="مسار الصفحة">
            <a routerLink="/properties">العقارات</a><span>‹</span><span>{{ ad.governorateName }}</span><span>‹</span><span>{{ ad.cityName }}</span>
          </nav>

          <div class="gallery">
            <div class="main-photo">
              <img [src]="mainImage()" [alt]="ad.title">
              <span class="photo-count">{{ selectedImage() + 1 }} / {{ images().length }}</span>
              @if (images().length > 1) {
                <button class="slide-arrow previous" type="button" (click)="previousImage()" [attr.aria-label]="text('الصورة السابقة', 'Previous image')">‹</button>
                <button class="slide-arrow next" type="button" (click)="nextImage()" [attr.aria-label]="text('الصورة التالية', 'Next image')">›</button>
                <div class="dots" aria-hidden="true">@for (photo of images(); track photo; let index = $index) { <button type="button" [class.active]="selectedImage() === index" (click)="selectedImage.set(index)"></button> }</div>
              }
            </div>
          </div>

          <div class="page-grid">
            <main>
              <div class="headline">
                <div><span class="type-badge">{{ advertisementLabel() }}</span><span class="muted">{{ propertyLabel() }}</span></div>
                @if (auth.isAuthenticated()) {
                  <button class="favorite" type="button" (click)="toggleFavorite()">{{ favorite() ? '♥' : '♡' }} <span>{{ favorite() ? 'محفوظ' : 'حفظ' }}</span></button>
                }
              </div>
              <h1>{{ ad.title }}</h1>
              <p class="address">⌖ {{ ad.cityName }}، {{ ad.governorateName }}</p>
              <strong class="price">{{ ad.price | number:'1.0-0' }} <small>{{ currencyLabel() }}</small></strong>

              <section class="details-block">
                <h2>تفاصيل العقار</h2>
                <div class="details-grid">
                  <div><i>◷</i><span>تاريخ الإعلان</span><b>{{ ad.createdAt | date:'d MMMM y':'':'ar-EG' }}</b></div>
                  <div><i>⌂</i><span>نوع العقار</span><b>{{ propertyLabel() }}</b></div>
                  <div><i>▱</i><span>غرف النوم</span><b>{{ ad.numberOfBedrooms || 0 }} غرف</b></div>
                  <div><i>♨</i><span>الحمامات</span><b>{{ ad.numberOfBathrooms }} حمام</b></div>
                  <div><i>▰</i><span>المساحة</span><b>{{ ad.area }} م²</b></div>
                  <div><i>◫</i><span>سعر المتر</span><b>{{ pricePerMeter() | number:'1.0-0' }} {{ currencyLabel() }}</b></div>
                  @if (ad.floorNumber !== null && ad.floorNumber !== undefined) { <div><i>≡</i><span>رقم الطابق</span><b>{{ ad.floorNumber }}</b></div> }
                  @if (ad.numberOfFloors) { <div><i>▤</i><span>عدد الطوابق</span><b>{{ ad.numberOfFloors }}</b></div> }
                </div>
              </section>

              <section class="description">
                <p class="eyebrow">{{ propertyLabel() }} {{ advertisementLabel() }} في {{ ad.cityName }}</p>
                <h2>وصف العقار</h2>
                <p>{{ ad.description }}</p>
              </section>
            </main>

            <aside>
              <div class="contact-card">
                <div class="advertiser">
                  <img [src]="advertiserAvatar()" width="58" height="58" [alt]="advertiserName()">
                  <div><small>{{ text('المعلن', 'Advertiser') }}</small><strong>{{ advertiserName() }}</strong><span>{{ publisherLabel() }}</span></div>
                </div>
                <div class="advertiser-details">
                  <div><span>{{ text('صفة المعلن', 'Advertiser type') }}</span><b>{{ publisherLabel() }}</b></div>
                  <div><span>{{ text('رقم التواصل', 'Contact number') }}</span><a [href]="'tel:' + ad.phoneNumber" dir="ltr">{{ ad.phoneNumber }}</a></div>
                  <div><span>{{ text('الموقع', 'Location') }}</span><b>{{ ad.cityName }}، {{ ad.governorateName }}</b></div>
                </div>
                <div class="payment"><i>▣</i><span>{{ text('السعر المطلوب', 'Asking price') }}</span><b>{{ ad.price | number:'1.0-0' }} {{ currencyLabel() }}</b></div>
                <a class="contact-button call" [href]="'tel:' + ad.phoneNumber">☎ اتصل الآن</a>
                <a class="contact-button whatsapp" [href]="whatsappUrl()" target="_blank" rel="noopener">◉ واتساب</a>
                <small class="reference">رقم الإعلان: {{ ad.id }} · {{ ad.viewCount }} مشاهدة</small>
              </div>
            </aside>
          </div>
        }
      </div>
    </section>
  `,
  styles: [`
    .property-page{min-height:100vh;padding:1.5rem 0 5rem;background:#f6f4ee;color:#19160f}.breadcrumbs{display:flex;align-items:center;gap:.5rem;margin-bottom:1rem;color:#777166;font-size:.76rem}.breadcrumbs a{color:#815c18;font-weight:800}
    .gallery{height:min(55vw,540px);overflow:hidden;border-radius:22px;background:#171717}.main-photo{position:relative;width:100%;height:100%;overflow:hidden}.main-photo>img{width:100%;height:100%;object-fit:cover}.photo-count{position:absolute;z-index:2;inset-inline-end:1rem;bottom:1rem;padding:.45rem .75rem;border:1px solid #ffffff45;border-radius:99px;background:#080808cf;color:#fff;font-size:.78rem;font-weight:800}.slide-arrow{position:absolute;z-index:3;top:50%;display:grid;width:46px;height:64px;place-items:center;border:1px solid #ffffff55;border-radius:12px;background:#090909a8;color:#fff;font-size:2.5rem;line-height:1;cursor:pointer;transform:translateY(-50%);backdrop-filter:blur(7px)}.slide-arrow:hover{background:#17140e;color:#f6d77e}.previous{inset-inline-start:1rem}.next{inset-inline-end:1rem}.dots{position:absolute;z-index:3;bottom:1.15rem;left:50%;display:flex;gap:.4rem;transform:translateX(-50%)}.dots button{width:8px;height:8px;padding:0;border:0;border-radius:50%;background:#ffffff80;cursor:pointer}.dots button.active{width:22px;border-radius:99px;background:#e3b84f}
    .page-grid{display:grid;grid-template-columns:minmax(0,1fr) 350px;gap:3.5rem;margin-top:2rem}.headline{display:flex;align-items:center;justify-content:space-between}.headline>div{display:flex;align-items:center;gap:.7rem}.type-badge{padding:.3rem .7rem;border-radius:6px;background:#17140e;color:#f6d77e;font-size:.75rem;font-weight:800}.headline .muted{color:#777166}.favorite{display:flex;align-items:center;gap:.35rem;border:1px solid #d5d0c5;border-radius:8px;background:#fff;color:#19160f;padding:.5rem .8rem;cursor:pointer;font:inherit}.favorite:first-letter{color:#b27d18}
    h1{max-width:28ch;margin:.65rem 0 .25rem;font-size:clamp(1.7rem,4vw,2.7rem);line-height:1.3}.address{margin:.25rem 0;color:#6e695f}.price{display:block;margin:1.1rem 0 1.8rem;color:#19160f;font-size:clamp(1.8rem,4vw,2.45rem);font-weight:900}.price small{font-size:.42em}
    .details-block,.description{padding:1.8rem 0;border-top:1px solid #d9d5cc}h2{margin:0 0 1.25rem;font-size:1.25rem}.details-grid{display:grid;grid-template-columns:1fr 1fr;gap:1.15rem 2.5rem}.details-grid div{display:grid;grid-template-columns:28px 1fr auto;align-items:center;gap:.6rem}.details-grid i{color:#a7781f;font-size:1.1rem;font-style:normal}.details-grid span{color:#777166;font-size:.82rem}.details-grid b{color:#19160f;font-size:.86rem}.description .eyebrow{color:#9a6e19}.description>p:last-child{color:#514d45;line-height:2;white-space:pre-line}
    aside{position:relative}.contact-card{position:sticky;top:92px;padding:1.25rem;border:1px solid #d9d4c9;border-radius:14px;background:#fff;box-shadow:0 12px 38px #2d271b18}.advertiser{display:flex;align-items:center;gap:.8rem;padding-bottom:1rem;border-bottom:1px solid #e2ded5}.advertiser>img{width:58px;height:58px;flex:0 0 auto;border:2px solid #e3b84f;border-radius:50%;object-fit:cover;background:#17140e}.advertiser div{display:grid}.advertiser small,.advertiser span,.payment span{color:#777166}.advertiser strong{font-size:1rem}.advertiser span{font-size:.75rem}.advertiser-details{display:grid;gap:.65rem;padding:1rem 0;border-bottom:1px solid #e2ded5}.advertiser-details div{display:flex;align-items:start;justify-content:space-between;gap:1rem;font-size:.78rem}.advertiser-details span{color:#777166}.advertiser-details b,.advertiser-details a{max-width:60%;color:#19160f;text-align:end;font-weight:800}.advertiser-details a{color:#815c18}.payment{display:grid;place-items:center;gap:.25rem;margin:1rem 0;padding:1rem;border-radius:10px;background:#f5f2eb}.payment i{color:#9c701a;font-style:normal}.payment b{color:#19160f}.contact-button{display:block;margin-top:.6rem;padding:.78rem;border-radius:7px;text-align:center;font-weight:900}.call{background:#17140e;color:#f6d77e}.whatsapp{background:#e3b84f;color:#17140e}.contact-button:hover{filter:brightness(.94)}.reference{display:block;margin-top:1rem;text-align:center;color:#817b70}
    @media(max-width:850px){.page-grid{grid-template-columns:1fr}.contact-card{position:static}.gallery{height:min(65vw,430px)}aside{grid-row:2}}
    @media(max-width:600px){.property-page{padding-top:1rem}.gallery{height:280px;border-radius:14px}.slide-arrow{width:38px;height:52px}.previous{inset-inline-start:.5rem}.next{inset-inline-end:.5rem}.dots{bottom:.75rem}.page-grid{margin-top:1.4rem;gap:1.5rem}.details-grid{grid-template-columns:1fr;gap:1rem}h1{font-size:2rem}.favorite span{display:none}}
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdvertisementDetailsComponent {
  private readonly id = Number(inject(ActivatedRoute).snapshot.paramMap.get('id'));
  private readonly favorites = inject(FavoritesService);
  private readonly notices = inject(NotificationService);
  private readonly i18n = inject(TranslationService);
  readonly auth = inject(AuthService);
  readonly item = signal<AdvertisementDetails | null>(null);
  readonly favorite = signal(false);
  readonly selectedImage = signal(0);
  readonly images = computed(() => {
    const paths = this.item()?.images?.length ? this.item()!.images : [this.item()?.coverImage || ''];
    return paths.map(path => path ? (path.startsWith('http') ? path : `${environment.apiOrigin}/${path.replace(/^\//, '')}`) : 'assets/brand/kemit-logo.jpeg');
  });
  readonly mainImage = computed(() => this.images()[this.selectedImage()] || this.images()[0]);
  readonly pricePerMeter = computed(() => { const ad = this.item(); return ad?.area ? ad.price / ad.area : 0; });
  readonly propertyLabel = computed(() => this.labelFor(this.item()?.propertyType, { Apartment:'شقة', House:'منزل', CommercialStore:'محل تجاري', Office:'مكتب', chalet:'شاليه', Warehouse:'مخزن', Land:'أرض', Villa:'فيلا', Duplex:'دوبلكس', '0':'شقة', '1':'منزل', '2':'محل تجاري', '3':'مكتب', '4':'شاليه', '5':'مخزن', '6':'أرض', '7':'فيلا', '8':'دوبلكس' }));
  readonly advertisementLabel = computed(() => this.labelFor(this.item()?.advertisementType, { Sell:'للبيع', Rent:'للإيجار', '0':'للبيع', '1':'للإيجار' }));
  readonly publisherLabel = computed(() => {
    const value = String(this.item()?.publisherType ?? '');
    return value === 'Owner' || value === '1' ? this.text('مالك', 'Owner') : this.text('وسيط عقاري', 'Broker');
  });
  readonly whatsappUrl = computed(() => `https://wa.me/${(this.item()?.phoneNumber || '').replace(/\D/g, '').replace(/^0/, '20')}`);
  readonly advertiserName = computed(() => this.item()?.advertiserName || this.publisherLabel());
  readonly advertiserAvatar = computed(() => {
    const path = this.item()?.advertiserAvatarUrl;
    return path ? (path.startsWith('http') ? path : `${environment.apiOrigin}/${path.replace(/^\//, '')}`) : 'assets/brand/kemit-logo.jpeg';
  });

  constructor() {
    const seo = inject(SeoService);
    inject(AdvertisementsService).getById(this.id).subscribe(ad => { this.item.set(ad); seo.update(ad.title, ad.description, `/properties/${ad.id}`); });
    if (this.auth.isAuthenticated()) this.favorites.check(this.id).subscribe({ next: result => this.favorite.set(result.isFavorite), error: () => {} });
  }

  text(arabic: string, english: string) { return this.i18n.locale() === 'ar' ? arabic : english; }
  currencyLabel() { return this.text('جنيه', 'EGP'); }
  previousImage() { if (this.images().length > 1) this.selectedImage.update(index => (index - 1 + this.images().length) % this.images().length); }
  nextImage() { if (this.images().length > 1) this.selectedImage.update(index => (index + 1) % this.images().length); }
  toggleFavorite() {
    const request = this.favorite() ? this.favorites.remove(this.id) : this.favorites.add(this.id);
    request.subscribe(() => { this.favorite.update(value => !value); this.notices.show(this.favorite() ? 'تمت الإضافة للمفضلة' : 'تمت الإزالة', 'success'); });
  }
  private labelFor(value: string | number | undefined, labels: Record<string, string>) { return labels[String(value ?? '')] ?? String(value ?? ''); }
}
