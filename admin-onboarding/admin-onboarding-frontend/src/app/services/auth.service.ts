import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

const API = 'http://127.0.0.1:8092/api';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private http: HttpClient) {}

  login(email: string, password: string) {
    return this.http.post<any>(`${API}/auth/login`, { email, password });
  }

  changePassword(adminId: string, newPassword: string) {
    return this.http.post<any>(`${API}/auth/change-password`, { adminId, newPassword });
  }

  onboard(data: { name: string; email: string; tempPassword: string; onboardedBy: string }) {
    return this.http.post<any>(`${API}/onboard`, data);
  }

  getNotifications(email: string) {
    return this.http.get<any[]>(`${API}/auth/notifications?email=${email}`);
  }

  saveSession(data: any) {
    localStorage.setItem('onboarding_admin', JSON.stringify(data));
  }

  getSession() {
    const raw = localStorage.getItem('onboarding_admin');
    return raw ? JSON.parse(raw) : null;
  }

  clearSession() {
    localStorage.removeItem('onboarding_admin');
  }
}
