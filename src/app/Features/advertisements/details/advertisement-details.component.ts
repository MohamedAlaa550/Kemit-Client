import { DatePipe, DecimalPipe, DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AdvertisementDetails } from '../../../Core/Models/api.models';
import { AdvertisementsService } from '../../../Core/Services/advertisements.service';
import { AdvertiserRatingsService } from '../../../Core/Services/advertiser-ratings.service';
import { AdvertisementReportsService } from '../../../Core/Services/advertisement-reports.service';
import { AuthService } from '../../../Core/Services/auth.service';
import { FavoritesService } from '../../../Core/Services/favorites.service';
import { NotificationService } from '../../../Core/Services/notification.service';
import { SeoService } from '../../../Core/Services/seo.service';
import { TranslationService } from '../../../Core/I18n/translation.service';
import { LocationNamePipe } from '../../../Shared/Pipes/location-name.pipe';

@Component({
  selector: 'app-advertisement-details',
  imports: [DecimalPipe, DatePipe, RouterLink, LocationNamePipe],
  template: `
    <section class="property-page">
      <div class="container">
        @if (item(); as ad) {
          <nav class="breadcrumbs" [attr.aria-label]="text('مسار الصفحة', 'Breadcrumb')">
            <a routerLink="/properties">{{ text('العقارات', 'Properties') }}</a><span>‹</span><span>{{ ad.governorateName | locationName }}</span><span>‹</span><span>{{ ad.cityName | locationName }}</span>
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
                <div><span class="type-badge">{{ advertisementLabel() }}</span><span class="muted">{{ propertyLabel() }}</span>@if (promotionRank() > 0) { <span class="featured-label" [class.vip]="promotionRank() === 3">{{ promotionRank() === 3 ? 'VIP' : text('إعلان مميز','Featured listing') }}</span> }</div>
                <button class="favorite" type="button" [class.selected]="favorite()" (click)="toggleFavorite()" [attr.aria-label]="favorite() ? text('إزالة من المفضلة','Remove from favorites') : text('إضافة للمفضلة','Add to favorites')"><svg viewBox="0 0 24 24"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"/></svg><span>{{ favorite() ? text('محفوظ','Saved') : text('حفظ','Save') }}</span></button>
              </div>
              <h1>{{ ad.title }}</h1>
              <div class="location-row">
                <p class="address">⌖ {{ ad.cityName | locationName }}، {{ ad.governorateName | locationName }}</p>
                @if (mapUrl(); as url) {
                  <a
                    class="map-button"
                    [href]="url"
                    target="_blank"
                    rel="noopener noreferrer"
                    [attr.aria-label]="text('عرض موقع الوحدة على الخريطة', 'View unit location on map')"
                    [attr.title]="text('عرض الموقع على الخريطة', 'View location on map')"
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M12 21s7-5.1 7-12a7 7 0 1 0-14 0c0 6.9 7 12 7 12Z"/>
                      <circle cx="12" cy="9" r="2.5"/>
                    </svg>
                    <span>{{ text('عرض على الخريطة', 'View on map') }}</span>
                  </a>
                }
                <div class="share-wrap">
                  <button
                    class="map-button share-button"
                    type="button"
                    (click)="shareOpen.update(value => !value)"
                    [attr.aria-expanded]="shareOpen()"
                    aria-controls="advertisement-share-menu"
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/>
                      <path d="m8.2 10.8 7.6-4.5M8.2 13.2l7.6 4.5"/>
                    </svg>
                    <span>{{ text('مشاركة الإعلان', 'Share listing') }}</span>
                  </button>
                  @if (shareOpen()) {
                    <div class="share-menu" id="advertisement-share-menu">
                      <a [href]="whatsappShareUrl()" target="_blank" rel="noopener noreferrer" (click)="shareOpen.set(false)">
                        <span class="share-icon whatsapp-icon">◉</span>{{ text('واتساب', 'WhatsApp') }}
                      </a>
                      <a [href]="facebookShareUrl()" target="_blank" rel="noopener noreferrer" (click)="shareOpen.set(false)">
                        <span class="share-icon facebook-icon">f</span>{{ text('فيسبوك', 'Facebook') }}
                      </a>
                      <button type="button" (click)="copyAdvertisementLink()">
                        <span class="share-icon copy-icon">⧉</span>{{ text('نسخ الرابط', 'Copy link') }}
                      </button>
                    </div>
                  }
                </div>
                @if (auth.currentUser()?.id !== ad.advertiserId) {
                <button class="map-button report-trigger" type="button" [disabled]="hasReported()" (click)="openReport()">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 21V4m0 1h11l-2 4 2 4H5"/></svg>
                    <span>{{ hasReported() ? text('تم الإبلاغ', 'Reported') : text('الإبلاغ عن الإعلان', 'Report listing') }}</span>
                </button>
                }
              </div>
              <strong class="price">{{ ad.price | number:'1.0-0' }} <small>{{ currencyLabel() }}@if (rentalPeriodLabel()) { / {{ rentalPeriodLabel() }} }</small></strong>
              @if (isInstallment()) {
                <section class="installment-card" [attr.aria-label]="text('تفاصيل التقسيط', 'Installment details')">
                  <div><small>{{ text('طريقة الدفع', 'Payment method') }}</small><strong>{{ text('تقسيط', 'Installment') }}</strong></div>
                  <div><small>{{ text('المقدم', 'Down payment') }}</small><strong>{{ ad.downPayment | number:'1.0-0' }} {{ currencyLabel() }}</strong></div>
                  <div><small>{{ text('القسط الشهري', 'Monthly installment') }}</small><strong>{{ ad.monthlyInstallment | number:'1.0-0' }} {{ currencyLabel() }}</strong></div>
                  <div><small>{{ text('مدة التقسيط', 'Installment term') }}</small><strong>{{ ad.installmentYears }} {{ text('سنوات', 'years') }}</strong></div>
                </section>
              }

              <section class="details-block">
                <h2>{{ text('تفاصيل العقار', 'Property details') }}</h2>
                <div class="details-grid">
                  <div><i>◷</i><span>{{ text('تاريخ الإعلان', 'Listing date') }}</span><b>{{ ad.createdAt | date:'d MMMM y':'':dateLocale() }}</b></div>
                  <div><i>⌂</i><span>{{ text('نوع النشاط', 'Activity type') }}</span><b>{{ activityLabel() }}</b></div>
                  <div><i>⌂</i><span>{{ text('نوع العقار', 'Property type') }}</span><b>{{ propertyLabel() }}</b></div>
                  @if (paymentMethodLabel()) { <div><i>▣</i><span>{{ text('طريقة الدفع', 'Payment method') }}</span><b>{{ paymentMethodLabel() }}</b></div> }
                  @if (rentalPeriodLabel()) { <div><i>◷</i><span>{{ text('مدة الإيجار', 'Rental period') }}</span><b>{{ rentalPeriodLabel() }}</b></div> }
                  @if (furnishingLabel()) { <div><i>▣</i><span>{{ text('حالة الفرش', 'Furnishing') }}</span><b>{{ furnishingLabel() }}</b></div> }
                  <div><i>▱</i><span>{{ text('عدد الغرف', 'Number of rooms') }}</span><b>{{ ad.numberOfBedrooms || 0 }} {{ text('غرف', 'rooms') }}</b></div>
                  <div><i>♨</i><span>{{ text('الحمامات', 'Bathrooms') }}</span><b>{{ ad.numberOfBathrooms }} {{ text('حمام', 'bathrooms') }}</b></div>
                  <div><i>▰</i><span>{{ text('المساحة', 'Area') }}</span><b>{{ ad.area }} {{ text('م²', 'm²') }}</b></div>
                  <div><i>◫</i><span>{{ text('سعر المتر', 'Price per meter') }}</span><b>{{ pricePerMeter() | number:'1.0-0' }} {{ currencyLabel() }}</b></div>
                  @if (ad.floorNumber !== null && ad.floorNumber !== undefined) { <div><i>≡</i><span>{{ text('رقم الطابق', 'Floor number') }}</span><b>{{ ad.floorNumber }}</b></div> }
                  @if (ad.numberOfFloors) { <div><i>▤</i><span>{{ text('عدد الطوابق', 'Number of floors') }}</span><b>{{ ad.numberOfFloors }}</b></div> }
                </div>
              </section>

              <section class="description">
                <p class="eyebrow">{{ propertyLabel() }} {{ advertisementLabel() }} {{ text('في', 'in') }} {{ ad.cityName | locationName }}</p>
                <h2>{{ text('وصف العقار', 'Property description') }}</h2>
                <p>{{ ad.description }}</p>
              </section>
            </main>

            <aside>
              <div class="sidebar-stack">
              <div class="contact-card">
                <a class="advertiser" [routerLink]="['/advertisers', ad.advertiserId]" [attr.aria-label]="text('عرض صفحة المعلن', 'View advertiser profile')">
                  <img [src]="advertiserAvatar()" width="58" height="58" [alt]="advertiserName()">
                  <div><small>{{ text('المعلن', 'Advertiser') }}</small><strong>{{ advertiserName() }}</strong>@if(ad.advertiserBadge){<em class="member-label">{{ad.advertiserBadge==='VIP'?'VIP':text('عميل مميز','Premium member')}}</em>}<span>{{ publisherLabel() }}</span></div>
                </a>
                <div class="advertiser-details">
                  <div><span>{{ text('صفة المعلن', 'Advertiser type') }}</span><b>{{ publisherLabel() }}</b></div>
                  <div><span>{{ text('رقم التواصل', 'Contact number') }}</span><a [href]="'tel:' + ad.phoneNumber" dir="ltr">{{ ad.phoneNumber }}</a></div>
                  <div><span>{{ text('الموقع', 'Location') }}</span><b>{{ ad.cityName | locationName }}، {{ ad.governorateName | locationName }}</b></div>
                </div>
                <section class="rating-card" aria-labelledby="advertiser-rating-title">
                  <div class="rating-heading">
                    <div><span id="advertiser-rating-title">{{ text('تقييم المعلن', 'Advertiser rating') }}</span><strong>{{ rating()?.average || 0 | number:'1.1-1' }} <small>/ 5</small></strong></div>
                    <small>{{ rating()?.count || 0 }} {{ text('تقييم', 'ratings') }}</small>
                  </div>
                  <div class="stars" role="group" [attr.aria-label]="text('اختر تقييم المعلن', 'Choose an advertiser rating')" (mouseleave)="hoveredRating.set(0)">
                    @for (score of stars; track score) {
                      <button type="button" [class.active]="score <= displayedRating()" [disabled]="ratingSubmitting() || (auth.isAuthenticated() && rating()?.canRate === false)" [attr.aria-label]="score + ' ' + text('نجوم', 'stars')" (mouseenter)="hoveredRating.set(score)" (focus)="hoveredRating.set(score)" (blur)="hoveredRating.set(0)" (click)="submitRating(score)">★</button>
                    }
                  </div>
                  @if (!auth.isAuthenticated()) {
                    <button class="rating-login" type="button" (click)="goToLogin()">{{ text('سجّل الدخول لإضافة تقييمك', 'Sign in to add your rating') }}</button>
                  } @else if (rating()?.canRate === false) {
                    <small class="rating-note">{{ text('لا يمكنك تقييم نفسك', 'You cannot rate yourself') }}</small>
                  } @else if (rating()?.myRating) {
                    <div class="my-rating"><small>{{ text('تقييمك الحالي', 'Your rating') }}: {{ rating()?.myRating }}/5</small><button type="button" [disabled]="ratingSubmitting()" (click)="removeRating()">{{ text('حذف', 'Remove') }}</button></div>
                  }
                </section>
                <div class="payment"><i>▣</i><span>{{ text('السعر المطلوب', 'Asking price') }}</span><b>{{ ad.price | number:'1.0-0' }} {{ currencyLabel() }}</b></div>
                <a class="contact-button call" [href]="'tel:' + ad.phoneNumber">☎ {{ text('اتصل الآن', 'Call now') }}</a>
                <a class="contact-button whatsapp" [href]="whatsappUrl()" target="_blank" rel="noopener">◉ {{ text('واتساب', 'WhatsApp') }}</a>
                <button class="contact-button mediator-trigger" type="button" (click)="mediatorOpen.set(true)">◆ {{ text('إضافة كيميت كوسيط', 'Add Kemet as a mediator') }}</button>
                <small class="reference">{{ text('رقم الإعلان', 'Listing ID') }}: {{ ad.id }} · {{ ad.viewCount }} {{ text('مشاهدة', 'views') }}</small>
              </div>
              <section class="safety-card" aria-labelledby="safety-card-title">
                <div class="safety-title"><span aria-hidden="true">✓</span><h2 id="safety-card-title">{{ text('سلامتك تهمنا!', 'Your safety matters!') }}</h2></div>
                <ul>
                  <li><i aria-hidden="true">1</i><span>{{ text('لا تقم أبدًا بتحويل الأموال مقدمًا', 'Never transfer money in advance') }}</span></li>
                  <li><i aria-hidden="true">2</i><span>{{ text('قابل البائع في مكان عام', 'Meet the seller in a public place') }}</span></li>
                  <li><i aria-hidden="true">3</i><span>{{ text('لا تتابع إذا بدا أن هناك خطأ ما', 'Do not proceed if something seems wrong') }}</span></li>
                </ul>
              </section>
              </div>
            </aside>
          </div>
        } @else if (loadFailed()) {
          <div class="details-error">
            <strong>{{ text('تعذر تحميل الإعلان', 'Could not load the listing') }}</strong>
            <p>{{ text('تأكد من تشغيل الخدمة ثم أعد تحميل الصفحة.', 'Make sure the service is running, then reload the page.') }}</p>
            <button type="button" class="btn btn-gold" (click)="loadAdvertisement()">{{ text('إعادة المحاولة', 'Try again') }}</button>
          </div>
        }
      </div>
    </section>
    @if (mediatorOpen()) {
      <div class="report-overlay" role="presentation" (click)="mediatorOpen.set(false)">
        <section class="report-dialog mediator-dialog" role="dialog" aria-modal="true" aria-labelledby="mediator-dialog-title" (click)="$event.stopPropagation()">
          <div class="report-dialog-head">
            <div><small>KEMET SAFE DEAL</small><h2 id="mediator-dialog-title">{{ text('أضف كيميت كوسيط', 'Add Kemet as a mediator') }}</h2></div>
            <button type="button" (click)="mediatorOpen.set(false)" [attr.aria-label]="text('إغلاق', 'Close')">×</button>
          </div>
          <div class="mediator-icon" aria-hidden="true">◆</div>
          <p>{{ text('لإتمام الصفقة بأمان ووضوح، يمكن لكيميت مساعدتك كوسيط في تنظيم التواصل مع المعلن ومتابعة خطوات الاتفاق قبل إتمام الصفقة.', 'For a safer and clearer deal, Kemet can help mediate communication with the advertiser and follow the agreement steps before completion.') }}</p>
          <div class="mediator-note">✓ {{ text('سيتم إرسال رابط هذا الإعلان تلقائيًا إلى فريق كيميت.', 'This listing link will be sent automatically to the Kemet team.') }}</div>
          <a class="mediator-whatsapp" [href]="kemitMediatorWhatsappUrl()" target="_blank" rel="noopener noreferrer" (click)="mediatorOpen.set(false)">◉ {{ text('تواصل مع كيميت', 'Contact Kemet') }}</a>
        </section>
      </div>
    }
    @if (reportOpen()) {
      <div class="report-overlay" role="presentation" (click)="closeReport()">
        <section class="report-dialog" role="dialog" aria-modal="true" aria-labelledby="report-dialog-title" (click)="$event.stopPropagation()">
          <div class="report-dialog-head"><div><small>{{ text('ساعدنا في حماية المجتمع', 'Help keep the community safe') }}</small><h2 id="report-dialog-title">{{ text('الإبلاغ عن الإعلان', 'Report listing') }}</h2></div><button type="button" (click)="closeReport()" [attr.aria-label]="text('إغلاق', 'Close')">×</button></div>
          <p>{{ text('اختر السبب الأقرب، وسيقوم فريق الإدارة بمراجعة البلاغ. لن يتم إخفاء الإعلان تلقائيًا.', 'Choose the closest reason. The administration will review it; the listing is never hidden automatically.') }}</p>
          <div class="report-reasons">
            @for (reason of reportReasons; track reason.value) {
              <label [class.selected]="reportReason() === reason.value"><input type="radio" name="reportReason" [value]="reason.value" [checked]="reportReason() === reason.value" (change)="reportReason.set(reason.value)"><span>{{ text(reason.ar, reason.en) }}</span></label>
            }
          </div>
          @if (reportReason() === 'Other') {
            <label class="report-details"><span>{{ text('وضّح سبب البلاغ', 'Tell us why') }}</span><textarea maxlength="500" rows="3" [value]="reportDetails()" (input)="reportDetails.set($any($event.target).value)"></textarea><small>{{ reportDetails().length }}/500</small></label>
          }
          <div class="report-actions"><button type="button" class="cancel" (click)="closeReport()">{{ text('إلغاء', 'Cancel') }}</button><button type="button" class="submit" [disabled]="!canSubmitReport() || reportSubmitting()" (click)="submitReport()">{{ text('إرسال البلاغ', 'Submit report') }}</button></div>
        </section>
      </div>
    }
  `,
  styles: [`
    .property-page{min-height:100vh;padding:1.5rem 0 5rem;background:#f6f4ee;color:#19160f}.breadcrumbs{display:flex;align-items:center;gap:.5rem;margin-bottom:1rem;color:#777166;font-size:.76rem}.breadcrumbs a{color:#815c18;font-weight:800}
    .gallery{height:min(55vw,540px);overflow:hidden;border-radius:22px;background:#171717}.main-photo{position:relative;width:100%;height:100%;overflow:hidden}.main-photo>img{width:100%;height:100%;object-fit:cover}.photo-count{position:absolute;z-index:2;inset-inline-end:1rem;bottom:1rem;padding:.45rem .75rem;border:1px solid #ffffff45;border-radius:99px;background:#080808cf;color:#fff;font-size:.78rem;font-weight:800}.slide-arrow{position:absolute;z-index:3;top:50%;display:grid;width:46px;height:64px;place-items:center;border:1px solid #ffffff55;border-radius:12px;background:#090909a8;color:#fff;font-size:2.5rem;line-height:1;cursor:pointer;transform:translateY(-50%);backdrop-filter:blur(7px)}.slide-arrow:hover{background:#17140e;color:#f6d77e}.previous{inset-inline-start:1rem}.next{inset-inline-end:1rem}.dots{position:absolute;z-index:3;bottom:1.15rem;left:50%;display:flex;gap:.4rem;transform:translateX(-50%)}.dots button{width:8px;height:8px;padding:0;border:0;border-radius:50%;background:#ffffff80;cursor:pointer}.dots button.active{width:22px;border-radius:99px;background:#e3b84f}
    .page-grid{display:grid;grid-template-columns:minmax(0,1fr) 350px;gap:3.5rem;margin-top:2rem}.headline{display:flex;align-items:center;justify-content:space-between}.headline>div{display:flex;align-items:center;gap:.7rem}.type-badge{padding:.3rem .7rem;border-radius:6px;background:#17140e;color:#f6d77e;font-size:.75rem;font-weight:800}.headline .muted{color:#777166}.favorite{display:flex;align-items:center;gap:.4rem;border:1px solid #d5d0c5;border-radius:8px;background:#fff;color:#19160f;padding:.5rem .8rem;cursor:pointer;font:inherit}.favorite svg{width:20px;height:20px;fill:transparent;stroke:#a7781f;stroke-width:1.8}.favorite.selected{border-color:#c99b35;color:#815c18}.favorite.selected svg{fill:#c99b35}
    h1{max-width:28ch;margin:.65rem 0 .25rem;font-size:clamp(1.7rem,4vw,2.7rem);line-height:1.3}.location-row{display:flex;align-items:center;flex-wrap:wrap;gap:.65rem}.address{margin:.25rem 0;color:#6e695f}.map-button{display:inline-flex;align-items:center;gap:.4rem;padding:.42rem .7rem;border:1px solid #d1b66d;border-radius:8px;background:#fffaf0;color:#815c18;font:inherit;font-size:.78rem;font-weight:900;cursor:pointer;transition:background .2s,color .2s,transform .2s}.map-button svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}.map-button:hover{background:#17140e;color:#f6d77e;transform:translateY(-1px)}.share-wrap{position:relative}.share-menu{position:absolute;z-index:10;top:calc(100% + .45rem);inset-inline-end:0;display:grid;width:180px;padding:.4rem;border:1px solid #d9d4c9;border-radius:10px;background:#fff;box-shadow:0 12px 30px #2d271b26}.share-menu a,.share-menu button{display:flex;align-items:center;gap:.6rem;width:100%;padding:.65rem;border:0;border-radius:7px;background:transparent;color:#29251e;font:inherit;font-size:.82rem;font-weight:800;text-align:start;cursor:pointer}.share-menu a:hover,.share-menu button:hover{background:#f5f2eb}.share-icon{display:grid;width:24px;height:24px;place-items:center;border-radius:50%;color:#fff;font-size:.8rem;font-weight:900}.whatsapp-icon{background:#25d366}.facebook-icon{background:#1877f2;font-family:Arial;font-size:1rem}.copy-icon{background:#8a6b2b}.price{display:block;margin:1.1rem 0 1.8rem;color:#19160f;font-size:clamp(1.8rem,4vw,2.45rem);font-weight:900}.price small{font-size:.42em}
    .details-block,.description{padding:1.8rem 0;border-top:1px solid #d9d5cc}h2{margin:0 0 1.25rem;font-size:1.25rem}.details-grid{display:grid;grid-template-columns:1fr 1fr;gap:1.15rem 2.5rem}.details-grid div{display:grid;grid-template-columns:28px 1fr auto;align-items:center;gap:.6rem}.details-grid i{color:#a7781f;font-size:1.1rem;font-style:normal}.details-grid span{color:#777166;font-size:.82rem}.details-grid b{color:#19160f;font-size:.86rem}.description .eyebrow{color:#9a6e19}.description>p:last-child{color:#514d45;line-height:2;white-space:pre-line}
    aside{position:relative}.contact-card{position:sticky;top:92px;padding:1.25rem;border:1px solid #d9d4c9;border-radius:14px;background:#fff;box-shadow:0 12px 38px #2d271b18}.advertiser{display:flex;align-items:center;gap:.8rem;padding-bottom:1rem;border-bottom:1px solid #e2ded5}.advertiser>img{width:58px;height:58px;flex:0 0 auto;border:2px solid #e3b84f;border-radius:50%;object-fit:cover;background:#17140e}.advertiser div{display:grid}.advertiser small,.advertiser span,.payment span{color:#777166}.advertiser strong{font-size:1rem}.advertiser span{font-size:.75rem}.advertiser-details{display:grid;gap:.65rem;padding:1rem 0;border-bottom:1px solid #e2ded5}.advertiser-details div{display:flex;align-items:start;justify-content:space-between;gap:1rem;font-size:.78rem}.advertiser-details span{color:#777166}.advertiser-details b,.advertiser-details a{max-width:60%;color:#19160f;text-align:end;font-weight:800}.advertiser-details a{color:#815c18}.payment{display:grid;place-items:center;gap:.25rem;margin:1rem 0;padding:1rem;border-radius:10px;background:#f5f2eb}.payment i{color:#9c701a;font-style:normal}.payment b{color:#19160f}.contact-button{display:block;width:100%;margin-top:.6rem;padding:.78rem;border:0;border-radius:7px;font:inherit;text-align:center;font-weight:900;cursor:pointer}.call{background:#17140e;color:#f6d77e}.whatsapp{background:#e3b84f;color:#17140e}.mediator-trigger{border:1px solid #17140e;background:#fff;color:#17140e}.contact-button:hover{filter:brightness(.94)}.reference{display:block;margin-top:1rem;text-align:center;color:#817b70}
    .rating-card{padding:1rem 0;border-bottom:1px solid #e2ded5}.rating-heading{display:flex;align-items:end;justify-content:space-between}.rating-heading>div{display:grid;gap:.2rem}.rating-heading span,.rating-heading>small,.rating-note,.my-rating small{color:#777166;font-size:.75rem}.rating-heading strong{font-size:1.25rem}.rating-heading strong small{font-size:.65rem}.stars{display:flex;justify-content:center;gap:.2rem;margin:.65rem 0}.stars button{padding:0;border:0;background:transparent;color:#d8d2c5;font-size:2rem;line-height:1;cursor:pointer;transition:color .15s,transform .15s}.stars button.active{color:#d7a52c}.stars button:hover{transform:scale(1.1)}.stars button:disabled{cursor:not-allowed;opacity:.7}.rating-login{display:block;width:100%;padding:.45rem;border:0;background:transparent;color:#815c18;font:inherit;font-size:.78rem;font-weight:900;cursor:pointer}.rating-note{display:block;text-align:center}.my-rating{display:flex;align-items:center;justify-content:space-between}.my-rating button{border:0;background:transparent;color:#9d3329;font:inherit;font-size:.72rem;font-weight:800;cursor:pointer}
    @media(max-width:850px){.page-grid{grid-template-columns:1fr}.contact-card{position:static}.gallery{height:min(65vw,430px)}aside{grid-row:2}}
    @media(max-width:600px){.property-page{padding-top:1rem}.gallery{height:280px;border-radius:14px}.slide-arrow{width:38px;height:52px}.previous{inset-inline-start:.5rem}.next{inset-inline-end:.5rem}.dots{bottom:.75rem}.page-grid{margin-top:1.4rem;gap:1.5rem}.details-grid{grid-template-columns:1fr;gap:1rem}h1{font-size:2rem}.favorite span{display:none}}
    .details-error{display:grid;max-width:560px;place-items:center;gap:.75rem;margin:5rem auto;padding:2rem;border:1px solid #d9d4c9;border-radius:14px;background:#fff;text-align:center}.details-error strong{font-size:1.25rem}.details-error p{margin:0;color:#777166}
    .sidebar-stack .contact-card{position:static}.sidebar-stack .safety-card{position:relative;z-index:5;display:block;visibility:visible}
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdvertisementDetailsComponent {
  private readonly id = Number(inject(ActivatedRoute).snapshot.paramMap.get('id'));
  private readonly document = inject(DOCUMENT);
  private readonly advertisements = inject(AdvertisementsService);
  private readonly ratings = inject(AdvertiserRatingsService);
  private readonly reports = inject(AdvertisementReportsService);
  private readonly router = inject(Router);
  private readonly seo = inject(SeoService);
  private readonly favorites = inject(FavoritesService);
  private readonly notices = inject(NotificationService);
  private readonly i18n = inject(TranslationService);
  readonly auth = inject(AuthService);
  readonly item = signal<AdvertisementDetails | null>(null);
  readonly favorite = signal(false);
  readonly shareOpen = signal(false);
  readonly loadFailed = signal(false);
  readonly selectedImage = signal(0);
  readonly rating = signal<import('../../../Core/Models/api.models').AdvertiserRatingSummary | null>(null);
  readonly hoveredRating = signal(0);
  readonly ratingSubmitting = signal(false);
  readonly reportOpen = signal(false);
  readonly mediatorOpen = signal(false);
  readonly hasReported = signal(false);
  readonly promotionRank = computed(() => {
    const value = this.item()?.promotionLevel;
    return typeof value === 'number' ? value : Math.max(0, ['standard','featured','premium','vip'].indexOf(String(value ?? '').toLowerCase()));
  });
  readonly reportReason = signal('');
  readonly reportDetails = signal('');
  readonly reportSubmitting = signal(false);
  readonly reportReasons = [
    { value: 'Fraud', ar: 'إعلان وهمي أو احتيالي', en: 'Fraudulent or fake listing' },
    { value: 'IncorrectInformation', ar: 'معلومات أو سعر غير صحيح', en: 'Incorrect information or price' },
    { value: 'Unavailable', ar: 'العقار لم يعد متاحًا', en: 'Property is no longer available' },
    { value: 'InappropriateImages', ar: 'صور غير مناسبة أو مسروقة', en: 'Inappropriate or stolen images' },
    { value: 'Duplicate', ar: 'إعلان مكرر', en: 'Duplicate listing' },
    { value: 'InvalidPhone', ar: 'رقم الهاتف لا يعمل', en: 'Phone number does not work' },
    { value: 'Other', ar: 'سبب آخر', en: 'Other reason' },
  ] as const;
  readonly canSubmitReport = computed(() => !!this.reportReason() && (this.reportReason() !== 'Other' || !!this.reportDetails().trim()));
  readonly stars = [1, 2, 3, 4, 5] as const;
  readonly displayedRating = computed(() => this.hoveredRating() || this.rating()?.myRating || 0);
  readonly images = computed(() => {
    const paths = this.item()?.images?.length ? this.item()!.images : [this.item()?.coverImage || ''];
    return paths.map(path => path ? (path.startsWith('http') ? path : `${environment.apiOrigin}/${path.replace(/^\//, '')}`) : 'assets/brand/kemit-logo.jpeg');
  });
  readonly mainImage = computed(() => this.images()[this.selectedImage()] || this.images()[0]);
  readonly pricePerMeter = computed(() => { const ad = this.item(); return ad?.area ? ad.price / ad.area : 0; });
  readonly mapUrl = computed(() => {
    const item = this.item();
    if (item?.latitude === null || item?.latitude === undefined || item.longitude === null || item.longitude === undefined) return null;
    const latitude = Number(item.latitude);
    const longitude = Number(item.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
    return `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=17/${latitude}/${longitude}`;
  });
  readonly propertyLabel = computed(() => this.localizedLabel(this.item()?.propertyType, {
    Apartment:['شقة','Apartment'], House:['منزل','House'], CommercialStore:['محل تجاري','Commercial store'], Office:['مكتب','Office'], chalet:['شاليه','Chalet'], Warehouse:['مخزن','Warehouse'], Land:['أرض','Land'], Villa:['فيلا','Villa'], Duplex:['دوبلكس','Duplex'], Studio:['استوديو','Studio'], HotelUnit:['وحدة فندقية','Hotel unit'], MedicalClinic:['عيادة طبية','Medical clinic'], CommercialBuilding:['مبنى تجاري','Commercial building'], Factory:['مصنع','Factory'], Garage:['جراج','Garage'], RestaurantOrCafe:['مطعم أو كافيه','Restaurant or cafe'], Penthouse:['بينت هاوس','Penthouse'], TownHouse:['تاون هاوس','Town house'], TwinHouse:['توين هاوس','Twin house'],
    '0':['شقة','Apartment'], '1':['منزل','House'], '2':['محل تجاري','Commercial store'], '3':['مكتب','Office'], '4':['شاليه','Chalet'], '5':['مخزن','Warehouse'], '6':['أرض','Land'], '7':['فيلا','Villa'], '8':['دوبلكس','Duplex'], '9':['استوديو','Studio'], '10':['وحدة فندقية','Hotel unit'], '11':['عيادة طبية','Medical clinic'], '12':['مبنى تجاري','Commercial building'], '13':['مصنع','Factory'], '14':['جراج','Garage'], '15':['مطعم أو كافيه','Restaurant or cafe'], '16':['بينت هاوس','Penthouse'], '17':['تاون هاوس','Town house'], '18':['توين هاوس','Twin house'],
  }));
  readonly activityLabel = computed(() => this.localizedLabel(this.item()?.activityType, { Residential:['سكني','Residential'], Commercial:['تجاري','Commercial'], '0':['سكني','Residential'], '1':['تجاري','Commercial'] }));
  readonly rentalPeriodLabel = computed(() => this.localizedLabel(this.item()?.rentalPeriod, { Monthly:['شهري','Monthly'], Daily:['يومي','Daily'], '0':['شهري','Monthly'], '1':['يومي','Daily'] }));
  readonly furnishingLabel = computed(() => this.localizedLabel(this.item()?.furnishingStatus, { Furnished:['مفروشة','Furnished'], Unfurnished:['بدون فرش','Unfurnished'], '0':['مفروشة','Furnished'], '1':['بدون فرش','Unfurnished'] }));
  readonly advertisementLabel = computed(() => this.localizedLabel(this.item()?.advertisementType, { Sell:['للبيع','For sale'], Rent:['للإيجار','For rent'], '0':['للبيع','For sale'], '1':['للإيجار','For rent'] }));
  readonly isInstallment = computed(() => {
    const value = this.item()?.paymentMethod;
    return value === 1 || String(value).toLowerCase() === 'installment';
  });
  readonly paymentMethodLabel = computed(() => {
    const value = this.item()?.paymentMethod;
    if (value === null || value === undefined || value === '') return '';
    return this.isInstallment() ? this.text('تقسيط', 'Installment') : this.text('كاش', 'Cash');
  });
  readonly publisherLabel = computed(() => {
    const value = String(this.item()?.publisherType ?? '');
    return value === 'Owner' || value === '1' ? this.text('مالك', 'Owner') : this.text('وسيط عقاري', 'Broker');
  });
  readonly whatsappUrl = computed(() => `https://wa.me/${(this.item()?.phoneNumber || '').replace(/\D/g, '').replace(/^0/, '20')}`);
  readonly advertisementUrl = computed(() => new URL(`/properties/${this.id}`, this.document.baseURI).href);
  readonly whatsappShareUrl = computed(() => `https://wa.me/?text=${encodeURIComponent(`${this.item()?.title ?? ''}\n${this.advertisementUrl()}`)}`);
  readonly kemitMediatorWhatsappUrl = computed(() => {
    const message = this.text(
      `مرحبًا كيميت، أريد إضافة كيميت كوسيط لإتمام الصفقة بأمان بخصوص الإعلان التالي:\n${this.item()?.title ?? ''}\n${this.advertisementUrl()}`,
      `Hello Kemet, I would like Kemet to mediate this deal safely for the following listing:\n${this.item()?.title ?? ''}\n${this.advertisementUrl()}`,
    );
    return `https://wa.me/201100060960?text=${encodeURIComponent(message)}`;
  });
  readonly facebookShareUrl = computed(() => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(this.advertisementUrl())}`);
  readonly advertiserName = computed(() => this.item()?.advertiserName || this.publisherLabel());
  readonly advertiserAvatar = computed(() => {
    const path = this.item()?.advertiserAvatarUrl;
    return path ? (path.startsWith('http') ? path : `${environment.apiOrigin}/${path.replace(/^\//, '')}`) : 'assets/brand/default-advertiser-avatar.png';
  });

  constructor() {
    this.loadAdvertisement();
    if (this.auth.isAuthenticated()) this.favorites.check(this.id).subscribe({ next: result => this.favorite.set(result.isFavorite), error: () => {} });
  }

  loadAdvertisement() {
    this.loadFailed.set(false);
    this.advertisements.getById(this.id).subscribe({
      next: ad => {
        this.item.set(ad);
        this.loadRating(ad.advertiserId);
        if (this.auth.isAuthenticated() && this.auth.currentUser()?.id !== ad.advertiserId) this.loadMyReport();
        this.seo.update(ad.title, ad.description, `/properties/${ad.id}`);
      },
      error: () => this.loadFailed.set(true),
    });
  }

  text(arabic: string, english: string) { return this.i18n.locale() === 'ar' ? arabic : english; }
  dateLocale() { return this.i18n.locale() === 'ar' ? 'ar-EG' : 'en-US'; }
  currencyLabel() { return this.text('جنيه', 'EGP'); }
  previousImage() { if (this.images().length > 1) this.selectedImage.update(index => (index - 1 + this.images().length) % this.images().length); }
  nextImage() { if (this.images().length > 1) this.selectedImage.update(index => (index + 1) % this.images().length); }
  async copyAdvertisementLink() {
    try {
      const clipboard = this.document.defaultView?.navigator.clipboard;
      if (clipboard) {
        await clipboard.writeText(this.advertisementUrl());
      } else {
        const input = this.document.createElement('textarea');
        input.value = this.advertisementUrl();
        input.style.position = 'fixed';
        input.style.opacity = '0';
        this.document.body.appendChild(input);
        input.select();
        const copied = this.document.execCommand('copy');
        input.remove();
        if (!copied) throw new Error('Copy command failed');
      }
      this.notices.show(this.text('تم نسخ رابط الإعلان', 'Listing link copied'), 'success');
    } catch {
      this.notices.show(this.text('تعذر نسخ الرابط', 'Could not copy the link'), 'error');
    } finally {
      this.shareOpen.set(false);
    }
  }
  toggleFavorite() {
    if (!this.auth.isAuthenticated()) { this.notices.show(this.text('سجّل الدخول لإضافة الإعلان إلى المفضلة.','Sign in to add this listing to favorites.'), 'info'); return; }
    const request = this.favorite() ? this.favorites.remove(this.id) : this.favorites.add(this.id);
    request.subscribe(() => {
      this.favorite.update(value => !value);
      this.notices.show(
        this.favorite()
          ? this.text('تمت إضافة الإعلان إلى المفضلة', 'Listing added to favorites')
          : this.text('تمت إزالة الإعلان من المفضلة', 'Listing removed from favorites'),
        'success',
        3500,
      );
    });
  }
  goToLogin() {
    void this.router.navigate(['/auth/login'], { queryParams: { returnUrl: this.router.url } });
  }
  submitRating(score: number) {
    const advertiserId = this.item()?.advertiserId;
    if (!this.auth.isAuthenticated()) { this.goToLogin(); return; }
    if (!advertiserId || this.rating()?.canRate === false || this.ratingSubmitting()) return;
    this.ratingSubmitting.set(true);
    this.ratings.rate(advertiserId, score).pipe(finalize(() => this.ratingSubmitting.set(false))).subscribe({
      next: summary => {
        this.rating.set(summary);
        this.notices.show(this.text('تم حفظ تقييمك', 'Your rating was saved'), 'success');
      },
    });
  }
  removeRating() {
    const advertiserId = this.item()?.advertiserId;
    if (!advertiserId || this.ratingSubmitting()) return;
    this.ratingSubmitting.set(true);
    this.ratings.remove(advertiserId).pipe(finalize(() => this.ratingSubmitting.set(false))).subscribe({
      next: () => {
        this.loadRating(advertiserId);
        this.notices.show(this.text('تم حذف تقييمك', 'Your rating was removed'), 'success');
      },
    });
  }
  openReport() {
    if (!this.auth.isAuthenticated()) { this.goToLogin(); return; }
    if (!this.hasReported()) this.reportOpen.set(true);
  }
  closeReport() {
    if (!this.reportSubmitting()) this.reportOpen.set(false);
  }
  submitReport() {
    if (!this.canSubmitReport() || this.reportSubmitting()) return;
    this.reportSubmitting.set(true);
    this.reports.create(this.id, this.reportReason(), this.reportDetails().trim() || undefined)
      .pipe(finalize(() => this.reportSubmitting.set(false)))
      .subscribe({ next: () => {
        this.hasReported.set(true);
        this.reportOpen.set(false);
        this.notices.show(this.text('تم استلام بلاغك وسيتم مراجعته من الإدارة', 'Your report was received and will be reviewed'), 'success');
      }});
  }
  private loadMyReport() {
    this.reports.getMine(this.id).subscribe({ next: result => this.hasReported.set(result.hasReported), error: () => {} });
  }
  private loadRating(advertiserId: string) {
    if (!advertiserId) return;
    this.ratings.getSummary(advertiserId).subscribe({ next: summary => this.rating.set(summary), error: () => {} });
  }
  private localizedLabel(value: string | number | undefined, labels: Record<string, readonly [string, string]>) {
    const label = labels[String(value ?? '')];
    return label ? this.text(label[0], label[1]) : String(value ?? '');
  }
  private labelFor(value: string | number | undefined, labels: Record<string, string>) { return labels[String(value ?? '')] ?? String(value ?? ''); }
}
