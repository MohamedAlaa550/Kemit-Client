import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';

export interface MyAdvertisementReport { hasReported: boolean; status: string | null; }

@Injectable({ providedIn: 'root' })
export class AdvertisementReportsService {
  private readonly http = inject(HttpClient);

  getMine(advertisementId: number) {
    return this.http.get<MyAdvertisementReport>(`${environment.apiUrl}/AdvertisementReports/${advertisementId}/mine`);
  }

  create(advertisementId: number, reason: string, details?: string) {
    return this.http.post<{ message: string }>(`${environment.apiUrl}/AdvertisementReports/${advertisementId}`, { reason, details });
  }
}
