import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Advertisement, AdvertisementDetails, PaginatedResult } from '../Models/api.models';
import { Observable, shareReplay, tap } from 'rxjs';

export interface AdvertisementFilters {
  pageIndex?: number;
  pageSize?: number;
  search?: string;
  governorateId?: number;
  cityId?: number;
  bedrooms?: number;
  bathrooms?: number;
  propertyType?: string | number;
  advertisementType?: string | number;
  publisherType?: string | number;
  sort?: string | number;
}

@Injectable({ providedIn: 'root' })
export class AdvertisementsService {
  private readonly http = inject(HttpClient);
  private readonly listCache = new Map<string, Observable<PaginatedResult<Advertisement>>>();

  getAll(filters: AdvertisementFilters = {}) {
    const key = JSON.stringify(filters);
    const cached = this.listCache.get(key);
    if (cached) return cached;
    const request = this.http.get<PaginatedResult<Advertisement>>(`${environment.apiUrl}/Advertisements/all-Ads`, {
      params: this.toParams(filters),
    }).pipe(shareReplay({ bufferSize: 1, refCount: false }));
    if (this.listCache.size >= 20) this.listCache.delete(this.listCache.keys().next().value!);
    this.listCache.set(key, request);
    return request;
  }

  getById(id: number) {
    return this.http.get<AdvertisementDetails>(`${environment.apiUrl}/Advertisements/${id}`);
  }

  getMine() {
    return this.http.get<Advertisement[]>(`${environment.apiUrl}/Advertisements/my-ads`);
  }

  create(formData: FormData) {
    return this.http.post<{ message: string; adertisementId: number }>(`${environment.apiUrl}/Advertisements/create`, formData).pipe(tap(() => this.listCache.clear()));
  }

  update(id: number, formData: FormData) {
    return this.http.put<{ message: string }>(`${environment.apiUrl}/Advertisements/${id}`, formData).pipe(tap(() => this.listCache.clear()));
  }

  delete(id: number) {
    return this.http.delete<{ message: string }>(`${environment.apiUrl}/Advertisements/${id}`).pipe(tap(() => this.listCache.clear()));
  }

  private toParams(filters: AdvertisementFilters) {
    return Object.entries(filters).reduce((params, [key, value]) => {
      if (value === undefined || value === null || value === '') return params;
      return params.set(key[0].toUpperCase() + key.slice(1), String(value));
    }, new HttpParams());
  }
}
