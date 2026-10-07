import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, effect, inject, signal } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { TranslationService } from '../I18n/translation.service';

interface LocalizedSeoContent {
  pageAr: string;
  pageEn: string;
  descriptionAr: string;
  descriptionEn: string;
  path: string;
}

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly i18n = inject(TranslationService);
  private readonly content = signal<LocalizedSeoContent | null>(null);

  constructor() {
    effect(() => {
      const content = this.content();
      const locale = this.i18n.locale();
      if (!content) return;
      this.apply(
        locale === 'ar' ? content.pageAr : content.pageEn,
        locale === 'ar' ? content.descriptionAr : content.descriptionEn,
        content.path,
        locale,
      );
    });
  }

  update(page: string, description: string, path = '/') {
    this.content.set({ pageAr: page, pageEn: page, descriptionAr: description, descriptionEn: description, path });
  }

  updateLocalized(pageAr: string, pageEn: string, descriptionAr: string, descriptionEn: string, path = '/') {
    this.content.set({ pageAr, pageEn, descriptionAr, descriptionEn, path });
  }

  private apply(page: string, description: string, path: string, locale: 'ar' | 'en') {
    const title = `${page} | ${locale === 'ar' ? 'كيميت' : 'Kemet'}`;
    this.title.setTitle(title);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:title', content: title });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    if (isPlatformBrowser(this.platformId)) {
      const link = this.document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
      if (link) link.href = new URL(path, this.document.baseURI).href;
    }
  }
}
