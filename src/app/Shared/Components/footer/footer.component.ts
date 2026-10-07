import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslationService } from '../../../Core/I18n/translation.service';
import { TranslatePipe } from '../../Pipes/translate.pipe';

@Component({
  selector: 'app-footer',
  imports: [RouterLink, TranslatePipe],
  template: `
    <footer class="site-footer">
      <div class="footer-glow" aria-hidden="true"></div>
      <div class="container">
        <div class="footer-grid">
          <div class="footer-about">
            <a class="footer-brand" routerLink="/" aria-label="Kemet">
              <img src="assets/brand/kemit-logo-128.png" width="64" height="64" alt="">
              <span><strong>{{ text('كيميت', 'Kemet') }}</strong><small>{{ text('عقارك أقرب', 'Your property, closer') }}</small></span>
            </a>
            <p>{{ 'footerText' | t }}</p>
            <div class="trust-note"><span>✓</span><div><strong>{{ text('منصة عقارية موثوقة', 'A trusted property platform') }}</strong><small>{{ text('تجربة آمنة وواضحة للباحثين والمعلنين', 'A clear, secure experience for seekers and advertisers') }}</small></div></div>
          </div>
          <nav aria-label="Explore">
            <h3>{{ 'explore' | t }}</h3>
            <a routerLink="/">{{ text('الرئيسية', 'Home') }}</a>
            <a routerLink="/properties">{{ 'properties' | t }}</a>
            <a routerLink="/projects">{{ 'projects' | t }}</a>
            <a routerLink="/search">{{ text('البحث', 'Search') }}</a>
          </nav>
          <nav aria-label="Account">
            <h3>{{ 'yourAccount' | t }}</h3>
            <a routerLink="/profile">{{ text('الملف الشخصي', 'Profile') }}</a>
            <a routerLink="/favorites">{{ text('المفضلة', 'Favorites') }}</a>
            <a routerLink="/properties/create">{{ 'addListing' | t }}</a>
            <a routerLink="/auth/login">{{ 'login' | t }}</a>
          </nav>
        </div>

        <div class="footer-bottom">
          <p>© {{ year }} Kemet. {{ text('جميع الحقوق محفوظة.', 'All rights reserved.') }}</p>
          <div>
            <a routerLink="/privacy">{{ text('سياسة الخصوصية', 'Privacy policy') }}</a>
            <span>•</span>
            <a routerLink="/terms">{{ text('الشروط والأحكام', 'Terms & conditions') }}</a>
            <span>•</span>
            <a class="whatsapp-link" href="https://wa.me/201100060960" target="_blank" rel="noopener noreferrer"><span aria-hidden="true">✆</span>{{ text('تواصل معنا', 'Contact us') }}</a>
          </div>
        </div>
      </div>
    </footer>
  `,
  styleUrl: './footer.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterComponent {
  readonly year = new Date().getFullYear();
  private readonly i18n = inject(TranslationService);

  text(arabic: string, english: string) { return this.i18n.locale() === 'ar' ? arabic : english; }
}
