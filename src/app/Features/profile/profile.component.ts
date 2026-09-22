import { DatePipe, DecimalPipe, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  PLATFORM_ID,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';
import { Advertisement } from '../../Core/Models/api.models';
import { AdvertisementsService } from '../../Core/Services/advertisements.service';
import { AuthService } from '../../Core/Services/auth.service';
import { NotificationService } from '../../Core/Services/notification.service';
import { SeoService } from '../../Core/Services/seo.service';
import { TranslationService } from '../../Core/I18n/translation.service';
import { TranslatePipe } from '../../Shared/Pipes/translate.pipe';

@Component({
  selector: 'app-profile',
  imports: [DecimalPipe, DatePipe, RouterLink, TranslatePipe],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent {
  readonly auth = inject(AuthService);
  private readonly adsService = inject(AdvertisementsService);
  private readonly notices = inject(NotificationService);
  private readonly platformId = inject(PLATFORM_ID);
  readonly i18n = inject(TranslationService);
  readonly ads = signal<Advertisement[]>([]);
  readonly loadingAds = signal(true);
  readonly totalAds = computed(() => this.ads().length);
  readonly pendingAds = computed(
    () => this.ads().filter((ad) => this.statusKey(ad.status) === 'pending').length,
  );
  readonly approvedAds = computed(() =>
    this.ads().filter((ad) => this.statusKey(ad.status) === 'approved'),
  );
  readonly rejectedAds = computed(
    () => this.ads().filter((ad) => this.statusKey(ad.status) === 'rejected').length,
  );
  readonly avatar = computed(() => {
    const url = this.auth.currentUser()?.avatarUrl?.trim();
    if (!url) return 'assets/brand/kemit-logo.jpeg';
    try {
      const path = /^https?:\/\//i.test(url) ? new URL(url).pathname : url;
      return `${environment.apiOrigin}/${path.replace(/^\//, '')}`;
    } catch {
      return 'assets/brand/kemit-logo.jpeg';
    }
  });

  avatarLoadFailed(event: Event) {
    const image = event.currentTarget as HTMLImageElement;
    image.onerror = null;
    image.src = 'assets/brand/kemit-logo.jpeg';
  }

  constructor() {
    inject(SeoService).update(
      'حسابي',
      'بياناتك وإعلاناتك وإشعارات المراجعة على كيميت.',
      '/profile',
    );
    this.auth.getCurrentUser().subscribe({ error: () => {} });
    this.adsService.getMine().subscribe({
      next: (ads) => {
        this.ads.set(ads);
        this.loadingAds.set(false);
        this.showNewApprovalToasts(ads);
      },
      error: () => this.loadingAds.set(false),
    });
  }

  statusKey(status: Advertisement['status']) {
    const value = String(status).toLowerCase();
    if (value === '0' || value === 'pending') return 'pending';
    if (value === '1' || value === 'approved') return 'approved';
    if (value === '2' || value === 'rejected') return 'rejected';
    return 'expired';
  }

  statusLabel(status: Advertisement['status']) {
    return this.i18n.translate(this.statusKey(status));
  }

  adImage(ad: Advertisement) {
    const path = ad.coverImage;
    return path
      ? path.startsWith('http')
        ? path
        : `${environment.apiOrigin}/${path.replace(/^\//, '')}`
      : 'assets/brand/kemit-logo.jpeg';
  }

  private showNewApprovalToasts(ads: Advertisement[]) {
    if (!isPlatformBrowser(this.platformId)) return;
    const storageKey = 'kemit_seen_approved_ads';
    const seen = new Set<string>(JSON.parse(localStorage.getItem(storageKey) ?? '[]'));
    let changed = false;
    for (const ad of ads.filter((item) => this.statusKey(item.status) === 'approved')) {
      const id = String(ad.id);
      if (!seen.has(id)) {
        this.notices.show(this.i18n.locale() === 'ar' ? `تهانينا! تمت الموافقة على إعلان «${ad.title}» وتم نشره بنجاح.` : `Congratulations! “${ad.title}” was approved and published.`, 'success', 5000);
        seen.add(id);
        changed = true;
      }
    }
    if (changed) localStorage.setItem(storageKey, JSON.stringify([...seen]));
  }
}
