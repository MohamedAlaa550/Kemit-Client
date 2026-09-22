import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, finalize, of, shareReplay, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiMessage, Favorite } from '../Models/api.models';

@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private readonly http = inject(HttpClient);
  private readonly favoriteIdsState = signal<ReadonlySet<number>>(new Set());
  private loadRequest?: Observable<Favorite[]>;
  private loaded = false;
  readonly favoriteIds = this.favoriteIdsState.asReadonly();

  getAll() {
    return this.http.get<Favorite[]>(`${environment.apiUrl}/Favorites`).pipe(
      tap(items => {
        this.favoriteIdsState.set(new Set(items.map(item => item.advertisementId)));
        this.loaded = true;
      }),
    );
  }

  ensureLoaded() {
    if (this.loaded) return of([] as Favorite[]);
    if (this.loadRequest) return this.loadRequest;
    this.loadRequest = this.getAll().pipe(
      finalize(() => this.loadRequest = undefined),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    return this.loadRequest;
  }

  isFavorite(advertisementId: number) {
    return this.favoriteIds().has(advertisementId);
  }

  add(advertisementId: number) {
    return this.http.post<ApiMessage>(`${environment.apiUrl}/Favorites/${advertisementId}`, {}).pipe(
      tap(() => this.updateId(advertisementId, true)),
    );
  }

  remove(advertisementId: number) {
    return this.http.delete<ApiMessage>(`${environment.apiUrl}/Favorites/${advertisementId}`).pipe(
      tap(() => this.updateId(advertisementId, false)),
    );
  }

  check(advertisementId: number) {
    return this.http.get<{ isFavorite: boolean }>(`${environment.apiUrl}/Favorites/check/${advertisementId}`).pipe(
      tap(result => this.updateId(advertisementId, result.isFavorite)),
    );
  }

  private updateId(advertisementId: number, favorite: boolean) {
    const ids = new Set(this.favoriteIds());
    favorite ? ids.add(advertisementId) : ids.delete(advertisementId);
    this.favoriteIdsState.set(ids);
  }
}
