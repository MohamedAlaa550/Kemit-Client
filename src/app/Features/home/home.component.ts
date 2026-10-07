import { afterNextRender, ChangeDetectionStrategy, Component, DestroyRef, ElementRef, inject, signal, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';
import { TranslationService } from '../../Core/I18n/translation.service';
import { Advertisement, Developer, Project } from '../../Core/Models/api.models';
import { AdvertisementsService } from '../../Core/Services/advertisements.service';
import { DevelopersService } from '../../Core/Services/developers.service';
import { HomeSliderService } from '../../Core/Services/home-slider.service';
import { ProjectsService } from '../../Core/Services/projects.service';
import { SeoService } from '../../Core/Services/seo.service';
import { ListingCardComponent } from '../../Shared/Components/listing-card/listing-card.component';
import { GlobalSearchComponent } from '../../Shared/Components/global-search/global-search.component';
import { TranslatePipe } from '../../Shared/Pipes/translate.pipe';

@Component({
  selector: 'app-home',
  imports: [RouterLink, ListingCardComponent, GlobalSearchComponent, TranslatePipe],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css', './home-developers-slider.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  @ViewChild('developersTrack') private developersTrack?: ElementRef<HTMLElement>;
  @ViewChild('advertisementsTrack') private advertisementsTrack?: ElementRef<HTMLElement>;
  @ViewChild('projectsTrack') private projectsTrack?: ElementRef<HTMLElement>;
  readonly i18n = inject(TranslationService);
  readonly projects = signal<Project[]>([]);
  readonly projectsLoading = signal(false);
  readonly activeProjectIndex = signal(0);
  readonly developers = signal<Developer[]>([]);
  readonly developersLoading = signal(false);
  readonly activeDeveloperIndex = signal(0);
  readonly ads = signal<Advertisement[]>([]);
  readonly advertisementsLoading = signal(false);
  readonly activeAdvertisementIndex = signal(0);
  readonly activeSlide = signal(0);
  readonly slides = signal([
    { src: 'assets/home/kemit-banner-investment.jpeg', altAr: 'كيميت، سوق عقاري موثوق', altEn: 'Kemet, a trusted real estate marketplace' },
    { src: 'assets/home/kemit-banner-cairo.jpeg', altAr: 'كيميت للعقارات في مصر', altEn: 'Kemet real estate in Egypt' },
  ]);

  private readonly advertisementsService = inject(AdvertisementsService);
  private readonly developersService = inject(DevelopersService);
  private readonly homeSliderService = inject(HomeSliderService);
  private readonly projectsService = inject(ProjectsService);
  private readonly destroyRef = inject(DestroyRef);
  private advertisementRequestId = 0;
  private developerNavigationLocked = false;
  private advertisementNavigationLocked = false;
  private projectNavigationLocked = false;

  constructor() {
    inject(SeoService).updateLocalized(
      'عقارات مصر',
      'Real estate in Egypt',
      'إعلانات بيع وإيجار ومشروعات عقارية موثوقة في مصر.',
      'Trusted property listings and real estate projects in Egypt.',
      '/',
    );

    // API requests start after the first browser render so they do not keep
    // SSR/prerender hydration pending and trigger Angular's task-stack warning.
    afterNextRender(() => {
      this.loadHomeData();
      const sliderTimer = window.setInterval(() => this.nextSlide(), 5000);
      this.destroyRef.onDestroy(() => window.clearInterval(sliderTimer));
    });
  }

  nextSlide(): void { const count = this.slides().length; if (count > 1) this.activeSlide.update(index => (index + 1) % count); }
  previousSlide(): void { const count = this.slides().length; if (count > 1) this.activeSlide.update(index => (index - 1 + count) % count); }
  goToSlide(index: number): void { this.activeSlide.set(index); }
  onSlideImageError(index: number): void {
    this.slides.update(slides => slides.filter((_, slideIndex) => slideIndex !== index));
    this.activeSlide.set(0);
  }
  scrollDevelopers(direction: -1 | 1): void {
    const track = this.developersTrack?.nativeElement;
    if (!track || !this.developers().length) return;
    const targetIndex = Math.max(0, Math.min(this.developers().length - 1, this.activeDeveloperIndex() + direction));
    this.developerNavigationLocked = true;
    this.activeDeveloperIndex.set(targetIndex);
    (track.children.item(targetIndex) as HTMLElement | null)?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: targetIndex === this.developers().length - 1 ? 'end' : targetIndex === 0 ? 'start' : 'center' });
    window.setTimeout(() => { this.developerNavigationLocked = false; this.activeDeveloperIndex.set(targetIndex); }, 500);
  }
  syncActiveDeveloper(): void {
    if (this.developerNavigationLocked) return;
    const track = this.developersTrack?.nativeElement;
    if (!track) return;
    const center = track.getBoundingClientRect().left + track.clientWidth / 2;
    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;
    Array.from(track.children).forEach((element, index) => {
      const rect = element.getBoundingClientRect();
      const distance = Math.abs(rect.left + rect.width / 2 - center);
      if (distance < closestDistance) { closestDistance = distance; closestIndex = index; }
    });
    this.activeDeveloperIndex.set(closestIndex);
  }
  scrollAdvertisements(direction: -1 | 1): void {
    const track = this.advertisementsTrack?.nativeElement;
    if (!track || !this.ads().length) return;
    const targetIndex = Math.max(0, Math.min(this.ads().length - 1, this.activeAdvertisementIndex() + direction));
    this.advertisementNavigationLocked = true;
    this.activeAdvertisementIndex.set(targetIndex);
    (track.children.item(targetIndex) as HTMLElement | null)?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: targetIndex === 0 ? 'start' : targetIndex === this.ads().length - 1 ? 'end' : 'center',
    });
    window.setTimeout(() => { this.advertisementNavigationLocked = false; }, 500);
  }
  syncActiveAdvertisement(): void {
    if (this.advertisementNavigationLocked) return;
    const track = this.advertisementsTrack?.nativeElement;
    if (!track) return;
    const center = track.getBoundingClientRect().left + track.clientWidth / 2;
    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;
    Array.from(track.children).forEach((element, index) => {
      const rect = element.getBoundingClientRect();
      const distance = Math.abs(rect.left + rect.width / 2 - center);
      if (distance < closestDistance) { closestDistance = distance; closestIndex = index; }
    });
    this.activeAdvertisementIndex.set(closestIndex);
  }
  scrollProjects(direction: -1 | 1): void {
    const track = this.projectsTrack?.nativeElement;
    if (!track || !this.projects().length) return;
    const targetIndex = Math.max(0, Math.min(this.projects().length - 1, this.activeProjectIndex() + direction));
    this.projectNavigationLocked = true;
    this.activeProjectIndex.set(targetIndex);
    (track.children.item(targetIndex) as HTMLElement | null)?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: targetIndex === 0 ? 'start' : targetIndex === this.projects().length - 1 ? 'end' : 'center',
    });
    window.setTimeout(() => { this.projectNavigationLocked = false; }, 500);
  }
  syncActiveProject(): void {
    if (this.projectNavigationLocked) return;
    const track = this.projectsTrack?.nativeElement;
    if (!track) return;
    const center = track.getBoundingClientRect().left + track.clientWidth / 2;
    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;
    Array.from(track.children).forEach((element, index) => {
      const rect = element.getBoundingClientRect();
      const distance = Math.abs(rect.left + rect.width / 2 - center);
      if (distance < closestDistance) { closestDistance = distance; closestIndex = index; }
    });
    this.activeProjectIndex.set(closestIndex);
  }
  developerLogo(developer: Developer): string {
    const path = developer.logoUrl;
    return path ? (path.startsWith('http') ? path : `${environment.apiOrigin}/${path.replace(/^\//, '')}`) : 'assets/brand/kemit-logo-128.png';
  }

  private loadHomeData(): void {
    this.loadHomeSlider();
    this.loadAdvertisements();
    this.developersLoading.set(true);
    this.loadDevelopers();
    this.projectsLoading.set(true);
    this.projectsService.getAll({ pageSize: 6 }).subscribe({
      next: (response) => { this.projects.set(response.data); this.projectsLoading.set(false); },
      error: () => { this.projects.set([]); this.projectsLoading.set(false); },
    });
  }

  private loadHomeSlider(): void {
      this.homeSliderService.getAll().subscribe({
        next: images => {
          this.activeSlide.set(0);
          this.slides.set(images.map(image => ({
          src: image.imageUrl.startsWith('http') ? image.imageUrl : `${environment.apiOrigin}/${image.imageUrl.replace(/^\//, '')}`,
          altAr: 'صورة من السلايدر الرئيسي لكيميت',
          altEn: 'Kemet featured banner',
        })));
      },
      error: () => {},
    });
  }

  private loadDevelopers(pageIndex = 1, collected: Developer[] = []): void {
    this.developersService.getAll(pageIndex, 50, 'nameasc').subscribe({
      next: response => {
        const allDevelopers = [...collected, ...response.data];
        if (allDevelopers.length < response.totalCount && response.data.length) {
          this.loadDevelopers(pageIndex + 1, allDevelopers);
          return;
        }
        this.developers.set(allDevelopers);
        const initialIndex = allDevelopers.length > 2 ? 2 : 0;
        this.activeDeveloperIndex.set(initialIndex);
        this.developersLoading.set(false);
        window.setTimeout(() => (this.developersTrack?.nativeElement.children.item(initialIndex) as HTMLElement | null)?.scrollIntoView({ block: 'nearest', inline: 'center' }));
      },
      error: () => { this.developers.set(collected); this.developersLoading.set(false); },
    });
  }

  private loadAdvertisements(): void {
    const requestId = ++this.advertisementRequestId;
    this.advertisementsLoading.set(true);
    this.activeAdvertisementIndex.set(0);
    this.advertisementsService.getAll({ pageSize: 6 }).subscribe({
      next: (response) => {
        if (requestId !== this.advertisementRequestId) return;
        this.ads.set(response.data);
        this.advertisementsLoading.set(false);
      },
      error: () => {
        if (requestId !== this.advertisementRequestId) return;
        this.ads.set([]);
        this.advertisementsLoading.set(false);
      },
    });
  }
}
