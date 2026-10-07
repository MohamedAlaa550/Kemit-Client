import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { PaginatedResult, Unit } from '../Models/api.models';

export interface UnitFilters {
  pageIndex?: number;
  pageSize?: number;
  sort?: string;
  activityType?: string;
  type?: string;
  bedrooms?: number;
  paymentMethod?: string;
}

@Injectable({ providedIn: 'root' })
export class UnitsService {
  private readonly http = inject(HttpClient);

  getAll(projectId: number, filters: UnitFilters | number = {}) {
    const selected = typeof filters === 'number' ? { pageSize: filters } : filters;
    let params = new HttpParams();
    Object.entries(selected).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') params = params.set(key, String(value));
    });
    return this.http.get<PaginatedResult<Unit>>(`${environment.apiUrl}/Projects/${projectId}/units`, { params });
  }

  getById(projectId: number, unitId: number) {
    return this.http.get<Unit>(`${environment.apiUrl}/Projects/${projectId}/units/${unitId}`);
  }
}
