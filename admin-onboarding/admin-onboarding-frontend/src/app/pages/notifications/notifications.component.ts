import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css']
})
export class NotificationsComponent implements OnInit {
  notifications: any[] = [];
  loading = true;
  error = '';
  adminName = '';
  adminEmail = '';

  typeIcon: Record<string, string> = {
    ONBOARDED: '🎉',
    LOGIN: '🔑',
    PASSWORD_CHANGED: '🔐'
  };

  typeLabel: Record<string, string> = {
    ONBOARDED: 'Onboarded',
    LOGIN: 'Login',
    PASSWORD_CHANGED: 'Password Changed'
  };

  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit() {
    const session = this.auth.getSession();
    if (!session) { this.router.navigate(['/login']); return; }
    this.adminName = session.name;
    this.adminEmail = session.email;
    this.loadNotifications();
  }

  loadNotifications() {
    this.auth.getNotifications(this.adminEmail).subscribe({
      next: (data) => { this.notifications = data; this.loading = false; },
      error: () => { this.error = 'Could not load notifications.'; this.loading = false; }
    });
  }

  formatDate(dt: string) {
    if (!dt) return '';
    return new Date(dt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  }

  goToDashboard() {
    window.location.href = 'http://localhost:5173';
  }
}
