import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NotificationService } from '../../../Core/Services/notification.service';

@Component({
  selector: 'app-toast',
  template: `
    <div class="toast-stack" aria-live="polite">
      @for (notice of service.notices(); track notice.id) {
        <div [class]="'toast ' + notice.type" role="status">
          <span class="toast-icon" aria-hidden="true">
            {{ notice.type === 'success' ? '✓' : notice.type === 'error' ? '!' : 'i' }}
          </span>
          <span class="toast-message">{{ notice.message }}</span>
          <button (click)="service.remove(notice.id)" aria-label="إغلاق">×</button>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastComponent {
  readonly service = inject(NotificationService);
}
