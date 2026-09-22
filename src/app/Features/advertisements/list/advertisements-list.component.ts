import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { catchError, combineLatest, debounceTime, distinctUntilChanged, filter, map, of, switchMap } from 'rxjs';
import { Advertisement, LocationOption } from '../../../Core/Models/api.models';
import { AdvertisementFilters, AdvertisementsService } from '../../../Core/Services/advertisements.service';
import { LocationsService } from '../../../Core/Services/locations.service';
import { SeoService } from '../../../Core/Services/seo.service';
import { TranslationService } from '../../../Core/I18n/translation.service';
import { ListingCardComponent } from '../../../Shared/Components/listing-card/listing-card.component';
import { SearchBoxComponent } from '../../../Shared/Components/search-box/search-box.component';
import { TranslatePipe } from '../../../Shared/Pipes/translate.pipe';

interface FilterForm {
  governorateId: number | null;
  cityId: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  propertyType: string;
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
  advertisementType: '',
  publisherType: '',
  sort: null,
};

@Component({
  selector: 'app-advertisements-list',
  imports: [FormsModule, ListingCardComponent, SearchBoxComponent, TranslatePipe],
  template: `
    <section class="section">
      <div class="container">
        <p class="eyebrow">{{ 'propertyMarket' | t }}</p>
        <h1>{{ 'findProperty' | t }}</h1>
        <p class="muted">{{ 'findPropertyLead' | t }}</p>

        <div class="search-row">
          <app-search-box
            [placeholder]="'searchPlaceholder' | t"
            [value]="query()"
            (changed)="query.set($event)"
          />
          <button
            type="button"
            class="filter-toggle"
            [class.active]="filtersOpen() || activeFilterCount()"
            [attr.aria-expanded]="filtersOpen()"
            aria-controls="advertisement-filters"
            (click)="filtersOpen.update(value => !value)"
          >
            <span aria-hidden="true">☷</span>
            {{ 'filters' | t }}
            @if (activeFilterCount()) { <b>{{ activeFilterCount() }}</b> }
          </button>
        </div>

        @if (filtersOpen()) {
          <form id="advertisement-filters" class="filters" (ngSubmit)="applyFilters()">
            <div class="filter-heading">
              <div><strong>{{ 'filterListings' | t }}</strong><small>{{ 'chooseSpecifications' | t }}</small></div>
              <button type="button" class="close" [attr.aria-label]="'close' | t" (click)="filtersOpen.set(false)">×</button>
            </div>
            <div class="filter-grid">
              <label>{{ 'listingType' | t }}
                <select name="advertisementType" [(ngModel)]="draft.advertisementType">
                  <option value="">{{ 'all' | t }}</option><option value="Sell">{{ 'sell' | t }}</option><option value="Rent">{{ 'rent' | t }}</option>
                </select>
              </label>
              <label>{{ 'propertyType' | t }}
                <select name="propertyType" [(ngModel)]="draft.propertyType">
                  <option value="">{{ 'all' | t }}</option>
                  @for (type of propertyTypes; track type.value) { <option [value]="type.value">{{ type.key | t }}</option> }
                </select>
              </label>
              <label>{{ 'governorate' | t }}
                <select name="governorateId" [(ngModel)]="draft.governorateId" (ngModelChange)="governorateChanged($event)">
                  <option [ngValue]="null">{{ 'allGovernorates' | t }}</option>
                  @for (item of governorates(); track item.id) { <option [ngValue]="item.id">{{ item.name }}</option> }
                </select>
              </label>
              <label>{{ 'city' | t }}
                <select name="cityId" [(ngModel)]="draft.cityId" [disabled]="!draft.governorateId">
                  <option [ngValue]="null">{{ 'allCities' | t }}</option>
                  @for (item of cities(); track item.id) { <option [ngValue]="item.id">{{ item.name }}</option> }
                </select>
              </label>
              <label>{{ 'bedrooms' | t }}
                <input name="bedrooms" type="number" min="0" [placeholder]="'anyNumber' | t" [(ngModel)]="draft.bedrooms">
              </label>
              <label>{{ 'bathrooms' | t }}
                <input name="bathrooms" type="number" min="0" [placeholder]="'anyNumber' | t" [(ngModel)]="draft.bathrooms">
              </label>
              <label>{{ 'publisherType' | t }}
                <select name="publisherType" [(ngModel)]="draft.publisherType">
                  <option value="">{{ 'all' | t }}</option><option value="Owner">{{ 'owner' | t }}</option><option value="Brokar">{{ 'broker' | t }}</option>
                </select>
              </label>
              <label>{{ 'sorting' | t }}
                <select name="sort" [(ngModel)]="draft.sort">
                  <option [ngValue]="null">{{ 'newestFirst' | t }}</option>
                  <option [ngValue]="1">{{ 'lowestPrice' | t }}</option><option [ngValue]="2">{{ 'highestPrice' | t }}</option>
                  <option [ngValue]="3">{{ 'smallestArea' | t }}</option><option [ngValue]="4">{{ 'largestArea' | t }}</option>
                  <option [ngValue]="5">{{ 'oldestFirst' | t }}</option><option [ngValue]="6">{{ 'newestFirst' | t }}</option>
                </select>
              </label>
            </div>
            <div class="filter-actions">
              <button type="submit" class="btn btn-gold">{{ 'showResults' | t }}</button>
              <button type="button" class="btn btn-ghost" (click)="resetFilters()">{{ 'clearFilters' | t }}</button>
            </div>
          </form>
        }

        @if (searching()) { <p class="eyebrow status" role="status">{{ 'searching' | t }}</p> }
        @if (items().length) {
          <div class="grid-cards">@for (item of items(); track item.id) { <app-listing-card [item]="item" kind="property"/> }</div>
        } @else if (!searching()) { <div class="empty-state">{{ 'noMatchingResults' | t }}</div> }
      </div>
    </section>
  `,
  styles: [`
    h1{font-size:clamp(2.7rem,7vw,5rem);margin:.3rem 0;line-height:1.1}
    .search-row{display:flex;align-items:center;gap:.75rem;margin:2rem 0 1.25rem}.search-row app-search-box{flex:1;min-width:0}
    .filter-toggle{min-height:58px;display:flex;align-items:center;gap:.55rem;padding:.55rem 1.15rem;border:1px solid var(--color-border);border-radius:999px;background:#101010;color:#fff;font:inherit;font-weight:800;cursor:pointer;white-space:nowrap}
    .filter-toggle:hover,.filter-toggle.active{border-color:var(--color-primary);color:var(--color-primary)}.filter-toggle>span{font-size:1.35rem}.filter-toggle b{display:grid;place-items:center;min-width:22px;height:22px;border-radius:50%;background:var(--color-primary);color:#090909;font-size:.72rem}
    .filters{margin-bottom:2rem;padding:1.35rem;border:1px solid #e3b84f55;border-radius:var(--radius-lg);background:linear-gradient(145deg,#15130f,#0d0d0d);box-shadow:var(--shadow-card)}
    .filter-heading{display:flex;align-items:start;justify-content:space-between;margin-bottom:1rem}.filter-heading div{display:grid;gap:.15rem}.filter-heading strong{font-size:1.05rem}.filter-heading small{color:var(--color-muted)}.close{border:0;background:none;color:var(--color-muted);font-size:1.7rem;line-height:1;cursor:pointer}
    .filter-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:1rem}.filter-grid label{display:grid;gap:.4rem;color:var(--gray-300);font-size:.82rem}.filter-grid select,.filter-grid input{width:100%;min-height:46px;padding:.65rem .8rem;border:1px solid var(--input-border);border-radius:var(--radius-sm);background:var(--input-bg);color:var(--color-text);font:inherit}.filter-grid select:focus,.filter-grid input:focus{outline:0;border-color:var(--color-primary)}
    .filter-actions{display:flex;gap:.7rem;margin-top:1.25rem}.status{margin:1rem 0}
    @media(max-width:900px){.filter-grid{grid-template-columns:repeat(2,1fr)}}
    @media(max-width:600px){.search-row{align-items:stretch}.filter-toggle{min-width:54px;justify-content:center;padding:.5rem}.filter-toggle>span{display:none}.filter-grid{grid-template-columns:1fr}.filters{padding:1rem}.filter-actions .btn{flex:1}}
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdvertisementsListComponent {
  readonly i18n = inject(TranslationService);
  private readonly api = inject(AdvertisementsService);
  private readonly locations = inject(LocationsService);
  readonly query = signal('');
  readonly searching = signal(false);
  readonly items = signal<Advertisement[]>([]);
  readonly filtersOpen = signal(false);
  readonly governorates = signal<LocationOption[]>([]);
  readonly cities = signal<LocationOption[]>([]);
  readonly appliedFilters = signal<FilterForm>({ ...EMPTY_FILTERS });
  draft: FilterForm = { ...EMPTY_FILTERS };
  readonly propertyTypes = [
    ['Apartment', 'propertyApartment'], ['House', 'propertyHouse'], ['CommercialStore', 'propertyCommercialStore'],
    ['Office', 'propertyOffice'], ['chalet', 'propertyChalet'], ['Warehouse', 'propertyWarehouse'], ['Land', 'propertyLand'],
    ['Villa', 'propertyVilla'], ['Duplex', 'propertyDuplex'],
  ].map(([value, key]) => ({ value, key }));

  constructor() {
    inject(SeoService).update('العقارات', 'ابحث في عقارات البيع والإيجار على كيميت.', '/properties');
    this.locations.getGovernorates().subscribe({ next: value => this.governorates.set(value), error: () => {} });
    combineLatest([
      toObservable(this.query).pipe(map(value => value.trim()), debounceTime(450), distinctUntilChanged(), filter(value => !value || value.length >= 2)),
      toObservable(this.appliedFilters),
    ]).pipe(
      switchMap(([search, selected]) => {
        this.searching.set(true);
        const filters: AdvertisementFilters = {
          pageSize: 20, search, governorateId: selected.governorateId ?? undefined,
          cityId: selected.cityId ?? undefined,
          bedrooms: selected.bedrooms ?? undefined, bathrooms: selected.bathrooms ?? undefined,
          propertyType: selected.propertyType || undefined,
          advertisementType: selected.advertisementType || undefined,
          publisherType: selected.publisherType || undefined, sort: selected.sort ?? undefined,
        };
        return this.api.getAll(filters).pipe(catchError(() => of({ data: [] } as any)));
      }),
      takeUntilDestroyed(inject(DestroyRef)),
    ).subscribe(result => { this.items.set(result.data ?? []); this.searching.set(false); });
  }

  governorateChanged(id: number | null) {
    this.draft.cityId = null;
    this.cities.set([]);
    if (id) this.locations.getCities(Number(id)).subscribe({ next: value => this.cities.set(value), error: () => {} });
  }

  applyFilters() {
    this.appliedFilters.set({ ...this.draft });
    this.filtersOpen.set(false);
  }

  resetFilters() {
    this.draft = { ...EMPTY_FILTERS };
    this.cities.set([]);
    this.appliedFilters.set({ ...EMPTY_FILTERS });
  }

  activeFilterCount() {
    const { governorateId: _governorateId, ...apiFilters } = this.appliedFilters();
    return Object.values(apiFilters).filter(value => value !== null && value !== '').length;
  }
}
