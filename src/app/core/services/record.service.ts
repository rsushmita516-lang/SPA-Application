import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RecordsQueryOptions, RecordsResponse } from '../../shared/models/record.model.js';

@Injectable({
  providedIn: 'root'
})
export class RecordService {
  private http = inject(HttpClient);

  /**
   * Fetches records matching filter, search, page and delay parameters
   */
  public getRecords(options: RecordsQueryOptions = {}): Observable<RecordsResponse> {
    let params = new HttpParams();

    if (options.delayMs !== undefined && options.delayMs !== null) {
      params = params.set('delayMs', options.delayMs.toString());
    }
    if (options.search) {
      params = params.set('search', options.search.trim());
    }
    if (options.status && options.status !== 'All') {
      params = params.set('status', options.status);
    }
    if (options.page) {
      params = params.set('page', options.page.toString());
    }
    if (options.limit) {
      params = params.set('limit', options.limit.toString());
    }

    return this.http.get<RecordsResponse>('/api/records', { params, withCredentials: true });
  }
}
