import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AdvertiserRatingSummary } from '../Models/api.models';

@Injectable({ providedIn: 'root' })
export class AdvertiserRatingsService {
  private readonly http = inject(HttpClient);

  getSummary(advertiserId: string) {
    return this.http.get<AdvertiserRatingSummary>(`${environment.apiUrl}/AdvertiserRatings/${encodeURIComponent(advertiserId)}`);
  }

  rate(advertiserId: string, score: number) {
    return this.http.put<AdvertiserRatingSummary>(
      `${environment.apiUrl}/AdvertiserRatings/${encodeURIComponent(advertiserId)}/mine`,
      { score },
    );
  }

  remove(advertiserId: string) {
    return this.http.delete<void>(`${environment.apiUrl}/AdvertiserRatings/${encodeURIComponent(advertiserId)}/mine`);
  }
}
