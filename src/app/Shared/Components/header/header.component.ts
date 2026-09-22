import { ChangeDetectionStrategy, Component, HostListener, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../Core/Services/auth.service';
import { TranslationService } from '../../../Core/I18n/translation.service';
import { TranslatePipe } from '../../Pipes/translate.pipe';
@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, TranslatePipe],
  templateUrl: './header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  readonly auth = inject(AuthService);
  readonly i18n = inject(TranslationService);
  private router = inject(Router);
  readonly open = signal(false);
  readonly logoutConfirmationOpen = signal(false);
  toggle() {
    this.open.update((v) => !v);
  }
  close() {
    this.open.set(false);
  }
  requestLogout() {
    this.close();
    this.logoutConfirmationOpen.set(true);
  }
  cancelLogout() {
    this.logoutConfirmationOpen.set(false);
  }
  confirmLogout() {
    this.logoutConfirmationOpen.set(false);
    this.auth.logout().subscribe({
      next: () => void this.router.navigateByUrl('/auth/login', { replaceUrl: true }),
      error: () => void this.router.navigateByUrl('/auth/login', { replaceUrl: true }),
    });
  }
  @HostListener('document:keydown.escape') onEscape() {
    this.cancelLogout();
  }
}
