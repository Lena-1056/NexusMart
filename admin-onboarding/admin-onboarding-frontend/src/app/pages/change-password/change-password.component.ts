import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.css']
})
export class ChangePasswordComponent implements OnInit {
  newPassword = '';
  confirmPassword = '';
  showNew = false;
  showConfirm = false;
  loading = false;
  error = '';
  success = false;
  adminName = '';
  adminId = '';

  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit() {
    const session = this.auth.getSession();
    if (!session) { this.router.navigate(['/login']); return; }
    this.adminName = session.name;
    this.adminId = session.adminId;
  }

  confirm() {
    this.error = '';
    if (!this.newPassword || this.newPassword.length < 6) {
      this.error = 'Password must be at least 6 characters.'; return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.error = 'Passwords do not match.'; return;
    }
    this.loading = true;
    this.auth.changePassword(this.adminId, this.newPassword).subscribe({
      next: () => {
        this.success = true;
        this.loading = false;
        // Redirect to admin dashboard after 3s
        setTimeout(() => { window.location.href = 'http://localhost:5175'; }, 3000);
      },
      error: (err) => {
        this.error = err.error?.error || 'Failed to change password.';
        this.loading = false;
      }
    });
  }
}
