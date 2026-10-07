import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: 'search', renderMode: RenderMode.Client },
  { path: 'projects/:projectId/units/:unitId', renderMode: RenderMode.Server },
  { path: 'projects/:id', renderMode: RenderMode.Server },
  { path: 'properties/create', renderMode: RenderMode.Client },
  { path: 'properties/:id/edit', renderMode: RenderMode.Client },
  { path: 'properties/:id', renderMode: RenderMode.Server },
  { path: 'advertisers/:id', renderMode: RenderMode.Server },
  { path: 'developers/:id', renderMode: RenderMode.Server },
  { path: 'profile', renderMode: RenderMode.Client },
  { path: 'favorites', renderMode: RenderMode.Client },
  { path: '**', renderMode: RenderMode.Prerender },
];
