import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { catchError, combineLatest, of, switchMap } from 'rxjs';
import { TranslationService } from '../../../Core/I18n/translation.service';
import { Advertisement, LocationOption } from '../../../Core/Models/api.models';
import { AdvertisementFilters, AdvertisementsService } from '../../../Core/Services/advertisements.service';
import { LocationsService } from '../../../Core/Services/locations.service';
import { SeoService } from '../../../Core/Services/seo.service';
import { ListingCardComponent } from '../../../Shared/Components/listing-card/listing-card.component';
import { TranslatePipe } from '../../../Shared/Pipes/translate.pipe';
import { LocationNamePipe } from '../../../Shared/Pipes/location-name.pipe';

interface FilterForm {
  governorateId: number | null;
  cityId: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  propertyType: string;
  activityType: string;
  advertisementType: string;
  publisherType: string;
  sort: number | null;
}

const EMPTY_FILTERS: FilterForm = {
  governorateId: null,
  cityId: null,
  bedrooms: null,
  bathrooms: null,
  propertyType: '',
  activityType: '',
  advertisementType: '',
  publisherType: '',
  sort: null,
};

@Component({
  selector: 'app-advertisements-list',
  imports: [FormsModule, ListingCardComponent, TranslatePipe, LocationNamePipe],
  template: `
    <section id="all-advertisements" class="section listings-page">
      <div class="container">
        <header class="page-hero">
          <div>
            <p class="eyebrow">{{ 'propertyMarket' | t }}</p>
            <h1>{{ 'findProperty' | t }}</h1>
            <p class="muted">{{ 'findPropertyLead' | t }}</p>
          </div>
          <span class="hero-mark" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 20V9l8-6 8 6v11H4Z"/><path d="M9 20v-6h6v6"/></svg></span>
        </header>

        <div class="quick-classifications" [attr.aria-label]="text('تصنيف الإعلانات', 'Listing classification')">
          <fieldset class="quick-filter-group">
            <legend>{{ 'activityFilterTitle' | t }}</legend>
            <div class="quick-segments">
              <button type="button" [class.active]="appliedFilters().activityType === ''" (click)="setQuickFilter('activityType', '')">{{ 'all' | t }}</button>
              <button type="button" [class.active]="appliedFilters().activityType === 'Residential'" (click)="setQuickFilter('activityType', 'Residential')">{{ 'activityResidential' | t }}</button>
              <button type="button" [class.active]="appliedFilters().activityType === 'Commercial'" (click)="setQuickFilter('activityType', 'Commercial')">{{ 'activityCommercial' | t }}</button>
            </div>
          </fieldset>
          <fieldset class="quick-filter-group">
            <legend>{{ 'listingTypeFilterTitle' | t }}</legend>
            <div class="quick-segments">
              <button type="button" [class.active]="appliedFilters().advertisementType === ''" (click)="setQuickFilter('advertisementType', '')">{{ 'all' | t }}</button>
              <button type="button" [class.active]="appliedFilters().advertisementType === 'Sell'" (click)="setQuickFilter('advertisementType', 'Sell')">{{ 'sell' | t }}</button>
              <button type="button" [class.active]="appliedFilters().advertisementType === 'Rent'" (click)="setQuickFilter('advertisementType', 'Rent')">{{ 'rent' | t }}</button>
            </div>
          </fieldset>
        </div>

        <div class="catalog-toolbar">
          <div class="results-count" role="status">
            <i aria-hidden="true"></i>
            @if (searching()) {
              <small>{{ 'searching' | t }}</small>
            } @else {
              <div><strong>{{ totalCount() }}</strong><small>{{ text(' إعلان متاح', ' available listings') }}</small></div>
            }
          </div>
          <div class="toolbar-actions">
            @if (activeFilterCount()) {
              <button class="clear-active" type="button" (click)="resetFilters()"><span>×</span>{{ 'clearFilters' | t }}</button>
            }
            <button type="button" class="filter-toggle" [class.active]="filtersOpen() || activeFilterCount()" [attr.aria-expanded]="filtersOpen()" aria-controls="advertisement-filters" (click)="toggleFilters()">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M7 12h10M10 18h4"/></svg>
              {{ 'filters' | t }}
              @if (activeFilterCount()) { <b>{{ activeFilterCount() }}</b> }
            </button>
          </div>
        </div>

        @if (filtersOpen()) {
          <form id="advertisement-filters" class="filters" (ngSubmit)="applyFilters()">
            <div class="filter-heading">
              <div><span>{{ text('خصّص النتائج', 'Refine results') }}</span><strong>{{ 'filterListings' | t }}</strong><small>{{ 'chooseSpecifications' | t }}</small></div>
              <button type="button" class="close" [attr.aria-label]="'close' | t" (click)="closeFilters()">×</button>
            </div>
            <div class="filter-grid">
              <label>{{ 'listingType' | t }}
                <select name="advertisementType" [(ngModel)]="draft.advertisementType"><option value="">{{ 'all' | t }}</option><option value="Sell">{{ 'sell' | t }}</option><option value="Rent">{{ 'rent' | t }}</option></select>
              </label>
              <label>{{ 'propertyType' | t }}
                <select name="propertyType" [(ngModel)]="draft.propertyType"><option value="">{{ 'all' | t }}</option>@for (type of propertyTypes; track type.value) { <option [value]="type.value">{{ type.key | t }}</option> }</select>
              </label>
              <label>{{ text('نوع النشاط', 'Activity type') }}
                <select name="activityType" [(ngModel)]="draft.activityType"><option value="">{{ 'all' | t }}</option><option value="Residential">{{ text('سكني', 'Residential') }}</option><option value="Commercial">{{ text('تجاري', 'Commercial') }}</option></select>
              </label>
              <label>{{ 'governorate' | t }}
                <select name="governorateId" [(ngModel)]="draft.governorateId" (ngModelChange)="governorateChanged($event)"><option [ngValue]="null">{{ 'allGovernorates' | t }}</option>@for (item of governorates(); track item.id) { <option [ngValue]="item.id">{{ item.name | locationName }}</option> }</select>
              </label>
              <label>{{ 'city' | t }}
                <select name="cityId" [(ngModel)]="draft.cityId" [disabled]="!draft.governorateId"><option [ngValue]="null">{{ 'allCities' | t }}</option>@for (item of cities(); track item.id) { <option [ngValue]="item.id">{{ item.name | locationName }}</option> }</select>
              </label>
              <label>{{ 'bedrooms' | t }}<input name="bedrooms" type="number" min="0" [placeholder]="'anyNumber' | t" [(ngModel)]="draft.bedrooms"></label>
              <label>{{ 'bathrooms' | t }}<input name="bathrooms" type="number" min="0" [placeholder]="'anyNumber' | t" [(ngModel)]="draft.bathrooms"></label>
              <label>{{ 'publisherType' | t }}
                <select name="publisherType" [(ngModel)]="draft.publisherType"><option value="">{{ 'all' | t }}</option><option value="Owner">{{ 'owner' | t }}</option><option value="Brokar">{{ 'broker' | t }}</option></select>
              </label>
              <label>{{ 'sorting' | t }}
                <select name="sort" [(ngModel)]="draft.sort"><option [ngValue]="null">{{ 'newestFirst' | t }}</option><option [ngValue]="1">{{ 'lowestPrice' | t }}</option><option [ngValue]="2">{{ 'highestPrice' | t }}</option><option [ngValue]="3">{{ 'smallestArea' | t }}</option><option [ngValue]="4">{{ 'largestArea' | t }}</option><option [ngValue]="5">{{ 'oldestFirst' | t }}</option><option [ngValue]="6">{{ 'newestFirst' | t }}</option></select>
              </label>
            </div>
            <div class="filter-actions"><button type="submit" class="btn btn-gold">{{ 'showResults' | t }}</button><button type="button" class="btn btn-ghost" (click)="resetFilters()">{{ 'clearFilters' | t }}</button></div>
          </form>
        }

        @if (searching()) {
          <div class="grid-cards loading-grid" aria-hidden="true">@for (row of [1,2,3,4,5,6]; track row) { <article class="listing-placeholder"><i></i><span></span><span></span><span></span></article> }</div>
        } @else if (loadFailed()) {
          <div class="catalog-empty"><span aria-hidden="true">!</span><strong>{{ text('تعذر تحميل الإعلانات', 'Could not load listings') }}</strong><p>{{ text('تحقق من الاتصال ثم حاول مرة أخرى.', 'Check your connection and try again.') }}</p><button class="btn btn-gold" type="button" (click)="retry()">{{ text('إعادة المحاولة', 'Try again') }}</button></div>
        } @else if (items().length) {
          <div class="grid-cards results-grid">@for (item of items(); track item.id) { <app-listing-card [item]="item" kind="property"/> }</div>
        } @else {
          <div class="catalog-empty"><span aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 6h16M7 12h10M10 18h4"/></svg></span><strong>{{ 'noMatchingResults' | t }}</strong><p>{{ text('جرّب تغيير الاختيارات أو مسح الفلاتر الحالية.', 'Try changing your selections or clearing the current filters.') }}</p>@if(activeFilterCount()){<button class="btn btn-gold" type="button" (click)="resetFilters()">{{ 'clearFilters' | t }}</button>}@else{<button class="btn btn-gold" type="button" (click)="toggleFilters()">{{ 'filters' | t }}</button>}</div>
        }

        @if (!searching() && !loadFailed() && totalPages() > 1) {
          <nav class="list-pagination" [attr.aria-label]="text('صفحات الإعلانات', 'Listing pages')">
            <button type="button" class="page-direction" [disabled]="pageIndex() === 1" (click)="goToPage(pageIndex() - 1)">{{ text('السابق', 'Previous') }}</button>
            <div class="page-numbers">
              @for (page of visiblePages(); track page) {
                <button type="button" [class.active]="page === pageIndex()" [attr.aria-current]="page === pageIndex() ? 'page' : null" (click)="goToPage(page)">{{ page }}</button>
              }
            </div>
            <button type="button" class="page-direction" [disabled]="pageIndex() === totalPages()" (click)="goToPage(pageIndex() + 1)">{{ text('التالي', 'Next') }}</button>
          </nav>
        }
      </div>
    </section>
  `,
  styles: [`
    .listings-page{min-height:75vh;background:radial-gradient(circle at 90% 0,#3c2b102e,transparent 26%)}.page-hero{display:flex;align-items:center;justify-content:space-between;gap:2rem;padding:1rem 0 2.2rem;border-bottom:1px solid var(--color-border)}.page-hero h1{margin:.25rem 0;font-size:clamp(2.5rem,6vw,4.8rem);line-height:1.08}.page-hero .muted{max-width:62ch;margin:.4rem 0}.hero-mark{display:grid;width:110px;height:110px;flex:0 0 auto;place-items:center;border:1px solid #e3b84f40;border-radius:28px;background:radial-gradient(circle,#e3b84f24,#0e0d0a);transform:rotate(4deg)}.hero-mark svg{width:50px;fill:none;stroke:var(--color-primary);stroke-width:1.3}.catalog-toolbar{display:flex;align-items:center;justify-content:space-between;gap:1rem;margin:1.5rem 0}.results-count{display:flex;align-items:center;gap:.65rem;color:var(--color-muted)}.results-count>i{width:8px;height:8px;border-radius:50%;background:var(--color-primary);box-shadow:0 0 12px var(--color-primary)}.results-count div{display:flex;align-items:baseline;gap:.25rem}.results-count strong{color:#fff;font-size:1.15rem}.results-count small{font-size:.74rem}.toolbar-actions{display:flex;align-items:center;gap:.55rem}.filter-toggle,.clear-active{display:flex;min-height:46px;align-items:center;gap:.5rem;padding:.55rem 1rem;border:1px solid var(--color-border);border-radius:12px;background:#111;color:#fff;font:inherit;font-size:.78rem;font-weight:900;cursor:pointer}.filter-toggle svg{width:20px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round}.filter-toggle:hover,.filter-toggle.active{border-color:var(--color-primary);color:var(--color-primary)}.filter-toggle b{display:grid;min-width:22px;height:22px;place-items:center;border-radius:99px;background:var(--color-primary);color:#111;font-size:.68rem}.clear-active{border-color:transparent;background:transparent;color:var(--color-muted)}.clear-active:hover{color:#fff}.clear-active span{font-size:1.1rem}.filters{margin-bottom:2rem;padding:1.35rem;border:1px solid #e3b84f55;border-radius:18px;background:linear-gradient(145deg,#17140f,#0c0c0c);box-shadow:0 20px 50px #0006;animation:panel-in .2s ease}.filter-heading{display:flex;align-items:start;justify-content:space-between;margin-bottom:1.2rem}.filter-heading>div{display:grid;gap:.1rem}.filter-heading span{color:var(--color-primary);font-size:.62rem;font-weight:900}.filter-heading strong{font-size:1.15rem}.filter-heading small{color:var(--color-muted)}.close{border:0;background:none;color:var(--color-muted);font-size:1.7rem;cursor:pointer}.filter-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem}.filter-grid label{display:grid;gap:.4rem;color:var(--gray-300);font-size:.77rem;font-weight:700}.filter-grid select,.filter-grid input{width:100%;min-height:47px;padding:.65rem .8rem;border:1px solid var(--input-border);border-radius:9px;background:var(--input-bg);color:var(--color-text);font:inherit}.filter-grid select:focus,.filter-grid input:focus{outline:0;border-color:var(--color-primary);box-shadow:0 0 0 3px #e3b84f16}.filter-grid select:disabled{cursor:not-allowed;opacity:.45}.filter-actions{display:flex;justify-content:flex-end;gap:.7rem;margin-top:1.35rem;padding-top:1rem;border-top:1px solid var(--color-border)}.results-grid{animation:results-in .3s ease}.listing-placeholder{height:485px;overflow:hidden;border:1px solid var(--color-border);border-radius:var(--card-radius);background:#111}.listing-placeholder i,.listing-placeholder span{display:block;background:linear-gradient(90deg,#171614,#29251d,#171614);background-size:200% 100%;animation:shimmer 1.2s infinite}.listing-placeholder i{height:210px}.listing-placeholder span{height:14px;margin:1rem;border-radius:99px}.listing-placeholder span:nth-child(2){width:45%;height:24px}.listing-placeholder span:nth-child(3){width:75%}.listing-placeholder span:nth-child(4){width:55%}.catalog-empty{display:grid;min-height:320px;place-items:center;align-content:center;gap:.65rem;padding:2rem;border:1px dashed #3c3527;border-radius:18px;text-align:center;color:var(--color-muted)}.catalog-empty>span{display:grid;width:60px;height:60px;place-items:center;border-radius:50%;background:#e3b84f15;color:var(--color-primary);font-size:1.4rem;font-weight:900}.catalog-empty svg{width:27px;fill:none;stroke:currentColor;stroke-width:1.6}.catalog-empty strong{color:#fff;font-size:1.05rem}.catalog-empty p{margin:0 0 .5rem}@keyframes panel-in{from{opacity:0;transform:translateY(-6px)}}@keyframes shimmer{to{background-position:-200% 0}}@keyframes results-in{from{opacity:.5;transform:translateY(5px)}}@media(max-width:850px){.filter-grid{grid-template-columns:repeat(2,1fr)}}@media(max-width:600px){.hero-mark{display:none}.page-hero{padding-top:0}.page-hero h1{font-size:2.5rem}.catalog-toolbar{align-items:flex-start}.toolbar-actions{align-items:flex-end;flex-direction:column}.clear-active{min-height:auto;padding:.2rem}.filter-grid{grid-template-columns:1fr}.filters{padding:1rem}.filter-actions .btn{flex:1}.filter-toggle{min-height:43px}.results-count div{display:grid;gap:0}}
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdvertisementsListComponent {
  readonly i18n = inject(TranslationService);
  private readonly api = inject(AdvertisementsService);
  private readonly locations = inject(LocationsService);
  readonly searching = signal(false);
  readonly loadFailed = signal(false);
  readonly items = signal<Advertisement[]>([]);
  readonly totalCount = signal(0);
  readonly pageIndex = signal(1);
  readonly totalPages = signal(0);
  readonly filtersOpen = signal(false);
  readonly governorates = signal<LocationOption[]>([]);
  readonly cities = signal<LocationOption[]>([]);
  readonly appliedFilters = signal<FilterForm>({ ...EMPTY_FILTERS });
  draft: FilterForm = { ...EMPTY_FILTERS };
  readonly propertyTypes = [
    ['Apartment', 'propertyApartment'], ['House', 'propertyHouse'], ['CommercialStore', 'propertyCommercialStore'],
    ['Office', 'propertyOffice'], ['chalet', 'propertyChalet'], ['Warehouse', 'propertyWarehouse'], ['Land', 'propertyLand'],
    ['Villa', 'propertyVilla'], ['Duplex', 'propertyDuplex'], ['Studio', 'propertyStudio'],
    ['HotelUnit', 'propertyHotelUnit'], ['MedicalClinic', 'propertyMedicalClinic'],
    ['CommercialBuilding', 'propertyCommercialBuilding'], ['Factory', 'propertyFactory'],
    ['Garage', 'propertyGarage'], ['RestaurantOrCafe', 'propertyRestaurantOrCafe'],
    ['Penthouse', 'propertyPenthouse'], ['TownHouse', 'propertyTownHouse'], ['TwinHouse', 'propertyTwinHouse'],
  ].map(([value, key]) => ({ value, key }));

  constructor() {
    inject(SeoService).updateLocalized('العقارات', 'Properties', 'تصفح عقارات البيع والإيجار على كيميت.', 'Browse properties for sale and rent on Kemet.', '/properties');
    this.locations.getGovernorates().subscribe({ next: value => this.governorates.set(value), error: () => {} });
    combineLatest([toObservable(this.appliedFilters), toObservable(this.pageIndex)]).pipe(
      switchMap(([selected, pageIndex]) => {
        this.searching.set(true);
        this.loadFailed.set(false);
        const filters: AdvertisementFilters = {
          pageIndex,
          pageSize:18,
          governorateId: selected.governorateId ?? undefined,
          cityId: selected.cityId ?? undefined,
          bedrooms: selected.bedrooms ?? undefined,
          bathrooms: selected.bathrooms ?? undefined,
          propertyType: selected.propertyType || undefined,
          activityType: selected.activityType || undefined,
          advertisementType: selected.advertisementType || undefined,
          publisherType: selected.publisherType || undefined,
          sort: selected.sort ?? undefined,
        };
        return this.api.getAll(filters).pipe(catchError(() => {
          this.loadFailed.set(true);
          return of(null);
        }));
      }),
      takeUntilDestroyed(inject(DestroyRef)),
    ).subscribe(result => {
      this.items.set(result?.data ?? []);
      this.totalCount.set(result?.totalCount ?? 0);
      this.totalPages.set(result?.totalPages ?? 0);
      this.searching.set(false);
    });
  }

  text(arabic: string, english: string) { return this.i18n.locale() === 'ar' ? arabic : english; }

  toggleFilters() {
    if (this.filtersOpen()) { this.closeFilters(); return; }
    this.draft = { ...this.appliedFilters() };
    this.filtersOpen.set(true);
  }

  closeFilters() {
    this.draft = { ...this.appliedFilters() };
    this.filtersOpen.set(false);
  }

  governorateChanged(id: number | null) {
    this.draft.cityId = null;
    this.cities.set([]);
    if (id) this.locations.getCities(Number(id)).subscribe({ next: value => this.cities.set(value), error: () => {} });
  }

  applyFilters() {
    this.pageIndex.set(1);
    this.appliedFilters.set({ ...this.draft });
    this.filtersOpen.set(false);
  }

  setQuickFilter(filter: 'activityType' | 'advertisementType', value: string) {
    const selected = { ...this.appliedFilters(), [filter]: value };
    this.draft = { ...selected };
    this.pageIndex.set(1);
    this.appliedFilters.set(selected);
  }

  resetFilters() {
    this.draft = { ...EMPTY_FILTERS };
    this.cities.set([]);
    this.filtersOpen.set(false);
    this.pageIndex.set(1);
    this.appliedFilters.set({ ...EMPTY_FILTERS });
  }

  visiblePages(): number[] {
    const total = this.totalPages();
    const current = this.pageIndex();
    const start = Math.max(1, Math.min(current - 2, total - 4));
    const end = Math.min(total, start + 4);
    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages() || page === this.pageIndex()) return;
    this.pageIndex.set(page);
    document.getElementById('all-advertisements')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  retry() { this.appliedFilters.set({ ...this.appliedFilters() }); }

  activeFilterCount() {
    return Object.values(this.appliedFilters()).filter(value => value !== null && value !== '').length;
  }
}
