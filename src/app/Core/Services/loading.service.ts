import { Injectable, computed, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  private readonly requestCount = signal(0);
  private readonly visibleState = signal(false);
  private showTimer?: ReturnType<typeof setTimeout>;
  readonly active = computed(() => this.requestCount() > 0);
  readonly visible = this.visibleState.asReadonly();

  start() {
    this.requestCount.update(count => count + 1);
    if (this.requestCount() === 1) {
      this.showTimer = setTimeout(() => {
        if (this.requestCount() > 0) this.visibleState.set(true);
      }, 140);
    }
  }

  stop() {
    this.requestCount.update(count => Math.max(0, count - 1));
    if (this.requestCount() === 0) {
      clearTimeout(this.showTimer);
      this.visibleState.set(false);
    }
  }
}
