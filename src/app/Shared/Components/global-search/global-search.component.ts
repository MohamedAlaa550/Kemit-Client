import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { catchError, debounceTime, distinctUntilChanged, map, of, switchMap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { TranslationService } from '../../../Core/I18n/translation.service';
import { GlobalSearchItem, GlobalSearchResponse } from '../../../Core/Models/api.models';
import { GlobalSearchService } from '../../../Core/Services/global-search.service';
import { LocationNamePipe } from '../../Pipes/location-name.pipe';

const EMPTY_RESPONSE: GlobalSearchResponse = {
  query: '', pageIndex: 1, pageSize: 8, totalCount: 0, totalPages: 0, items: [],
};

@Component({
  selector: 'app-global-search',
  imports: [DecimalPipe, RouterLink, LocationNamePipe],
  template: `
    <div class="global-search" (focusin)="open.set(true)" (focusout)="onFocusOut($event)">
      <form class="search-form" role="search" (submit)="submitSearch($event)">
        <svg class="search-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>
        <label class="sr-only" for="global-search-input">{{ text('ابحث في كيميت', 'Search Kemet') }}</label>
        <input
          id="global-search-input"
          type="search"
          role="combobox"
          autocomplete="off"
          [placeholder]="text('ابحث عن إعلان، مشروع، وحدة أو منطقة…', 'Search listings, projects, units, or locations…')"
          [value]="query()"
          [attr.aria-expanded]="showPanel()"
          [attr.aria-controls]="showPanel() ? 'global-search-results' : null"
          [attr.aria-activedescendant]="activeIndex() >= 0 ? 'global-search-option-' + activeIndex() : null"
          (input)="updateQuery($any($event.target).value)"
          (keydown)="onKeydown($event)"
        >
        @if (loading()) { <span class="spinner" aria-hidden="true"></span> }
        @if (query()) {
          <button class="clear" type="button" (click)="clear()" [attr.aria-label]="text('مسح البحث', 'Clear search')">×</button>
        }
        <button class="submit" type="submit">{{ text('بحث', 'Search') }}</button>
      </form>

      @if (showPanel()) {
        <section class="results-panel" id="global-search-results" role="listbox" [attr.aria-label]="text('اقتراحات البحث', 'Search suggestions')">
          @if (loading()) {
            <div class="loading-results" role="status">
              @for (row of [1,2,3]; track row) { <span><i></i><b></b></span> }
            </div>
          } @else if (failed()) {
            <p class="state">{{ text('تعذر البحث الآن. حاول مرة أخرى.', 'Search is unavailable right now. Please try again.') }}</p>
          } @else if (response().items.length) {
            <div class="result-list">
              @for (item of response().items; track item.type + '-' + item.id; let index = $index) {
                <a
                  [id]="'global-search-option-' + index"
                  role="option"
                  [attr.aria-selected]="activeIndex() === index"
                  [class.active]="activeIndex() === index"
                  [routerLink]="itemLink(item)"
                  (mouseenter)="activeIndex.set(index)"
                  (click)="open.set(false)"
                >
                  <span class="thumb">
                    @if (item.imageUrl) { <img [src]="absoluteImage(item.imageUrl)" [alt]="item.title"> }
                    @else { <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20V9l8-6 8 6v11H4Z"/><path d="M9 20v-6h6v6"/></svg> }
                  </span>
                  <span class="result-copy"><small>{{ typeLabel(item.type) }}</small><strong>{{ item.title }}</strong><span>{{ item.subtitle | locationName }}</span></span>
                  <span class="result-meta">
                    @if (item.price) { <b>{{ item.price | number:'1.0-0' }} {{ text('جنيه', 'EGP') }}</b> }
                    @if (item.area) { <small>{{ item.area | number:'1.0-0' }} {{ text('م²', 'm²') }}</small> }
                  </span>
                </a>
              }
            </div>
            <a class="view-all" routerLink="/search" [queryParams]="{q: normalizedQuery()}" (click)="open.set(false)">
              <span>{{ text('عرض كل النتائج', 'View all results') }}</span><b>{{ response().totalCount }}</b>
            </a>
          } @else {
            <p class="state">{{ text('لا توجد نتائج مطابقة. جرّب اسم منطقة أو مشروع آخر.', 'No matching results. Try another location or project name.') }}</p>
          }
        </section>
      }
    </div>
  `,
  styles: [`
    :host{display:block;width:100%}.global-search{position:relative;width:min(900px,100%);margin-inline:auto}.search-form{position:relative;z-index:21;display:grid;grid-template-columns:auto minmax(0,1fr) auto auto;align-items:center;gap:.7rem;min-height:66px;padding:.45rem .55rem .45rem 1rem;border:1px solid #e3b84f70;border-radius:18px;background:#111;box-shadow:0 18px 60px #0008}.search-form:focus-within{border-color:var(--color-primary);box-shadow:0 0 0 4px #e3b84f18,0 18px 60px #0008}.search-icon{width:24px;height:24px;fill:none;stroke:var(--color-primary);stroke-width:1.8;stroke-linecap:round}.search-form input{width:100%;min-width:0;border:0;outline:0;background:transparent;color:#fff;font:inherit;font-size:.95rem}.search-form input::placeholder{color:#8e887d}.search-form input::-webkit-search-cancel-button{display:none}.submit{min-height:48px;padding:0 1.35rem;border:0;border-radius:12px;background:var(--color-primary);color:#111;font:inherit;font-weight:900;cursor:pointer}.submit:hover{filter:brightness(1.08)}.clear{display:grid;width:32px;height:32px;place-items:center;border:0;border-radius:50%;background:#ffffff0d;color:#aaa;font:inherit;font-size:1.25rem;cursor:pointer}.clear:hover{background:#ffffff18;color:#fff}.spinner{width:20px;height:20px;border:2px solid #ffffff20;border-top-color:var(--color-primary);border-radius:50%;animation:spin .7s linear infinite}.results-panel{position:absolute;z-index:20;top:calc(100% - 10px);inset-inline:0;overflow:hidden;padding-top:12px;border:1px solid #3d3525;border-radius:0 0 18px 18px;background:#101010;box-shadow:0 24px 65px #000c}.result-list{display:grid;max-height:430px;overflow:auto;padding:.45rem}.result-list>a{display:grid;grid-template-columns:56px minmax(0,1fr) auto;align-items:center;gap:.8rem;padding:.65rem;border-radius:11px;color:#fff}.result-list>a:hover,.result-list>a.active{background:#e3b84f12}.thumb{display:grid;width:56px;height:50px;overflow:hidden;place-items:center;border-radius:8px;background:#211c13}.thumb img{width:100%;height:100%;object-fit:cover}.thumb svg{width:25px;fill:none;stroke:#d6aa45;stroke-width:1.5}.result-copy{display:grid;min-width:0;gap:.1rem}.result-copy small{color:var(--color-primary);font-size:.62rem;font-weight:900}.result-copy strong,.result-copy span{overflow:hidden;white-space:nowrap;text-overflow:ellipsis}.result-copy strong{font-size:.83rem}.result-copy span{color:var(--color-muted);font-size:.68rem}.result-meta{display:grid;justify-items:end;gap:.15rem;padding-inline-start:.75rem}.result-meta b{color:#f3d176;font-size:.74rem;white-space:nowrap}.result-meta small{color:var(--color-muted);font-size:.65rem}.view-all{display:flex;align-items:center;justify-content:center;gap:.55rem;padding:.9rem;border-top:1px solid #2d281e;color:var(--color-primary);font-size:.78rem;font-weight:900}.view-all:hover{background:#e3b84f0c}.view-all b{display:grid;min-width:24px;height:24px;place-items:center;border-radius:99px;background:#e3b84f1c}.state{margin:0;padding:1.5rem;text-align:center;color:var(--color-muted);font-size:.8rem}.loading-results{display:grid;gap:.55rem;padding:.75rem}.loading-results span{display:grid;grid-template-columns:52px 1fr;gap:.8rem;align-items:center}.loading-results i,.loading-results b{display:block;border-radius:7px;background:linear-gradient(90deg,#191919,#29251d,#191919);background-size:200% 100%;animation:shimmer 1.2s infinite}.loading-results i{height:48px}.loading-results b{width:65%;height:14px}@keyframes spin{to{transform:rotate(360deg)}}@keyframes shimmer{to{background-position:-200% 0}}@media(max-width:600px){.search-form{grid-template-columns:auto minmax(0,1fr) auto;min-height:58px;border-radius:14px}.submit{display:none}.result-list>a{grid-template-columns:48px minmax(0,1fr)}.thumb{width:48px;height:45px}.result-meta{display:none}}
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GlobalSearchComponent {
  private readonly search = inject(GlobalSearchService);
  private readonly router = inject(Router);
  readonly i18n = inject(TranslationService);
  readonly query = signal('');
  readonly response = signal<GlobalSearchResponse>(EMPTY_RESPONSE);
  readonly loading = signal(false);
  readonly failed = signal(false);
  readonly open = signal(false);
  readonly activeIndex = signal(-1);
  readonly normalizedQuery = computed(() => this.query().trim().replace(/\s+/g, ' '));
  readonly showPanel = computed(() => this.open() && this.normalizedQuery().length >= 2);

  constructor() {
    toObservable(this.query).pipe(
      map(value => value.trim().replace(/\s+/g, ' ')),
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => {
        this.activeIndex.set(-1);
        this.failed.set(false);
        if (query.length < 2) {
          this.loading.set(false);
          return of(EMPTY_RESPONSE);
        }
        this.loading.set(true);
        return this.search.search({ query, pageSize: 8 }).pipe(
          catchError(() => {
            this.failed.set(true);
            return of({ ...EMPTY_RESPONSE, query });
          }),
        );
      }),
      takeUntilDestroyed(inject(DestroyRef)),
    ).subscribe(response => {
      this.response.set(response);
      this.loading.set(false);
    });
  }

  text(arabic: string, english: string) { return this.i18n.locale() === 'ar' ? arabic : english; }
  updateQuery(value: string) { this.query.set(value); this.open.set(true); }
  clear() { this.query.set(''); this.response.set(EMPTY_RESPONSE); this.activeIndex.set(-1); }

  submitSearch(event?: Event) {
    event?.preventDefault();
    const query = this.normalizedQuery();
    if (query.length < 2) return;
    this.open.set(false);
    void this.router.navigate(['/search'], { queryParams: { q: query } });
  }

  onKeydown(event: KeyboardEvent) {
    const lastIndex = this.response().items.length - 1;
    if (event.key === 'ArrowDown' && lastIndex >= 0) {
      event.preventDefault();
      this.activeIndex.update(index => index >= lastIndex ? 0 : index + 1);
    } else if (event.key === 'ArrowUp' && lastIndex >= 0) {
      event.preventDefault();
      this.activeIndex.update(index => index <= 0 ? lastIndex : index - 1);
    } else if (event.key === 'Escape') {
      this.open.set(false);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const selected = this.response().items[this.activeIndex()];
      if (selected) {
        this.open.set(false);
        void this.router.navigateByUrl(this.itemLink(selected));
      } else {
        this.submitSearch();
      }
    }
  }

  onFocusOut(event: FocusEvent) {
    const container = event.currentTarget as HTMLElement;
    if (!container.contains(event.relatedTarget as Node | null)) this.open.set(false);
  }

  itemLink(item: GlobalSearchItem): string {
    if (item.type === 'Advertisement') return `/properties/${item.id}`;
    if (item.type === 'Project') return `/projects/${item.id}`;
    return `/projects/${item.projectId}/units/${item.id}`;
  }

  typeLabel(type: GlobalSearchItem['type']) {
    if (type === 'Advertisement') return this.text('إعلان', 'Listing');
    if (type === 'Project') return this.text('مشروع', 'Project');
    return this.text('وحدة', 'Unit');
  }

  absoluteImage(path: string) {
    return path.startsWith('http') ? path : `${environment.apiOrigin}/${path.replace(/^\//, '')}`;
  }
}
