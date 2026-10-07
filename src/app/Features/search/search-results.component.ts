import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, distinctUntilChanged, map, of, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TranslationService } from '../../Core/I18n/translation.service';
import { GlobalSearchItem, GlobalSearchItemType, GlobalSearchResponse } from '../../Core/Models/api.models';
import { GlobalSearchService } from '../../Core/Services/global-search.service';
import { SeoService } from '../../Core/Services/seo.service';
import { LocationNamePipe } from '../../Shared/Pipes/location-name.pipe';

const EMPTY_RESPONSE: GlobalSearchResponse = {
  query: '', pageIndex: 1, pageSize: 24, totalCount: 0, totalPages: 0, items: [],
};

@Component({
  selector: 'app-search-results',
  imports: [DecimalPipe, RouterLink, LocationNamePipe],
  template: `
    <section class="search-page">
      <div class="container">
        <header class="page-heading">
          <span>{{ text('بحث كيميت الموحّد', 'Kemet global search') }}</span>
          <h1>{{ text('كل النتائج في مكان واحد', 'Everything in one place') }}</h1>
          <p>{{ text('ابحث في الإعلانات والمشاريع والوحدات بأقل تحميل للبيانات.', 'Search listings, projects, and units with minimal data usage.') }}</p>
        </header>

        <form class="search-bar" role="search" (submit)="submit($event)">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>
          <label class="sr-only" for="results-search-input">{{ text('عبارة البحث', 'Search query') }}</label>
          <input id="results-search-input" type="search" autocomplete="off" [value]="draftQuery()" (input)="draftQuery.set($any($event.target).value)" [placeholder]="text('اسم عقار، مشروع، وحدة أو منطقة…', 'Property, project, unit, or location…')">
          <button type="submit">{{ text('بحث', 'Search') }}</button>
        </form>

        @if (query().length >= 2) {
          <div class="toolbar">
            <div class="types" [attr.aria-label]="text('تصفية نوع النتيجة', 'Filter result type')">
              <button type="button" [class.active]="!type()" (click)="setType()">{{ text('الكل', 'All') }}</button>
              <button type="button" [class.active]="type()==='Advertisement'" (click)="setType('Advertisement')">{{ text('الإعلانات', 'Listings') }}</button>
              <button type="button" [class.active]="type()==='Project'" (click)="setType('Project')">{{ text('المشاريع', 'Projects') }}</button>
              <button type="button" [class.active]="type()==='Unit'" (click)="setType('Unit')">{{ text('الوحدات', 'Units') }}</button>
            </div>
            @if (!loading() && !failed()) { <p><b>{{ response().totalCount }}</b> {{ text('نتيجة', 'results') }}</p> }
          </div>

          @if (loading()) {
            <div class="results-grid" aria-hidden="true">
              @for (row of [1,2,3,4,5,6]; track row) { <article class="skeleton"><i></i><span></span><span></span></article> }
            </div>
          } @else if (failed()) {
            <div class="empty"><strong>{{ text('تعذر تحميل النتائج', 'Could not load results') }}</strong><button type="button" (click)="reload()">{{ text('حاول مرة أخرى', 'Try again') }}</button></div>
          } @else if (response().items.length) {
            <div class="results-grid">
              @for (item of response().items; track item.type + '-' + item.id) {
                <a class="result-card" [routerLink]="itemLink(item)">
                  <div class="image">
                    @if (item.imageUrl) { <img [src]="absoluteImage(item.imageUrl)" [alt]="item.title"> }
                    @else { <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20V9l8-6 8 6v11H4Z"/><path d="M9 20v-6h6v6"/></svg> }
                    <span>{{ typeLabel(item.type) }}</span>
                  </div>
                  <div class="card-copy">
                    <small>{{ item.subtitle | locationName }}</small>
                    <h2>{{ item.title }}</h2>
                    <div>
                      @if (item.price) { <strong>{{ item.price | number:'1.0-0' }} {{ text('جنيه', 'EGP') }}</strong> }
                      @if (item.area) { <span>{{ item.area | number:'1.0-0' }} {{ text('م²', 'm²') }}</span> }
                    </div>
                  </div>
                </a>
              }
            </div>

            @if (response().totalPages > 1) {
              <nav class="pagination" [attr.aria-label]="text('صفحات النتائج', 'Result pages')">
                <button type="button" [disabled]="page() <= 1" (click)="goToPage(page()-1)">{{ text('السابق', 'Previous') }}</button>
                <span>{{ page() }} / {{ response().totalPages }}</span>
                <button type="button" [disabled]="page() >= response().totalPages" (click)="goToPage(page()+1)">{{ text('التالي', 'Next') }}</button>
              </nav>
            }
          } @else {
            <div class="empty"><strong>{{ text('لا توجد نتائج مطابقة', 'No matching results') }}</strong><p>{{ text('جرّب اسم منطقة أو مشروع آخر، أو اختر نوعًا مختلفًا.', 'Try another location or project, or choose a different type.') }}</p></div>
          }
        } @else {
          <div class="empty initial"><strong>{{ text('اكتب حرفين على الأقل لبدء البحث', 'Enter at least two characters to search') }}</strong><p>{{ text('يمكنك البحث باسم الإعلان أو المشروع أو الوحدة أو الموقع.', 'Search by listing, project, unit, or location name.') }}</p></div>
        }
      </div>
    </section>
  `,
  styles: [`
    .search-page{min-height:75vh;padding:3rem 0 5rem;background:radial-gradient(circle at 50% 0,#36270e3d,transparent 30%),#090909}.page-heading{text-align:center}.page-heading>span{color:var(--color-primary);font-size:.72rem;font-weight:900}.page-heading h1{margin:.35rem 0;font-size:clamp(2rem,5vw,3.8rem)}.page-heading p{margin:.3rem 0;color:var(--color-muted)}.search-bar{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:.75rem;width:min(880px,100%);margin:2rem auto;padding:.5rem .55rem .5rem 1rem;border:1px solid #e3b84f66;border-radius:17px;background:#111;box-shadow:0 18px 50px #0007}.search-bar:focus-within{border-color:var(--color-primary);box-shadow:0 0 0 4px #e3b84f18}.search-bar svg{width:24px;fill:none;stroke:var(--color-primary);stroke-width:1.8}.search-bar input{min-width:0;min-height:50px;border:0;outline:0;background:transparent;color:#fff;font:inherit}.search-bar button{min-height:48px;padding:0 1.4rem;border:0;border-radius:11px;background:var(--color-primary);color:#111;font:inherit;font-weight:900;cursor:pointer}.toolbar{display:flex;align-items:center;justify-content:space-between;gap:1rem;margin:2rem 0 1.25rem}.toolbar p{margin:0;color:var(--color-muted);font-size:.78rem;white-space:nowrap}.toolbar p b{color:var(--color-primary)}.types{display:flex;flex-wrap:wrap;gap:.45rem}.types button{padding:.52rem .9rem;border:1px solid var(--color-border);border-radius:99px;background:#111;color:var(--gray-300);font:inherit;font-size:.73rem;font-weight:800;cursor:pointer}.types button:hover,.types button.active{border-color:var(--color-primary);background:var(--color-primary);color:#111}.results-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1rem}.result-card{overflow:hidden;border:1px solid var(--color-border);border-radius:15px;background:#111;color:#fff;transition:.2s}.result-card:hover{border-color:#e3b84f85;transform:translateY(-3px);box-shadow:0 18px 40px #0008}.image{position:relative;height:180px;overflow:hidden;background:#211c13}.image img{width:100%;height:100%;object-fit:cover;transition:transform .35s}.result-card:hover img{transform:scale(1.035)}.image>svg{position:absolute;width:55px;top:50%;left:50%;fill:none;stroke:#d6aa45;stroke-width:1.2;transform:translate(-50%,-50%)}.image>span{position:absolute;inset-inline-start:.75rem;bottom:.7rem;padding:.3rem .55rem;border-radius:6px;background:#080808d9;color:var(--color-primary);font-size:.62rem;font-weight:900}.card-copy{padding:1rem}.card-copy>small{display:block;overflow:hidden;color:var(--color-muted);font-size:.67rem;white-space:nowrap;text-overflow:ellipsis}.card-copy h2{overflow:hidden;margin:.25rem 0 .8rem;font-size:.95rem;line-height:1.6;white-space:nowrap;text-overflow:ellipsis}.card-copy>div{display:flex;align-items:center;justify-content:space-between;gap:.6rem}.card-copy strong{color:var(--color-primary);font-size:.86rem}.card-copy span{color:var(--color-muted);font-size:.7rem}.pagination{display:flex;align-items:center;justify-content:center;gap:1rem;margin-top:2rem}.pagination button{padding:.6rem 1rem;border:1px solid var(--color-border);border-radius:8px;background:#111;color:#fff;font:inherit;cursor:pointer}.pagination button:hover:not(:disabled){border-color:var(--color-primary);color:var(--color-primary)}.pagination button:disabled{cursor:not-allowed;opacity:.35}.pagination span{color:var(--color-muted);font-size:.8rem}.empty{display:grid;place-items:center;gap:.6rem;min-height:230px;padding:2rem;border:1px dashed #3c3527;border-radius:16px;text-align:center;color:var(--color-muted)}.empty strong{color:#fff;font-size:1.05rem}.empty p{margin:0}.empty button{padding:.6rem 1rem;border:0;border-radius:8px;background:var(--color-primary);color:#111;font:inherit;font-weight:900;cursor:pointer}.initial{margin-top:2rem}.skeleton{height:280px;overflow:hidden;border-radius:15px;background:#111}.skeleton i,.skeleton span{display:block;background:linear-gradient(90deg,#171717,#29251d,#171717);background-size:200% 100%;animation:shimmer 1.2s infinite}.skeleton i{height:180px}.skeleton span{width:75%;height:13px;margin:1rem}.skeleton span:last-child{width:45%}@keyframes shimmer{to{background-position:-200% 0}}.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap}@media(max-width:850px){.results-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:580px){.search-page{padding-top:2rem}.page-heading h1{font-size:2rem}.search-bar{grid-template-columns:auto minmax(0,1fr);border-radius:14px}.search-bar button{display:none}.toolbar{align-items:flex-start;flex-direction:column}.types{width:100%}.types button{flex:1}.results-grid{grid-template-columns:1fr}.image{height:200px}}
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchResultsComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly search = inject(GlobalSearchService);
  private readonly seo = inject(SeoService);
  readonly i18n = inject(TranslationService);
  readonly query = signal('');
  readonly draftQuery = signal('');
  readonly type = signal<GlobalSearchItemType | undefined>(undefined);
  readonly page = signal(1);
  readonly response = signal<GlobalSearchResponse>(EMPTY_RESPONSE);
  readonly loading = signal(false);
  readonly failed = signal(false);

  constructor() {
    this.route.queryParamMap.pipe(
      map(params => {
        const query = (params.get('q') ?? '').trim().replace(/\s+/g, ' ');
        const rawType = params.get('type');
        const type: GlobalSearchItemType | undefined = rawType === 'Advertisement' || rawType === 'Project' || rawType === 'Unit' ? rawType : undefined;
        const page = Math.max(1, Number(params.get('page')) || 1);
        return { query, type, page };
      }),
      distinctUntilChanged((a, b) => a.query === b.query && a.type === b.type && a.page === b.page),
      switchMap(({ query, type, page }) => {
        this.query.set(query);
        this.draftQuery.set(query);
        this.type.set(type);
        this.page.set(page);
        this.failed.set(false);
        this.seo.updateLocalized(
          query ? `نتائج البحث عن ${query}` : 'البحث',
          query ? `Search results for ${query}` : 'Search',
          'ابحث في إعلانات ومشاريع ووحدات كيميت.',
          'Search Kemet listings, projects, and units.',
          '/search',
        );
        if (query.length < 2) {
          this.loading.set(false);
          return of(EMPTY_RESPONSE);
        }
        this.loading.set(true);
        return this.search.search({ query, type, pageIndex: page, pageSize: 24 }).pipe(
          catchError(() => {
            this.failed.set(true);
            return of({ ...EMPTY_RESPONSE, query, pageIndex: page });
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

  submit(event: Event) {
    event.preventDefault();
    const query = this.draftQuery().trim().replace(/\s+/g, ' ');
    if (query.length < 2) return;
    void this.router.navigate(['/search'], { queryParams: { q: query, type: this.type() } });
  }

  setType(type?: GlobalSearchItemType) {
    void this.router.navigate(['/search'], { queryParams: { q: this.query(), type: type ?? null, page: null } });
  }

  goToPage(page: number) {
    void this.router.navigate(['/search'], { queryParams: { q: this.query(), type: this.type(), page } }).then(() => {
      if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  reload() {
    this.loading.set(true);
    this.search.search({ query: this.query(), type: this.type(), pageIndex: this.page(), pageSize: 24 }).subscribe({
      next: response => { this.response.set(response); this.failed.set(false); this.loading.set(false); },
      error: () => { this.failed.set(true); this.loading.set(false); },
    });
  }

  itemLink(item: GlobalSearchItem): string {
    if (item.type === 'Advertisement') return `/properties/${item.id}`;
    if (item.type === 'Project') return `/projects/${item.id}`;
    return `/projects/${item.projectId}/units/${item.id}`;
  }

  typeLabel(type: GlobalSearchItemType) {
    if (type === 'Advertisement') return this.text('إعلان', 'Listing');
    if (type === 'Project') return this.text('مشروع', 'Project');
    return this.text('وحدة', 'Unit');
  }

  absoluteImage(path: string) {
    return path.startsWith('http') ? path : `${environment.apiOrigin}/${path.replace(/^\//, '')}`;
  }
}
