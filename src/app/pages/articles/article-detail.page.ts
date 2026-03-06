import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
  IonBackButton, IonButtons, IonIcon, IonSkeletonText, ViewWillEnter,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowBackOutline } from 'ionicons/icons';
import { HttpClient } from '@angular/common/http';
import { ArticlesService } from '../../services/articles.service';
import { AuthService } from '../../services/auth.service';
import { ModalService } from '../../components/modal/modal.service';
import { Article } from '../../interfaces/article.interface';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-article-detail',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
    IonBackButton, IonButtons, IonIcon, IonSkeletonText,
  ],
  templateUrl: './article-detail.page.html',
  styleUrls: ['./article-detail.page.scss'],
})
export class ArticleDetailPage implements OnInit, ViewWillEnter {
  isWeb = environment.platform === 'web';
  article: Article | null = null;
  apiUrl = environment.apiUrl;
  isLoading = true;
  activeSlide = 0;

  // Comments + Likes
  comments: any[] = [];
  likeCount = 0;
  liked = false;
  newComment = '';
  currentUserId = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private articlesService: ArticlesService,
    private authService: AuthService,
    private modal: ModalService,
  ) {
    addIcons({ arrowBackOutline });
  }

  ngOnInit() {
    this.currentUserId = this.authService.currentUser?.id || '';
    this.loadArticle();
  }

  ionViewWillEnter() {
    this.currentUserId = this.authService.currentUser?.id || '';
    this.loadArticle();
  }

  private loadArticle() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.isLoading = true;
    this.articlesService.findOne(id).subscribe({
      next: (data) => {
        this.article = data;
        this.isLoading = false;
        this.loadComments();
        this.loadLikeStatus();
      },
      error: () => { this.isLoading = false; },
    });
  }

  getImageUrl(image: string): string {
    return `${this.apiUrl}/uploads/${image}`;
  }

  getAuthorAvatar(): string | null {
    if (!this.article?.author?.profilePicture) return null;
    return `${this.apiUrl}/uploads/${this.article.author.profilePicture}`;
  }

  getAuthorInitials(): string {
    if (!this.article?.author) return '';
    return (this.article.author.firstName?.charAt(0) || '') + (this.article.author.lastName?.charAt(0) || '');
  }

  onGalleryScroll(event: Event) {
    const el = event.target as HTMLElement;
    const slideWidth = el.clientWidth;
    if (slideWidth > 0) {
      this.activeSlide = Math.round(el.scrollLeft / slideWidth);
    }
  }

  goToSlide(index: number) {
    const gallery = document.querySelector('.gallery-container') as HTMLElement;
    if (gallery) {
      gallery.scrollTo({ left: index * gallery.clientWidth, behavior: 'smooth' });
    }
  }

  // ─── Comments ───

  loadComments() {
    if (!this.article) return;
    this.http.get<any[]>(`${this.apiUrl}/articles/${this.article.id}/comments`).subscribe(
      (data) => this.comments = data,
    );
  }

  addComment() {
    if (!this.newComment.trim() || !this.article) return;
    this.http.post(`${this.apiUrl}/articles/${this.article.id}/comments`, { content: this.newComment }).subscribe(() => {
      this.newComment = '';
      this.loadComments();
    });
  }

  async deleteComment(commentId: string) {
    const confirmed = await this.modal.confirm({
      title: 'Delete Comment',
      message: 'Are you sure you want to delete this comment?',
      confirmText: 'Delete',
      confirmColor: 'danger',
    });
    if (confirmed) {
      this.http.delete(`${this.apiUrl}/articles/comments/${commentId}`).subscribe(() => this.loadComments());
    }
  }

  // ─── Likes ───

  loadLikeStatus() {
    if (!this.article) return;
    this.http.get<any>(`${this.apiUrl}/articles/${this.article.id}/like-status`).subscribe((data) => {
      this.likeCount = data.count;
      this.liked = data.liked;
    });
  }

  toggleLike() {
    if (!this.article) return;
    this.http.post<any>(`${this.apiUrl}/articles/${this.article.id}/like`, {}).subscribe((data) => {
      this.liked = data.liked;
      this.loadLikeStatus();
    });
  }
}
