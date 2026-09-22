import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router } from '@angular/router';
import { LoadingService } from '../../../Core/Services/loading.service';

@Component({
  selector: 'app-loading',
  template: `
    @if (loading.visible()) {
      <div class="loading-overlay" role="status" aria-live="polite" aria-label="Loading">
        <div class="loading-content">
          <div class="logo-wrap">
            <span class="orbit" aria-hidden="true"></span>
            <img src="assets/brand/kemit-logo.jpeg" width="76" height="76" alt="" />
          </div>
          <strong>Loading<span class="dots" aria-hidden="true"><i>.</i><i>.</i><i>.</i></span></strong>
        </div>
      </div>
    }
  `,
  styles: [`
    .loading-overlay{position:fixed;z-index:250;inset:0;display:grid;place-items:center;background:rgba(5,5,5,.92);backdrop-filter:blur(7px);animation:fade-in .18s ease-out}
    .loading-content{display:grid;justify-items:center;gap:1rem}
    .logo-wrap{position:relative;width:98px;height:98px;display:grid;place-items:center}
    .logo-wrap img{width:76px;height:76px;border-radius:1.1rem;object-fit:cover;filter:drop-shadow(0 15px 35px rgba(227,184,79,.2));animation:logo-breathe 1.5s ease-in-out infinite}
    .orbit{position:absolute;inset:0;border:2px solid rgba(227,184,79,.14);border-top-color:var(--color-primary);border-radius:50%;animation:spin .85s linear infinite}
    strong{color:var(--gray-100);font-size:1rem;font-weight:700;letter-spacing:.08em}
    .dots i{font-style:normal;opacity:.2;animation:dot 1.1s ease-in-out infinite}.dots i:nth-child(2){animation-delay:.16s}.dots i:nth-child(3){animation-delay:.32s}
    @keyframes spin{to{transform:rotate(360deg)}}@keyframes fade-in{from{opacity:0}}@keyframes logo-breathe{50%{transform:scale(.94);opacity:.82}}@keyframes dot{50%{opacity:1}}
    @media(prefers-reduced-motion:reduce){.orbit,.logo-wrap img,.dots i{animation:none}}
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingComponent {
  readonly loading = inject(LoadingService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.router.events.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(event => {
      if (event instanceof NavigationStart) this.loading.start();
      if (event instanceof NavigationEnd || event instanceof NavigationCancel || event instanceof NavigationError) {
        this.loading.stop();
      }
    });
  }
}
