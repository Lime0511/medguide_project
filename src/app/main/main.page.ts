import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonMenu,
  IonList, IonItem, IonLabel, IonIcon, IonMenuButton,
  IonRouterOutlet, IonButtons, IonMenuToggle, IonSplitPane
} from '@ionic/angular/standalone';

import { settings, home, notifications } from 'ionicons/icons';
import { addIcons } from 'ionicons';
import {
  Router, RouterModule, RouterLink, RouterLinkActive,
  NavigationEnd
} from '@angular/router';

import { AuthService } from '../services/auth.service';
import { AlertController, MenuController } from '@ionic/angular';
import { homeOutline, alarmOutline, settingsOutline, logOutOutline } from 'ionicons/icons';
import { ActivityService } from '../services/activity.service';

@Component({
  selector: 'app-main',
  templateUrl: './main.page.html',
  styleUrls: ['./main.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    IonHeader, IonToolbar, IonContent, IonTitle, IonMenu,
    IonList, IonItem, IonLabel, IonIcon,
    IonRouterOutlet,
    IonSplitPane, RouterLink
  ],
})
export class MainPage {

  currentUser: any = null;

  constructor(
    private router: Router,
    private auth: AuthService,
    private alertCtrl: AlertController,
    private activity: ActivityService,
    private menu: MenuController

  ) {
    addIcons({
      settings, home, notifications, homeOutline,
      alarmOutline, settingsOutline, logOutOutline
    });

    // subscribe to auth user for avatar/name
    this.auth.user$.subscribe(user => (this.currentUser = user || null));
    this.autoCloseOnNavigation();

  }

  ngOnInit() {
  }

  isActive(path: string): boolean {
    return this.router.url.startsWith(path);
  }

  closeMenuOnMobile() {
    if (window.innerWidth < 992) {  // < 992px is mobile/tablet
      this.menu.close();
    }
  }

  // 🔴 Logout with confirmation
  async logout() {
    const alert = await this.alertCtrl.create({
      header: 'Logout',
      message: 'Are you sure you want to logout?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Logout',
          role: 'destructive',
          handler: async () => {
            await this.auth.logout();

            // FIXED — now passing 2 arguments
            await this.activity.log('User logout', 'User logged out from side menu');

            this.router.navigate(['/login']);
          }
        }
      ]
    });

    await alert.present();
  }

  autoCloseOnNavigation() {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.menu.close();     // 🔥 auto close menu on every route change
      }
    });
  }


}