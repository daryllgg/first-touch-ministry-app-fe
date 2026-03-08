import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Feedback, FeedbackReply } from '../interfaces/feedback.interface';

@Injectable({ providedIn: 'root' })
export class FeedbackService {
  private apiUrl = `${environment.apiUrl}/feedback`;

  constructor(private http: HttpClient) {}

  findAll(category?: string, status?: string): Observable<Feedback[]> {
    const params: any = {};
    if (category) params.category = category;
    if (status) params.status = status;
    return this.http.get<Feedback[]>(this.apiUrl, { params });
  }

  findOne(id: string): Observable<Feedback> {
    return this.http.get<Feedback>(`${this.apiUrl}/${id}`);
  }

  create(data: FormData): Observable<Feedback> {
    return this.http.post<Feedback>(this.apiUrl, data);
  }

  updateStatus(id: string, status: 'OPEN' | 'RESOLVED'): Observable<Feedback> {
    return this.http.patch<Feedback>(`${this.apiUrl}/${id}/status`, { status });
  }

  addReply(id: string, message: string): Observable<FeedbackReply> {
    return this.http.post<FeedbackReply>(`${this.apiUrl}/${id}/replies`, { message });
  }
}
