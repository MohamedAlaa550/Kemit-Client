import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { PaginatedResult, Project } from '../Models/api.models';
import { Observable, shareReplay, tap } from 'rxjs';

export interface ProjectFilters {
  pageIndex?: number;
  pageSize?: number;
  sort?: string;
}

@Injectable({ providedIn: 'root' })
export class ProjectsService {
  private readonly http = inject(HttpClient);
  private readonly listCache = new Map<string, Observable<PaginatedResult<Project>>>();
  private readonly detailsCache = new Map<number, Observable<Project>>();

  getAll(filters: ProjectFilters = {}) {
    const key = JSON.stringify(filters);
    const cached = this.listCache.get(key);
    if (cached) return cached;
    const request = this.http.get<PaginatedResult<Project>>(`${environment.apiUrl}/Projects`, {
      params: this.toParams(filters),
    }).pipe(shareReplay({ bufferSize: 1, refCount: false }));
    this.listCache.set(key, request);
    return request;
  }

  getById(id: number) {
    const cached = this.detailsCache.get(id);
    if (cached) return cached;
    const request = this.http.get<Project>(`${environment.apiUrl}/Projects/${id}`).pipe(shareReplay({ bufferSize: 1, refCount: false }));
    this.detailsCache.set(id, request);
    return request;
  }

  create(formData: FormData) {
    return this.http.post<Project>(`${environment.apiUrl}/Projects`, formData).pipe(tap(() => this.clearCache()));
  }

  update(id: number, formData: FormData) {
    return this.http.put<Project>(`${environment.apiUrl}/Projects/${id}`, formData).pipe(tap(() => this.clearCache()));
  }

  delete(id: number) {
    return this.http.delete<{ message: string }>(`${environment.apiUrl}/Projects/${id}`).pipe(tap(() => this.clearCache()));
  }

  private clearCache() { this.listCache.clear(); this.detailsCache.clear(); }

  private toParams(filters: ProjectFilters) {
    let params = new HttpParams();
    if (filters.pageIndex) params = params.set('PageIndex', filters.pageIndex);
    if (filters.pageSize) params = params.set('PageSize', filters.pageSize);
    if (filters.sort) params = params.set('Sort', filters.sort);
    return params;
  }
}
