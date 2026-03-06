import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
  IonBackButton, IonButtons, IonIcon, IonSkeletonText, IonFab, IonFabButton, ViewWillEnter,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, trashOutline, createOutline } from 'ionicons/icons';
import { ArticlesService } from '../../services/articles.service';
import { AuthService } from '../../services/auth.service';
import { Article } from '../../interfaces/article.interface';
import { ToastService } from '../../components/toast/toast.service';
import { ModalService } from '../../components/modal/modal.service';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { User } from '../../interfaces/user.interface';

@Component({
  selector: 'app-articles-manage',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
    IonBackButton, IonButtons, IonIcon, IonSkeletonText, IonFab, IonFabButton,
  ],
  templateUrl: './articles-manage.page.html',
  styleUrls: ['./articles-manage.page.scss'],
})
export class ArticlesManagePage implements OnInit, ViewWillEnter {
  isWeb = environment.platform === 'web';
  articles: Article[] = [];
  apiUrl = environment.apiUrl;
  isLoading = true;

  // Form state
  showForm = false;
  editingId: string | null = null;
  title = '';
  caption = '';
  selectedFiles: File[] = [];
  imagePreviewUrls: string[] = [];
  isSubmitting = false;

  // Preview
  showPreview = false;

  // Existing images (for edit mode)
  existingImages: string[] = [];
  removedImages: string[] = [];

  // @mention support
  allUsers: User[] = [];
  mentionedUserIds: string[] = [];
  mentionSearch = '';
  showMentionDropdown = false;
  mentionInsertIndex = 0;

  constructor(
    private articlesService: ArticlesService,
    private authService: AuthService,
    private http: HttpClient,
    private router: Router,
    private toast: ToastService,
    private modal: ModalService,
  ) {
    addIcons({ addOutline, trashOutline, createOutline });
  }

  ngOnInit() {
    this.loadArticles();
    this.loadUsers();
  }

  ionViewWillEnter() {
    this.loadArticles();
  }

  loadArticles() {
    this.isLoading = true;
    this.articlesService.findAll().subscribe({
      next: (data) => { this.articles = data; this.isLoading = false; },
      error: () => this.isLoading = false,
    });
  }

  loadUsers() {
    this.http.get<User[]>(`${this.apiUrl}/users`).subscribe({
      next: (users) => this.allUsers = users,
    });
  }

  getImageUrl(image: string): string {
    return `${this.apiUrl}/uploads/${image}`;
  }

  getExistingImageUrl(image: string): string {
    return `${this.apiUrl}/uploads/${image}`;
  }

  openNewForm() {
    this.showForm = true;
    this.editingId = null;
    this.title = '';
    this.caption = '';
    this.selectedFiles = [];
    this.imagePreviewUrls = [];
    this.mentionedUserIds = [];
    this.existingImages = [];
    this.removedImages = [];
    this.showPreview = false;
  }

  openEditForm(article: Article) {
    this.showForm = true;
    this.editingId = article.id;
    this.title = article.title;
    this.caption = article.caption;
    this.selectedFiles = [];
    this.imagePreviewUrls = [];
    this.mentionedUserIds = article.mentionedUsers?.map(u => u.id) || [];
    this.existingImages = article.images ? [...article.images] : [];
    this.removedImages = [];
    this.showPreview = false;
  }

  cancelForm() {
    this.showForm = false;
    this.editingId = null;
  }

  onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const newFiles = Array.from(input.files);
      this.selectedFiles = [...this.selectedFiles, ...newFiles];
      for (const file of newFiles) {
        const reader = new FileReader();
        reader.onload = (e) => {
          this.imagePreviewUrls.push(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  }

  removeImage(index: number) {
    this.selectedFiles.splice(index, 1);
    this.imagePreviewUrls.splice(index, 1);
  }

  removeExistingImage(index: number) {
    const removed = this.existingImages.splice(index, 1);
    this.removedImages.push(...removed);
  }

  // Inline @mention helpers
  get filteredMentionUsers(): User[] {
    if (!this.mentionSearch) return [];
    const q = this.mentionSearch.toLowerCase();
    return this.allUsers
      .filter(u => !this.mentionedUserIds.includes(u.id))
      .filter(u => `${u.firstName} ${u.lastName}`.toLowerCase().includes(q))
      .slice(0, 5);
  }

  addMention(user: User) {
    if (!this.mentionedUserIds.includes(user.id)) {
      this.mentionedUserIds.push(user.id);
    }
    this.mentionSearch = '';
    this.showMentionDropdown = false;
  }

  removeMention(userId: string) {
    this.mentionedUserIds = this.mentionedUserIds.filter(id => id !== userId);
  }

  getMentionedUser(userId: string): User | undefined {
    return this.allUsers.find(u => u.id === userId);
  }

  onCaptionInput(event: Event) {
    const textarea = event.target as HTMLTextAreaElement;
    const val = textarea.value;
    const cursor = textarea.selectionStart;
    const beforeCursor = val.slice(0, cursor);
    const lastAt = beforeCursor.lastIndexOf('@');
    if (lastAt >= 0) {
      const afterAt = beforeCursor.slice(lastAt + 1);
      if (!afterAt.includes('\n') && afterAt.length <= 20) {
        this.mentionSearch = afterAt;
        this.showMentionDropdown = true;
        this.mentionInsertIndex = lastAt;
        return;
      }
    }
    this.showMentionDropdown = false;
  }

  selectInlineMention(user: User) {
    const before = this.caption.slice(0, this.mentionInsertIndex);
    const afterAtText = this.caption.slice(this.mentionInsertIndex).indexOf(' ');
    const restIndex = afterAtText === -1 ? this.caption.length : this.mentionInsertIndex + afterAtText;
    const after = this.caption.slice(restIndex);
    this.caption = `${before}@${user.firstName} ${user.lastName} ${after}`;
    if (!this.mentionedUserIds.includes(user.id)) {
      this.mentionedUserIds.push(user.id);
    }
    this.showMentionDropdown = false;
  }

  async saveDraft() {
    await this.submitArticle('DRAFT');
  }

  async publishArticle() {
    const confirmed = await this.modal.confirm({
      title: 'Publish Article',
      message: 'Are you sure you want to publish this article? It will be visible to everyone.',
      confirmText: 'Publish',
    });
    if (confirmed) {
      await this.submitArticle('PUBLISHED');
    }
  }

  private async submitArticle(status: string) {
    if (!this.title.trim() || !this.caption.trim()) {
      this.toast.warning('Title and caption are required.');
      return;
    }

    this.isSubmitting = true;

    const formData = new FormData();
    formData.append('title', this.title);
    formData.append('caption', this.caption);
    formData.append('status', status);
    if (this.mentionedUserIds.length > 0) {
      formData.append('mentionedUserIds', JSON.stringify(this.mentionedUserIds));
    }
    for (const file of this.selectedFiles) {
      formData.append('images', file);
    }

    if (this.editingId) {
      // Update
      if (this.removedImages.length > 0) {
        formData.append('removedImages', JSON.stringify(this.removedImages));
      }
      this.articlesService.update(this.editingId, formData).subscribe({
        next: () => {
          this.toast.success(status === 'DRAFT' ? 'Article saved as draft' : 'Article updated');
          this.showForm = false;
          this.editingId = null;
          this.isSubmitting = false;
          this.loadArticles();
        },
        error: () => { this.toast.error('Failed to update article'); this.isSubmitting = false; },
      });
    } else {
      // Create
      this.articlesService.create(formData).subscribe({
        next: () => {
          this.toast.success(status === 'DRAFT' ? 'Article saved as draft' : 'Article published');
          this.showForm = false;
          this.isSubmitting = false;
          this.loadArticles();
        },
        error: () => { this.toast.error('Failed to save article'); this.isSubmitting = false; },
      });
    }
  }

  // Keep old submitForm for mobile (optional fallback)
  async submitForm() {
    await this.submitArticle('PUBLISHED');
  }

  async deleteArticle(article: Article) {
    const confirmed = await this.modal.confirm({
      title: 'Delete Article',
      message: `Are you sure you want to delete "${article.title}"?`,
      confirmText: 'Delete',
      confirmColor: 'danger',
    });
    if (confirmed) {
      this.articlesService.delete(article.id).subscribe({
        next: () => {
          this.toast.success('Article deleted');
          this.loadArticles();
        },
        error: () => this.toast.error('Failed to delete article'),
      });
    }
  }
}
