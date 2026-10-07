import { DatePipe, DecimalPipe, DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, combineLatest, of, switchMap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { TranslationService } from '../../../Core/I18n/translation.service';
import { Project, Unit } from '../../../Core/Models/api.models';
import { ProjectsService } from '../../../Core/Services/projects.service';
import { SeoService } from '../../../Core/Services/seo.service';
import { UnitFilters, UnitsService } from '../../../Core/Services/units.service';
import { AuthService } from '../../../Core/Services/auth.service';
import { FavoritesService } from '../../../Core/Services/favorites.service';
import { NotificationService } from '../../../Core/Services/notification.service';
import { LocationNamePipe } from '../../../Shared/Pipes/location-name.pipe';

interface UnitFilterForm {
  activityType: string;
  type: string;
  bedrooms: number | null;
  paymentMethod: string;
  sort: string;
}

const EMPTY_UNIT_FILTERS: UnitFilterForm = {
  activityType: '', type: '', bedrooms: null, paymentMethod: '', sort: '',
};

@Component({
  selector: 'app-project-details',
  imports: [DatePipe, DecimalPipe, FormsModule, RouterLink, LocationNamePipe],
  template: `
    <section class="project-page">
      <div class="container">
        @if (project(); as p) {
          <nav class="breadcrumbs" [attr.aria-label]="text('مسار الصفحة', 'Breadcrumb')">
            <a routerLink="/projects">{{ text('المشروعات', 'Projects') }}</a><span>‹</span><span>{{ p.governorateName | locationName }}</span><span>‹</span><span>{{ p.name }}</span>
          </nav>

          <div class="gallery">
            <div class="main-photo">
              <img [src]="mainImage()" [alt]="p.name">
              <span class="photo-count">{{ selectedImage() + 1 }} / {{ images().length }}</span>
              @if (images().length > 1) {
                <button class="slide-arrow previous" type="button" (click)="previousImage()" [attr.aria-label]="text('الصورة السابقة', 'Previous image')">‹</button>
                <button class="slide-arrow next" type="button" (click)="nextImage()" [attr.aria-label]="text('الصورة التالية', 'Next image')">›</button>
                <div class="dots">@for (photo of images(); track photo; let index = $index) { <button type="button" [class.active]="selectedImage() === index" (click)="selectedImage.set(index)"></button> }</div>
              }
            </div>
          </div>

          <div class="page-grid">
            <main>
              <div class="headline"><div><span class="type-badge">{{ text('مشروع عقاري', 'Real estate project') }}</span><span>{{ statusLabel() }}</span></div></div>
              <h1>{{ p.name }}</h1>
              <div class="location-row">
                <p>⌖ {{ p.cityName | locationName }}، {{ p.governorateName | locationName }}</p>
                @if (mapUrl(); as url) { <a class="map-button" [href]="url" target="_blank" rel="noopener">⌖ {{ text('عرض على الخريطة', 'View on map') }}</a> }
                @if (p.videoUrl) { <a class="map-button" [href]="p.videoUrl" target="_blank" rel="noopener">▶ {{ text('فيديو المشروع', 'Project video') }}</a> }
              </div>

              <section class="details-block">
                <h2>{{ text('تفاصيل المشروع', 'Project details') }}</h2>
                <div class="details-grid">
                  <div><i>▣</i><span>{{ text('طريقة الدفع', 'Payment method') }}</span><b>{{ paymentLabel() }}</b></div>
                  @if (p.installmentYears) { <div><i>◷</i><span>{{ text('مدة التقسيط', 'Installment duration') }}</span><b>{{ p.installmentYears }} {{ text('سنوات', 'years') }}</b></div> }
                  <div><i>✓</i><span>{{ text('حالة المشروع', 'Project status') }}</span><b>{{ statusLabel() }}</b></div>
                  <div><i>⌖</i><span>{{ text('المحافظة', 'Governorate') }}</span><b>{{ p.governorateName | locationName }}</b></div>
                  <div><i>⌂</i><span>{{ text('المدينة', 'City') }}</span><b>{{ p.cityName | locationName }}</b></div>
                  <div><i>▦</i><span>{{ text('عدد الوحدات', 'Units') }}</span><b>{{ p.unitsCount }}</b></div>
                  <div><i>◷</i><span>{{ text('تاريخ الإضافة', 'Added on') }}</span><b>{{ p.createdAt | date:'d MMMM y':'':dateLocale() }}</b></div>
                  @if (p.deliveryDate) { <div><i>◆</i><span>{{ text('تاريخ التسليم', 'Delivery date') }}</span><b>{{ p.deliveryDate | date:'d MMMM y':'':dateLocale() }}</b></div> }
                </div>
              </section>

              <section class="description">
                <p class="eyebrow">{{ text('عن المشروع', 'About the project') }}</p>
                <h2>{{ text('وصف المشروع', 'Project description') }}</h2>
                <p>{{ p.description || text('لا يوجد وصف متاح لهذا المشروع.', 'No description is available for this project.') }}</p>
              </section>
            </main>

            <aside>
              <div class="project-card">
                <a class="developer" [routerLink]="['/developers', p.developerId]" [attr.aria-label]="text('عرض صفحة المطور', 'View developer profile')"><img [src]="developerLogo()" width="64" height="64" [alt]="p.developerName"><div><small>{{ text('المطور العقاري', 'Developer') }}</small><strong>{{ p.developerName }}</strong></div></a>
                <div class="price-box"><span>{{ text('السعر يبدأ من', 'Starting from') }}</span><b>{{ p.startingPrice | number:'1.0-0' }} {{ text('جنيه', 'EGP') }}</b>@if(p.maxPrice){<small>{{ text('حتى', 'Up to') }} {{ p.maxPrice | number:'1.0-0' }} {{ text('جنيه', 'EGP') }}</small>}</div>
                <div class="quick-details"><div><span>{{ text('الدفع', 'Payment') }}</span><b>{{ paymentLabel() }}</b></div><div><span>{{ text('الحالة', 'Status') }}</span><b>{{ statusLabel() }}</b></div><div><span>{{ text('الموقع', 'Location') }}</span><b>{{ p.cityName | locationName }}، {{ p.governorateName | locationName }}</b></div></div>
                <a class="units-button" href="#project-units" (click)="scrollToUnits($event)">{{ text('استعرض الوحدات المتاحة', 'Browse available units') }}</a>
                <small class="reference">{{ text('رقم المشروع', 'Project ID') }}: {{ p.id }}</small>
              </div>
            </aside>
          </div>

          <section class="units-section" id="project-units">
            <div class="units-toolbar">
              <div class="unit-results" role="status"><i></i><strong>{{ unitsLoading() ? text('جاري التحميل...', 'Loading...') : totalUnits() + ' ' + text('وحدة', 'units') }}</strong></div>
              <div class="unit-toolbar-actions">
                @if(activeUnitFilterCount()){<button class="clear-unit-filters" type="button" (click)="resetUnitFilters()">× {{ text('مسح الفلاتر', 'Clear filters') }}</button>}
                <button class="unit-filter-toggle" type="button" [class.active]="unitFiltersOpen() || activeUnitFilterCount()" [attr.aria-expanded]="unitFiltersOpen()" aria-controls="unit-filters" (click)="toggleUnitFilters()"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M7 12h10M10 18h4"/></svg>{{ text('الفلاتر', 'Filters') }}@if(activeUnitFilterCount()){<b>{{activeUnitFilterCount()}}</b>}</button>
              </div>
            </div>
            @if(unitFiltersOpen()){
              <form id="unit-filters" class="unit-filters" (ngSubmit)="applyUnitFilters()">
                <div class="unit-filter-heading"><div><small>{{ text('اختار الوحدة الأنسب ليك', 'Find the right unit') }}</small><strong>{{ text('فلترة وحدات المشروع', 'Filter project units') }}</strong></div><button type="button" (click)="closeUnitFilters()" [attr.aria-label]="text('إغلاق','Close')">×</button></div>
                <div class="unit-filter-grid">
                  <label>{{ text('نوع النشاط','Activity') }}<select name="unitActivity" [(ngModel)]="unitDraft.activityType"><option value="">{{text('الكل','All')}}</option><option value="Residential">{{text('سكني','Residential')}}</option><option value="Commercial">{{text('تجاري','Commercial')}}</option></select></label>
                  <label>{{ text('نوع الوحدة','Unit type') }}<select name="unitType" [(ngModel)]="unitDraft.type"><option value="">{{text('كل الأنواع','All types')}}</option>@for(option of unitTypeOptions;track option.value){<option [value]="option.value">{{text(option.ar,option.en)}}</option>}</select></label>
                  <label>{{ text('عدد الغرف (على الأقل)','Number of rooms (minimum)') }}<input name="bedrooms" type="number" min="0" [(ngModel)]="unitDraft.bedrooms"></label>
                  <label>{{ text('طريقة الدفع','Payment method') }}<select name="unitPaymentMethod" [(ngModel)]="unitDraft.paymentMethod"><option value="">{{text('كل طرق الدفع','All payment methods')}}</option><option value="Cash">{{text('كاش','Cash')}}</option><option value="Installment">{{text('تقسيط','Installment')}}</option></select></label>
                  <label>{{ text('ترتيب النتائج','Sort results') }}<select name="unitSort" [(ngModel)]="unitDraft.sort"><option value="">{{text('الأحدث أولاً','Newest first')}}</option><option value="PriceAsc">{{text('السعر: الأقل أولاً','Price: low to high')}}</option><option value="PriceDesc">{{text('السعر: الأعلى أولاً','Price: high to low')}}</option><option value="AreaAsc">{{text('المساحة: الأصغر أولاً','Area: small to large')}}</option><option value="AreaDesc">{{text('المساحة: الأكبر أولاً','Area: large to small')}}</option></select></label>
                </div>
                <div class="unit-filter-actions"><button class="units-button" type="submit">{{text('عرض النتائج','Show results')}}</button><button type="button" (click)="resetUnitFilters()">{{text('مسح الفلاتر','Clear filters')}}</button></div>
              </form>
            }
            <div class="units-heading"><div><p class="eyebrow">{{ text('داخل المشروع', 'Inside the project') }}</p><h2>{{ text('الوحدات المتاحة', 'Available units') }}</h2></div><span>{{ units().length }} {{ text('وحدة', 'units') }}</span></div>
            @if (unitsLoading()) { <div class="empty-units">{{ text('جاري تحميل الوحدات...', 'Loading units...') }}</div> }
            @else if (unitsLoadFailed()) { <div class="empty-units"><strong>{{text('تعذر تحميل الوحدات','Could not load units')}}</strong><button class="retry-units" type="button" (click)="retryUnits()">{{text('إعادة المحاولة','Try again')}}</button></div> }
            @else if (units().length) {
              <div class="units-grid">@for (unit of units(); track unit.id) {
                <a class="unit-card" [routerLink]="['/projects', p.id, 'units', unit.id]" [attr.aria-label]="text('عرض تفاصيل الوحدة', 'View unit details')">
                  <div class="unit-image"><img [src]="unitImage(unit)" [alt]="unit.title || unitTypeLabel(unit.type)"><span>{{ unitStatusLabel(unit.status) }}</span><button class="unit-favorite" type="button" [class.selected]="unitFavoriteIds().has(unit.id)" (click)="toggleUnitFavorite($event,unit.id)" [attr.aria-label]="unitFavoriteIds().has(unit.id) ? text('إزالة من المفضلة','Remove from favorites') : text('إضافة للمفضلة','Add to favorites')"><svg viewBox="0 0 24 24"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"/></svg></button></div>
                  <div class="unit-body"><small>{{ activityLabel(unit.activityType) }} · {{ unitTypeLabel(unit.type) }}</small><h3>{{ unit.title || unitTypeLabel(unit.type) }}</h3>
                    <div class="unit-facts"><span>{{ unit.area }} {{ text('م²', 'sqm') }}</span><span>{{ unit.numberOfBedrooms || 0 }} {{ text('غرف', 'rooms') }}</span><span>{{ unit.numberOfBathrooms || 0 }} {{ text('حمام', 'baths') }}</span></div>
                    <strong class="unit-price">{{ unit.price | number:'1.0-0' }} {{ text('جنيه', 'EGP') }}</strong>
                    @if(unit.downPayment){<div class="installment"><span>{{ text('مقدم', 'Down payment') }}: {{unit.downPayment|number:'1.0-0'}}</span><span>{{unit.installmentYears}} {{text('سنوات','years')}}</span><span>{{unit.monthlyInstallment|number:'1.0-0'}} / {{text('شهر','month')}}</span></div>}
                  </div>
                </a>
              }</div>
              @if (unitTotalPages() > 1) {
                <nav class="unit-pagination" [attr.aria-label]="text('صفحات الوحدات', 'Unit pages')">
                  <button type="button" [disabled]="unitPageIndex() === 1" (click)="goToUnitPage(unitPageIndex() - 1)">{{ text('السابق', 'Previous') }}</button>
                  <span>{{ unitPageIndex() }} / {{ unitTotalPages() }}</span>
                  <button type="button" [disabled]="unitPageIndex() === unitTotalPages()" (click)="goToUnitPage(unitPageIndex() + 1)">{{ text('التالي', 'Next') }}</button>
                </nav>
              }
            } @else { <div class="empty-units">{{ text('لا توجد وحدات متاحة حاليًا.', 'No units are currently available.') }}</div> }
          </section>
        } @else if (loadFailed()) {
          <div class="error-state"><strong>{{ text('تعذر تحميل المشروع', 'Could not load the project') }}</strong><a class="map-button" routerLink="/projects">{{ text('العودة للمشروعات', 'Back to projects') }}</a></div>
        } @else { <div class="loading-state">{{ text('جاري تحميل تفاصيل المشروع...', 'Loading project details...') }}</div> }
      </div>
    </section>
  `,
  styles: [`
    .project-page{min-height:100vh;padding:1.5rem 0 5rem;background:#f6f4ee;color:#19160f}.breadcrumbs{display:flex;align-items:center;gap:.5rem;margin-bottom:1rem;color:#777166;font-size:.76rem}.breadcrumbs a{color:#815c18;font-weight:800}.gallery{height:min(55vw,540px);overflow:hidden;border-radius:22px;background:#171717}.main-photo{position:relative;width:100%;height:100%;overflow:hidden}.main-photo>img{width:100%;height:100%;object-fit:cover}.photo-count{position:absolute;z-index:2;inset-inline-end:1rem;bottom:1rem;padding:.45rem .75rem;border:1px solid #ffffff45;border-radius:99px;background:#080808cf;color:#fff;font-size:.78rem;font-weight:800}.slide-arrow{position:absolute;z-index:3;top:50%;display:grid;width:46px;height:64px;place-items:center;border:1px solid #ffffff55;border-radius:12px;background:#090909a8;color:#fff;font-size:2.5rem;cursor:pointer;transform:translateY(-50%)}.previous{inset-inline-start:1rem}.next{inset-inline-end:1rem}.dots{position:absolute;z-index:3;bottom:1.15rem;left:50%;display:flex;gap:.4rem;transform:translateX(-50%)}.dots button{width:8px;height:8px;padding:0;border:0;border-radius:50%;background:#ffffff80}.dots button.active{width:22px;border-radius:99px;background:#e3b84f}
    .page-grid{display:grid;grid-template-columns:minmax(0,1fr) 350px;gap:3.5rem;margin-top:2rem}.headline>div{display:flex;align-items:center;gap:.7rem;color:#777166;font-size:.8rem}.type-badge{padding:.3rem .7rem;border-radius:6px;background:#17140e;color:#f6d77e;font-weight:800}h1{max-width:28ch;margin:.65rem 0 .25rem;font-size:clamp(1.8rem,4vw,2.8rem);line-height:1.3}.location-row{display:flex;align-items:center;flex-wrap:wrap;gap:.65rem}.location-row p{color:#6e695f}.map-button{display:inline-flex;align-items:center;gap:.4rem;padding:.48rem .75rem;border:1px solid #d1b66d;border-radius:8px;background:#fffaf0;color:#815c18;font-size:.78rem;font-weight:900}.details-block,.description{padding:1.8rem 0;border-top:1px solid #d9d5cc}.details-block{margin-top:1.8rem}h2{margin:0 0 1.25rem;font-size:1.3rem}.details-grid{display:grid;grid-template-columns:1fr 1fr;gap:1.15rem 2.5rem}.details-grid div{display:grid;grid-template-columns:28px 1fr auto;align-items:center;gap:.6rem}.details-grid i{color:#a7781f;font-style:normal}.details-grid span{color:#777166;font-size:.82rem}.details-grid b{font-size:.86rem;text-align:end}.description .eyebrow,.units-heading .eyebrow{margin:0;color:#9a6e19}.description>p:last-child{color:#514d45;line-height:2;white-space:pre-line}
    aside{position:relative}.project-card{position:sticky;top:92px;padding:1.25rem;border:1px solid #d9d4c9;border-radius:14px;background:#fff;box-shadow:0 12px 38px #2d271b18}.developer{display:flex;align-items:center;gap:.8rem;padding-bottom:1rem;border-bottom:1px solid #e2ded5;color:inherit;transition:.2s}.developer:hover strong{color:#a7781f}.developer img{width:64px;height:64px;border:2px solid #e3b84f;border-radius:50%;object-fit:contain;background:#17140e}.developer div{display:grid}.developer small,.price-box span,.price-box small,.quick-details span{color:#777166}.developer strong{font-size:1rem;transition:.2s}.price-box{display:grid;gap:.25rem;margin:1rem 0;padding:1rem;border-radius:10px;background:#f5f2eb;text-align:center}.price-box b{font-size:1.3rem}.quick-details{display:grid;gap:.7rem;padding-block:.25rem 1rem}.quick-details div{display:flex;justify-content:space-between;gap:1rem;font-size:.78rem}.quick-details b{max-width:60%;text-align:end}.units-button{display:block;padding:.8rem;border-radius:8px;background:#17140e;color:#f6d77e;text-align:center;font-weight:900}.reference{display:block;margin-top:1rem;color:#817b70;text-align:center}
    .units-section{scroll-margin-top:90px;margin-top:4rem;padding-top:2rem;border-top:1px solid #d9d5cc}.units-heading{display:flex;align-items:end;justify-content:space-between;margin-bottom:1.3rem}.units-heading h2{margin:.2rem 0 0}.units-heading>span{padding:.35rem .7rem;border-radius:99px;background:#17140e;color:#f6d77e;font-size:.75rem;font-weight:800}.units-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem}.unit-card{overflow:hidden;border:1px solid #d9d4c9;border-radius:14px;background:#fff;box-shadow:0 8px 25px #2d271b0d}.unit-image{position:relative;height:175px;background:#171717}.unit-image img{width:100%;height:100%;object-fit:cover}.unit-image span{position:absolute;top:.7rem;inset-inline-start:.7rem;padding:.25rem .55rem;border-radius:99px;background:#0a0a0add;color:#f6d77e;font-size:.65rem;font-weight:800}.unit-body{padding:1rem}.unit-body>small{color:#96701f}.unit-body h3{margin:.3rem 0 .7rem}.unit-facts{display:flex;flex-wrap:wrap;gap:.35rem}.unit-facts span,.installment span{padding:.28rem .5rem;border-radius:6px;background:#f5f2eb;color:#615b50;font-size:.68rem}.unit-price{display:block;margin-top:.8rem;color:#815c18}.installment{display:flex;flex-wrap:wrap;gap:.3rem;margin-top:.6rem}.empty-units,.loading-state,.error-state{padding:3rem;border:1px solid #d9d4c9;border-radius:14px;background:#fff;text-align:center}.error-state{display:grid;max-width:560px;gap:1rem;margin:5rem auto;place-items:center}
    @media(max-width:900px){.page-grid{grid-template-columns:1fr;gap:1.5rem}.project-card{position:static}.units-grid{grid-template-columns:1fr 1fr}}@media(max-width:620px){.project-page{padding-top:1rem}.gallery{height:280px;border-radius:14px}.slide-arrow{width:38px;height:52px}.details-grid{grid-template-columns:1fr;gap:1rem}.units-grid{grid-template-columns:1fr}h1{font-size:2rem}.page-grid{margin-top:1.4rem}.details-grid div{grid-template-columns:25px 1fr auto}}
    .unit-favorite{position:absolute;top:.65rem;inset-inline-end:.65rem;display:grid;width:38px;height:38px;place-items:center;border:1px solid #ffffff70;border-radius:50%;background:#090909b8;color:#fff;cursor:pointer}.unit-favorite svg{width:20px;fill:transparent;stroke:currentColor;stroke-width:1.8}.unit-favorite.selected{color:#e3b84f}.unit-favorite.selected svg{fill:currentColor}.unit-pagination{display:flex;align-items:center;justify-content:center;gap:.8rem;margin-top:1.5rem}.unit-pagination button{min-width:90px;padding:.65rem 1rem;border:1px solid #c9b16f;border-radius:9px;background:#fff;color:#6f5118;font:inherit;font-size:.78rem;font-weight:900;cursor:pointer;transition:.2s}.unit-pagination button:hover:not(:disabled){background:#17140e;color:#f6d77e}.unit-pagination button:disabled{cursor:not-allowed;opacity:.4}.unit-pagination span{color:#777166;font-size:.8rem;font-weight:800}
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectDetailsComponent {
  private readonly id = Number(inject(ActivatedRoute).snapshot.paramMap.get('id'));
  private readonly document = inject(DOCUMENT);
  private readonly auth = inject(AuthService);
  private readonly favorites = inject(FavoritesService);
  private readonly notices = inject(NotificationService);
  private readonly i18n = inject(TranslationService);
  private readonly seo = inject(SeoService);
  private readonly unitsApi = inject(UnitsService);
  readonly project = signal<Project | null>(null);
  readonly units = signal<Unit[]>([]);
  readonly totalUnits = signal(0);
  readonly unitPageIndex = signal(1);
  readonly unitTotalPages = signal(0);
  readonly unitsLoading = signal(false);
  readonly unitsLoadFailed = signal(false);
  readonly unitFiltersOpen = signal(false);
  readonly appliedUnitFilters = signal<UnitFilterForm>({ ...EMPTY_UNIT_FILTERS });
  unitDraft: UnitFilterForm = { ...EMPTY_UNIT_FILTERS };
  readonly unitTypeOptions = [
    { value: 'Apartment', ar: 'شقة', en: 'Apartment' }, { value: 'Villa', ar: 'فيلا', en: 'Villa' },
    { value: 'Duplex', ar: 'دوبلكس', en: 'Duplex' }, { value: 'House', ar: 'منزل', en: 'House' },
    { value: 'chalet', ar: 'شاليه', en: 'Chalet' }, { value: 'Studio', ar: 'استوديو', en: 'Studio' },
    { value: 'HotelUnit', ar: 'وحدة فندقية', en: 'Hotel unit' }, { value: 'Office', ar: 'مكتب', en: 'Office' },
    { value: 'CommercialStore', ar: 'محل تجاري', en: 'Commercial store' }, { value: 'MedicalClinic', ar: 'عيادة طبية', en: 'Medical clinic' },
    { value: 'CommercialBuilding', ar: 'مبنى تجاري', en: 'Commercial building' }, { value: 'Warehouse', ar: 'مخزن', en: 'Warehouse' },
    { value: 'Factory', ar: 'مصنع', en: 'Factory' }, { value: 'Garage', ar: 'جراج', en: 'Garage' },
    { value: 'RestaurantOrCafe', ar: 'مطعم أو كافيه', en: 'Restaurant or cafe' }, { value: 'Land', ar: 'أرض', en: 'Land' },
    { value: 'Penthouse', ar: 'بينت هاوس', en: 'Penthouse' }, { value: 'TownHouse', ar: 'تاون هاوس', en: 'Town house' },
    { value: 'TwinHouse', ar: 'توين هاوس', en: 'Twin house' },
  ];
  readonly unitFavoriteIds = signal<ReadonlySet<number>>(new Set());
  readonly selectedImage = signal(0);
  readonly loadFailed = signal(false);
  readonly images = computed(() => {
    const paths = this.project()?.images?.length ? this.project()!.images : [''];
    return paths.map(path => this.imageUrl(path) || 'assets/brand/kemit-logo.jpeg');
  });
  readonly mainImage = computed(() => this.images()[this.selectedImage()] || this.images()[0]);
  readonly developerLogo = computed(() => this.imageUrl(this.project()?.developerLogoUrl || '') || 'assets/brand/kemit-logo-128.png');
  readonly mapUrl = computed(() => {
    const project = this.project();
    const latitude = Number(project?.latitude);
    const longitude = Number(project?.longitude);
    return Number.isFinite(latitude) && Number.isFinite(longitude) && project?.latitude != null && project.longitude != null
      ? `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}` : null;
  });

  constructor() {
    inject(ProjectsService).getById(this.id).subscribe({
      next: project => { this.project.set(project); this.seo.update(project.name, project.description || this.text('تفاصيل المشروع العقاري', 'Real estate project details'), `/projects/${project.id}`); },
      error: () => this.loadFailed.set(true),
    });
    combineLatest([toObservable(this.appliedUnitFilters), toObservable(this.unitPageIndex)]).pipe(
      switchMap(([selected, pageIndex]) => {
        this.unitsLoading.set(true);
        this.unitsLoadFailed.set(false);
        const filters: UnitFilters = { pageIndex, pageSize: 3 };
        Object.entries(selected).forEach(([key, value]) => {
          if (value !== null && value !== '') (filters as Record<string, unknown>)[key] = value;
        });
        return this.unitsApi.getAll(this.id, filters).pipe(catchError(() => { this.unitsLoadFailed.set(true); return of(null); }));
      }),
      takeUntilDestroyed(inject(DestroyRef)),
    ).subscribe(response => {
      this.units.set(response?.data ?? []);
      this.totalUnits.set(response?.totalCount ?? 0);
      this.unitTotalPages.set(response?.totalPages ?? 0);
      this.unitsLoading.set(false);
    });
    if (this.auth.isAuthenticated()) this.favorites.getUnits().subscribe({ next: units => this.unitFavoriteIds.set(new Set(units.map(unit => unit.id))), error: () => {} });
  }

  text(arabic: string, english: string) { return this.i18n.locale() === 'ar' ? arabic : english; }
  dateLocale() { return this.i18n.locale() === 'ar' ? 'ar-EG' : 'en-US'; }
  previousImage() { this.selectedImage.update(index => (index - 1 + this.images().length) % this.images().length); }
  nextImage() { this.selectedImage.update(index => (index + 1) % this.images().length); }
  scrollToUnits(event: Event) { event.preventDefault(); this.document.getElementById('project-units')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  toggleUnitFilters() { if (this.unitFiltersOpen()) { this.closeUnitFilters(); return; } this.unitDraft = { ...this.appliedUnitFilters() }; this.unitFiltersOpen.set(true); }
  closeUnitFilters() { this.unitDraft = { ...this.appliedUnitFilters() }; this.unitFiltersOpen.set(false); }
  applyUnitFilters() { this.unitPageIndex.set(1); this.appliedUnitFilters.set({ ...this.unitDraft }); this.unitFiltersOpen.set(false); }
  resetUnitFilters() { this.unitDraft = { ...EMPTY_UNIT_FILTERS }; this.unitFiltersOpen.set(false); this.unitPageIndex.set(1); this.appliedUnitFilters.set({ ...EMPTY_UNIT_FILTERS }); }
  retryUnits() { this.appliedUnitFilters.set({ ...this.appliedUnitFilters() }); }
  goToUnitPage(page: number) { if (page < 1 || page > this.unitTotalPages() || page === this.unitPageIndex()) return; this.unitPageIndex.set(page); this.document.getElementById('project-units')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  activeUnitFilterCount() { return Object.values(this.appliedUnitFilters()).filter(value => value !== null && value !== '').length; }
  toggleUnitFavorite(event: Event, unitId: number) { event.preventDefault(); event.stopPropagation(); if(!this.auth.isAuthenticated()){this.notices.show(this.text('سجّل الدخول لإضافة الوحدة إلى المفضلة.','Sign in to add this unit to favorites.'),'info');return;} const selected=this.unitFavoriteIds().has(unitId); (selected?this.favorites.removeUnit(unitId):this.favorites.addUnit(unitId)).subscribe({next:()=>{const ids=new Set(this.unitFavoriteIds());selected?ids.delete(unitId):ids.add(unitId);this.unitFavoriteIds.set(ids);this.notices.show(selected?this.text('تمت إزالة الوحدة من المفضلة','Unit removed from favorites'):this.text('تمت إضافة الوحدة إلى المفضلة','Unit added to favorites'),'success',3500);}}); }
  paymentLabel() { return this.label(this.project()?.paymentMethod, { Cash: this.text('كاش','Cash'), Installment: this.text('تقسيط','Installment'), CashOrInstallment: this.text('كاش أو تقسيط','Cash or installment'), '0':this.text('كاش','Cash'), '1':this.text('تقسيط','Installment'), '2':this.text('كاش أو تقسيط','Cash or installment') }); }
  statusLabel() { return this.label(this.project()?.status, { UnderConstruction:this.text('تحت الإنشاء','Under construction'), Ready:this.text('جاهز','Ready'), ComingSoon:this.text('قريبًا','Coming soon'), '0':this.text('تحت الإنشاء','Under construction'), '1':this.text('جاهز','Ready'), '2':this.text('قريبًا','Coming soon') }); }
  activityLabel(value: unknown) { return this.label(value, { Residential:this.text('سكني','Residential'), Commercial:this.text('تجاري','Commercial'), '0':this.text('سكني','Residential'), '1':this.text('تجاري','Commercial') }); }
  unitStatusLabel(value: unknown) { return this.label(value, { Available:this.text('متاحة','Available'), Reserved:this.text('محجوزة','Reserved'), Sold:this.text('مباعة','Sold'), Unavailable:this.text('غير متاحة','Unavailable'), '1':this.text('متاحة','Available'), '2':this.text('محجوزة','Reserved'), '3':this.text('مباعة','Sold'), '4':this.text('غير متاحة','Unavailable') }); }
  unitTypeLabel(value: unknown) { return this.label(value, { Apartment:this.text('شقة','Apartment'), Villa:this.text('فيلا','Villa'), Duplex:this.text('دوبلكس','Duplex'), House:this.text('منزل','House'), chalet:this.text('شاليه','Chalet'), Studio:this.text('استوديو','Studio'), HotelUnit:this.text('وحدة فندقية','Hotel unit'), Office:this.text('مكتب','Office'), MedicalClinic:this.text('عيادة طبية','Medical clinic'), CommercialBuilding:this.text('مبنى تجاري','Commercial building'), Warehouse:this.text('مخزن','Warehouse'), Factory:this.text('مصنع','Factory'), Garage:this.text('جراج','Garage'), RestaurantOrCafe:this.text('مطعم أو كافيه','Restaurant or cafe'), Land:this.text('أرض','Land'), Penthouse:this.text('بينت هاوس','Penthouse'), TownHouse:this.text('تاون هاوس','Town house'), TwinHouse:this.text('توين هاوس','Twin house') }); }
  unitImage(unit: Unit) { return this.imageUrl(unit.images?.[0] || '') || 'assets/brand/kemit-logo.jpeg'; }
  private imageUrl(path: string) { return path ? (path.startsWith('http') ? path : `${environment.apiOrigin}/${path.replace(/^\//, '')}`) : ''; }
  private label(value: unknown, labels: Record<string,string>) { return labels[String(value ?? '')] || String(value ?? ''); }
}
