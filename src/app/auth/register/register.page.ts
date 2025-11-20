import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonTitle, IonToolbar,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonItem, IonLabel, IonButton, IonInput, IonIcon
} from '@ionic/angular/standalone';

import { AuthService } from '../../services/auth.service';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { ToastController } from '@ionic/angular';

import { addIcons } from 'ionicons';
import { eye, eyeOff } from 'ionicons/icons';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar,
    CommonModule, FormsModule, IonCard, IonCardHeader,
    IonCardTitle, IonCardContent, IonItem, IonLabel,
    IonButton, IonInput, IonIcon, RouterLink, RouterModule
  ]
})

export class RegisterPage {
  name = '';
  email = '';
  password = '';
  confirm = '';

  showPassword = false;
  showConfirm = false;

  passwordStrength = 0;       // 0–100
  strengthColor = '';

  constructor(
    private auth: AuthService,
    private router: Router,
    private toast: ToastController
  ) {
    addIcons({ eye, eyeOff });
  }

  ngOnInit() {
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirm() {
    this.showConfirm = !this.showConfirm;
  }

  // PASSWORD STRENGTH LOGIC
  ngOnChanges() {
    this.updatePasswordStrength();
  }

  updatePasswordStrength() {
    const pwd = this.password || '';
    let score = 0;

    if (pwd.length >= 6) score += 25;
    if (/[A-Z]/.test(pwd)) score += 25;
    if (/[0-9]/.test(pwd)) score += 25;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 25;

    this.passwordStrength = score;

    if (score < 40) this.strengthColor = 'weak';
    else if (score < 80) this.strengthColor = 'medium';
    else this.strengthColor = 'strong';
  }

  async register() {
    if (!this.name || !this.email || !this.password || !this.confirm) {
      return this.showToast('Please fill in all fields.', 'danger');
    }

    if (this.password !== this.confirm) {
      return this.showToast('Passwords do not match.', 'danger');
    }

    try {
      await this.auth.register(this.email, this.password, this.name);

      await this.showToast('Account created successfully!', 'success');
      this.router.navigate(['/auth/login']);

    } catch (err: any) {
      const msg = err?.message || 'Registration failed. Try again.';
      await this.showToast(msg, 'danger');
    }
  }

  async showToast(message: string, color: string) {
    const t = await this.toast.create({
      message,
      duration: 2000,
      color
    });
    t.present();
  }

}
