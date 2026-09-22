import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { LocationOption } from '../Models/api.models';
import { Observable, shareReplay } from 'rxjs';

export interface GeocodingResult {
  lat: string;
  lon: string;
}

@Injectable({ providedIn: 'root' })
export class LocationsService {
  private readonly http = inject(HttpClient);
  private readonly geocodingCache = new Map<string, Observable<GeocodingResult[]>>();

  getGovernorates() {
    return this.http.get<LocationOption[]>(`${environment.apiUrl}/Locations/governorates`);
  }

  getCities(governorateId: number) {
    return this.http.get<LocationOption[]>(`${environment.apiUrl}/Locations/governorates/${governorateId}/cities`);
  }

  geocode(place: string) {
    const query = `${place}, Egypt`;
    const cached = this.geocodingCache.get(query);
    if (cached) return cached;
    const request = this.http.get<GeocodingResult[]>('https://nominatim.openstreetmap.org/search', {
      params: new HttpParams()
        .set('q', query)
        .set('format', 'jsonv2')
        .set('limit', 1)
        .set('countrycodes', 'eg'),
    }).pipe(shareReplay({ bufferSize: 1, refCount: false }));
    this.geocodingCache.set(query, request);
    return request;
  }
}
