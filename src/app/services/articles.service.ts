import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Article } from '../interfaces/article.interface';

@Injectable({ providedIn: 'root' })
export class ArticlesService {
  private apiUrl = `${environment.apiUrl}/articles`;

  constructor(private http: HttpClient) {}

  findAll(): Observable<Article[]> {
    return this.http.get<Article[]>(this.apiUrl);
  }

  findOne(id: string): Observable<Article> {
    return this.http.get<Article>(`${this.apiUrl}/${id}`);
  }

  create(data: FormData): Observable<Article> {
    return this.http.post<Article>(this.apiUrl, data);
  }

  update(id: string, data: FormData | Partial<{ title: string; caption: string }>): Observable<Article> {
    return this.http.patch<Article>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
