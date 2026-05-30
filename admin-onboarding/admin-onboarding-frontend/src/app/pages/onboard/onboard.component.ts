import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-onboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './onboard.component.html',
  styleUrls: ['./onboard.component.css']
})
export class OnboardComponent {
  name = '';
  email = '';
  tempPassword = '';
  onboardedBy = '';
  showTempPwd = false;
  loading = false;
  error = '';
  success: any = null;

  constructor(private auth: AuthService, private cdr: ChangeDetectorRef) {}

  generatePassword() {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
    this.tempPassword = Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }

  submit() {
    this.error = '';
    if (!this.name || !this.email || !this.tempPassword) {
      this.error = 'Name, email, and temporary password are required.'; return;
    }
    this.loading = true;
    this.auth.onboard({
      name: this.name,
      email: this.email,
      tempPassword: this.tempPassword,
      onboardedBy: this.onboardedBy || 'Organisation Onboarding Team'
    }).subscribe({
      next: (res) => {
        this.success = res;
        this.loading = false;
        this.name = ''; this.email = ''; this.tempPassword = ''; this.onboardedBy = '';
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = err.error?.error || 'Onboarding failed.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }
}
