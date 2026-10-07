import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Developer, Project } from '../../Core/Models/api.models';
import { DevelopersService } from '../../Core/Services/developers.service';
import { ProjectsService } from '../../Core/Services/projects.service';
import { SeoService } from '../../Core/Services/seo.service';
import { ListingCardComponent } from '../../Shared/Components/listing-card/listing-card.component';
import { TranslationService } from '../../Core/I18n/translation.service';

@Component({
  selector: 'app-developer-details',
  imports: [RouterLink, ListingCardComponent],
  template: `
    <section class="developer-page">
      <div class="container">
        @if (developer(); as item) {
          <nav class="breadcrumbs"><a routerLink="/projects">{{ text('المشروعات', 'Projects') }}</a><span>‹</span><span>{{ item.name }}</span></nav>
          <header class="developer-hero">
            <div class="identity"><img [src]="logo()" width="150" height="150" [alt]="item.name"><div><p class="eyebrow">{{ text('المطور العقاري', 'Real estate developer') }}</p><h1>{{ item.name }}</h1><span>{{ projects().length }} {{ text('مشروع على كيميت', 'projects on Kemet') }}</span></div></div>
            <div class="summary"><strong>{{ projects().length }}</strong><span>{{ text('مشروع عقاري', 'real estate projects') }}</span></div>
          </header>
          <section class="about"><p class="eyebrow">{{ text('عن المطور', 'About the developer') }}</p><h2>{{ text('نبذة عن', 'About') }} {{ item.name }}</h2><p>{{ item.description || text('لا توجد نبذة متاحة عن هذا المطور حاليًا.', 'No description is currently available for this developer.') }}</p></section>
          <section class="projects-section">
            <div class="section-heading"><div><p class="eyebrow">{{ text('مشروعات المطور', 'Developer projects') }}</p><h2>{{ text('مشروعات', 'Projects by') }} {{ item.name }}</h2></div><span>{{ projects().length }} {{ text('مشروع', 'projects') }}</span></div>
            @if (projects().length) { <div class="grid-cards">@for (project of projects(); track project.id) { <app-listing-card [item]="project"/> }</div> }
            @else { <div class="empty-state">{{ text('لا توجد مشروعات مضافة لهذا المطور حاليًا.', 'This developer has no projects yet.') }}</div> }
          </section>
        } @else if (loadFailed()) {
          <div class="error-state"><strong>{{ text('تعذر تحميل بيانات المطور', 'Could not load developer details') }}</strong><a routerLink="/projects">{{ text('العودة إلى المشروعات', 'Back to projects') }}</a></div>
        } @else { <div class="loading-state">{{ text('جاري تحميل بيانات المطور...', 'Loading developer details...') }}</div> }
      </div>
    </section>
  `,
  styles: [`
    .developer-page{min-height:100vh;padding:1.5rem 0 5rem;background:#f6f4ee;color:#19160f}.breadcrumbs{display:flex;gap:.5rem;margin-bottom:1rem;color:#777166;font-size:.78rem}.breadcrumbs a{color:#815c18;font-weight:800}.developer-hero{display:flex;align-items:center;justify-content:space-between;gap:2rem;padding:2.4rem;border:1px solid #d9d4c9;border-radius:22px;background:linear-gradient(135deg,#fff,#f4eddb);box-shadow:0 18px 50px #2d271b12}.identity{display:flex;align-items:center;gap:1.5rem}.identity img{width:150px;height:150px;flex:0 0 auto;padding:.8rem;border:1px solid #dfd5bd;border-radius:22px;background:#fff;object-fit:contain}.eyebrow{margin:0;color:#9a6e19;font-size:.72rem;font-weight:900;letter-spacing:.08em}.identity h1{margin:.35rem 0;font-size:clamp(2rem,5vw,3.6rem)}.identity span{color:#746e63}.summary{display:grid;min-width:145px;place-items:center;padding:1.3rem;border:1px solid #d7c89e;border-radius:16px;background:#fff}.summary strong{color:#9a6e19;font-size:2.2rem}.summary span{color:#746e63;font-size:.8rem}.about{max-width:900px;padding:3rem 0}.about h2{margin:.35rem 0 1rem;font-size:1.6rem}.about>p:last-child{color:#514d45;line-height:2;white-space:pre-line}.projects-section{padding-top:2rem;border-top:1px solid #d9d5cc}.section-heading{display:flex;align-items:end;justify-content:space-between;margin-bottom:1.5rem}.section-heading h2{margin:.3rem 0 0;font-size:1.7rem}.section-heading>span{padding:.35rem .75rem;border-radius:99px;background:#17140e;color:#f6d77e;font-size:.75rem;font-weight:800}.error-state,.loading-state{display:grid;max-width:560px;place-items:center;gap:1rem;margin:5rem auto;padding:2rem;border:1px solid #d9d4c9;border-radius:14px;background:#fff;text-align:center}.error-state a{padding:.55rem .8rem;border-radius:8px;background:#17140e;color:#f6d77e;font-weight:800}@media(max-width:700px){.developer-hero{align-items:flex-start;flex-direction:column;padding:1.4rem}.identity{align-items:flex-start;flex-direction:column}.identity img{width:110px;height:110px}.summary{width:100%}.section-heading{align-items:flex-start;gap:1rem;flex-direction:column}}
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeveloperDetailsComponent {
  private readonly id = Number(inject(ActivatedRoute).snapshot.paramMap.get('id'));
  private readonly i18n = inject(TranslationService);
  readonly developer = signal<Developer | null>(null);
  readonly projects = signal<Project[]>([]);
  readonly loadFailed = signal(false);
  readonly logo = computed(() => {
    const path = this.developer()?.logoUrl;
    return path ? (path.startsWith('http') ? path : `${environment.apiOrigin}/${path.replace(/^\//, '')}`) : 'assets/brand/kemit-logo-128.png';
  });

  constructor() {
    const seo = inject(SeoService);
    forkJoin({
      developer: inject(DevelopersService).getById(this.id),
      projects: inject(ProjectsService).getAll({ developerId: this.id, pageSize: 50 }),
    }).subscribe({
      next: result => {
        this.developer.set(result.developer);
        this.projects.set(result.projects.data);
        seo.updateLocalized(
          result.developer.name,
          result.developer.name,
          result.developer.description || `مشروعات ${result.developer.name}`,
          result.developer.description || `Projects by ${result.developer.name}`,
          `/developers/${this.id}`,
        );
      },
      error: () => this.loadFailed.set(true),
    });
  }

  text(arabic: string, english: string) { return this.i18n.locale() === 'ar' ? arabic : english; }
}
