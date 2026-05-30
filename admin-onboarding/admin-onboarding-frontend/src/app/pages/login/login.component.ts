import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email = '';
  password = '';
  showPassword = false;
  loading = false;
  error = '';

  constructor(private auth: AuthService, private router: Router) {}

  togglePassword() { this.showPassword = !this.showPassword; }

  login() {
    if (!this.email || !this.password) { this.error = 'Email and password are required.'; return; }
    this.loading = true;
    this.error = '';
    this.auth.login(this.email, this.password).subscribe({
      next: (res) => {
        this.auth.saveSession(res);
        if (res.requiresPasswordChange) {
          this.router.navigate(['/change-password']);
        } else {
          window.location.href = 'http://localhost:5173';
        }
      },
      error: (err) => {
        this.error = err.error?.error || 'Login failed. Check your credentials.';
        this.loading = false;
      }
    });
  }
}
