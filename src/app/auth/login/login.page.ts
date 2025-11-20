import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonInput } from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonTitle, IonToolbar,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonItem, IonLabel, IonButton, IonIcon, IonToggle
} from '@ionic/angular/standalone';
import { AuthService } from '../../services/auth.service';
import { Router, RouterLink } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { Storage } from '@ionic/storage-angular';

import { ResetPasswordPage } from '../reset-password/reset-password.page';
import { ModalController } from '@ionic/angular';


import { addIcons } from 'ionicons';
import { eyeOutline, eyeOffOutline } from 'ionicons/icons';

import { sendEmailVerification } from '@angular/fire/auth';
import { ActivityService } from '../../services/activity.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar,
    CommonModule, FormsModule, IonCard, IonCardHeader,
    IonCardTitle, IonCardContent, IonItem, IonLabel,
    IonButton, IonInput, IonIcon, RouterLink, IonToggle
  ]
})

export class LoginPage {
  email = '';
  password = '';

  rememberMe = false;

  showPassword = false;

  constructor(
    private auth: AuthService,
    private router: Router,
    private toast: ToastController,
    private storage: Storage,
    private modalCtrl: ModalController,
    private activity: ActivityService
  ) {
    addIcons({ eyeOutline, eyeOffOutline });
    this.loadRememberedUser();
  }

  goToRegister() {
    this.router.navigate(['/auth/register']);
  }

  // 🔍 Show / Hide Password
  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  // 🧠 Load saved login info
  async loadRememberedUser() {
    await this.storage.create();

    const saved = await this.storage.get('remember_me');
    if (saved) {
      this.rememberMe = true;
      this.email = saved.email;
      this.password = saved.password;
    }
  }

  // 💾 Save login info if toggle enabled
  async saveRememberMe() {
    if (this.rememberMe) {
      await this.storage.set('remember_me', {
        email: this.email,
        password: this.password
      });
    } else {
      await this.storage.remove('remember_me');
    }
  }


  // 🔑 LOGIN FUNCTION
  async login() {
    try {
      // FIRST: login user
      const credential = await this.auth.login(this.email, this.password);
      const user = credential.user;

      // Remember Me
      if (this.rememberMe) {
        await this.storage.set('remember_me', {
          email: this.email,
          password: this.password
        });
      }

      // Check email verification
      if (!user.emailVerified) {
        const t = await this.toast.create({
          message: 'Please verify your email before logging in.',
          color: 'warning',
          duration: 2000
        });
        t.present();
        return;
      }

      // ✅ NEW CODE: Log login activity (PUT THIS HERE)
      await this.activity.log('login', `User logged in`);

      // Navigate
      this.router.navigate(['/home']);

    } catch (err) {
      const t = await this.toast.create({
        message: 'Invalid login. Try again.',
        color: 'danger',
        duration: 2000
      });
      t.present();
    }
  }


  async openResetModal() {
    const modal = await this.modalCtrl.create({
      component: ResetPasswordPage
    });

    await modal.present();
  }

  ngOnInit() {
    this.auth.user$.subscribe(user => {
      if (user) {
        this.router.navigate(['/home'], { replaceUrl: true });
      }
    });
  }

}