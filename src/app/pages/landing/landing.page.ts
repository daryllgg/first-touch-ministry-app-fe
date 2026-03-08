import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './landing.page.html',
  styleUrls: ['./landing.page.scss'],
})
export class LandingPage implements OnInit {
  isWeb = environment.platform === 'web';
  scrolled = false;
  mobileMenuOpen = false;
  currentYear = new Date().getFullYear();

  constructor(private router: Router, private authService: AuthService) {}

  async ngOnInit() {
    if (!this.isWeb) {
      this.router.navigate(['/login']);
      return;
    }
    // Redirect authenticated users to home
    const token = await this.authService.getToken();
    if (token) {
      this.router.navigate(['/home']);
    }
  }

  @HostListener('window:scroll')
  onScroll() {
    this.scrolled = window.scrollY > 50;
  }

  scrollTo(sectionId: string) {
    this.mobileMenuOpen = false;
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }
}
