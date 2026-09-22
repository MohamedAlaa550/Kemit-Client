import { Injectable, signal } from '@angular/core';

export interface Notice {
  id: number;
  type: 'success' | 'error' | 'info';
  message: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  readonly notices = signal<Notice[]>([]);
  private id = 0;

  show(message: string, type: Notice['type'] = 'info', duration = 5000) {
    if (this.notices().some((notice) => notice.message === message)) return;
    const id = ++this.id;
    this.notices.update((notices) => [...notices, { id, type, message }]);
    setTimeout(() => this.remove(id), duration);
  }

  remove(id: number) {
    this.notices.update((notices) => notices.filter((notice) => notice.id !== id));
  }
}
