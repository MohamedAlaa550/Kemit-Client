import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AdvertiserProfile } from '../Models/api.models';

@Injectable({ providedIn: 'root' })
export class AdvertisersService {
  private readonly http = inject(HttpClient);

  getById(id: string) {
    return this.http.get<AdvertiserProfile>(`${environment.apiUrl}/Advertisers/${encodeURIComponent(id)}`);
  }
}
