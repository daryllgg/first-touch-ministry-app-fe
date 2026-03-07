import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonMenuButton,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonList, IonItem, IonLabel, IonIcon, IonButton, IonSkeletonText, ViewWillEnter,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { megaphoneOutline, logOutOutline, newspaperOutline } from 'ionicons/icons';
import { AuthService } from '../services/auth.service';
import { ArticlesService } from '../services/articles.service';
import { Article } from '../interfaces/article.interface';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonMenuButton,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonList, IonItem, IonLabel, IonIcon, IonButton, IonSkeletonText,
  ],
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit, ViewWillEnter {
  isWeb = environment.platform === 'web';
  articles: Article[] = [];
  userName = '';
  isAdmin = false;
  isLoading = true;
  apiUrl = environment.apiUrl;
  activeSlide = 0;

  constructor(
    private authService: AuthService,
    private articlesService: ArticlesService,
    private router: Router,
  ) {
    addIcons({ megaphoneOutline, logOutOutline, newspaperOutline });
  }

  ngOnInit() {
    const user = this.authService.currentUser;
    if (user) {
      this.userName = `${user.firstName} ${user.lastName}`;
      this.isAdmin = this.authService.hasRole('ADMIN') || this.authService.hasRole('SUPER_ADMIN');
    }
    this.loadData();
  }

  ionViewWillEnter() {
    this.loadData();
  }

  getImageUrl(image: string): string {
    return `${this.apiUrl}/uploads/${image}`;
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

  private loadData() {
    this.isLoading = true;
    this.articlesService.findAll().subscribe({
      next: (data) => { this.articles = data; this.isLoading = false; },
      error: () => this.isLoading = false,
    });
  }
}
