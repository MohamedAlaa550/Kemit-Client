import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HomeSliderImage } from '../Models/api.models';

@Injectable({ providedIn: 'root' })
export class HomeSliderService {
  private readonly http = inject(HttpClient);
  getAll() { return this.http.get<HomeSliderImage[]>(`${environment.apiUrl}/HomeSlider`); }
}
