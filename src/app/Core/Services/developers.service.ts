import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Developer, PaginatedResult } from '../Models/api.models';
import { Observable, shareReplay } from 'rxjs';
@Injectable({providedIn:'root'})
export class DevelopersService {
  private readonly http=inject(HttpClient);
  private readonly cache=new Map<string,Observable<PaginatedResult<Developer>>>();
  getAll(pageIndex=1,pageSize=50,sort=''){const key=`${pageIndex}:${pageSize}:${sort}`;const cached=this.cache.get(key);if(cached)return cached;let params=new HttpParams().set('PageIndex',pageIndex).set('PageSize',pageSize);if(sort)params=params.set('Sort',sort);const request=this.http.get<PaginatedResult<Developer>>(`${environment.apiUrl}/Developers`,{params}).pipe(shareReplay({bufferSize:1,refCount:false}));this.cache.set(key,request);return request;}
  getById(id:number){return this.http.get<Developer>(`${environment.apiUrl}/Developers/${id}`);}
}
