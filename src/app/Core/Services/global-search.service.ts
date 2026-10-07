import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, shareReplay, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { GlobalSearchItemType, GlobalSearchResponse } from '../Models/api.models';

export interface GlobalSearchOptions {
  query: string;
  pageIndex?: number;
  pageSize?: number;
  type?: GlobalSearchItemType;
}

interface CacheEntry {
  expiresAt: number;
  request: Observable<GlobalSearchResponse>;
}

@Injectable({ providedIn: 'root' })
export class GlobalSearchService {
  private readonly http = inject(HttpClient);
  private readonly cache = new Map<string, CacheEntry>();
  private readonly cacheDuration = 30_000;

  search(options: GlobalSearchOptions): Observable<GlobalSearchResponse> {
    const normalizedQuery = options.query.trim().replace(/\s+/g, ' ');
    let params = new HttpParams()
      .set('q', normalizedQuery)
      .set('pageIndex', options.pageIndex ?? 1)
      .set('pageSize', options.pageSize ?? 12);

    if (options.type) params = params.set('type', options.type);

    const key = params.toString().toLowerCase();
    const cached = this.cache.get(key);
    if (cached && cached.expiresAt > Date.now()) return cached.request;
    if (cached) this.cache.delete(key);

    const request = this.http
      .get<GlobalSearchResponse>(`${environment.apiUrl}/Search`, { params })
      .pipe(
        catchError(error => {
          this.cache.delete(key);
          return throwError(() => error);
        }),
        shareReplay({ bufferSize: 1, refCount: false }),
      );

    if (this.cache.size >= 40) this.cache.delete(this.cache.keys().next().value!);
    this.cache.set(key, { request, expiresAt: Date.now() + this.cacheDuration });
    return request;
  }
}
