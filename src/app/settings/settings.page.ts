import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonMenuButton,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonToggle,
  IonSelect,
  IonSelectOption,
  IonButton,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonMenuButton,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonItem,
    IonLabel,
    IonToggle,
    IonSelect,
    IonSelectOption,
    IonButton,
  ],
})
export class SettingsPage implements OnInit {
  isDarkMode = false;
  selectedSound = 'default';

  // keys for localStorage
  private readonly DARK_KEY = 'medguide-dark-mode';
  private readonly SOUND_KEY = 'medguide-sound';

  ngOnInit(): void {
    this.loadThemePreference();
    this.loadNotificationSound();
  }

  // ============ DARK MODE ============

  onDarkModeToggle(ev: CustomEvent): void {
    const enabled = ev.detail.checked;        // <- use the value from the toggle, no manual inversion
    this.isDarkMode = enabled;
    this.applyDarkMode(enabled);
    try {
      localStorage.setItem(this.DARK_KEY, JSON.stringify(enabled));
    } catch (_) {
      // ignore storage errors (e.g. private mode)
    }
  }

  private loadThemePreference(): void {
    try {
      const stored = localStorage.getItem(this.DARK_KEY);
      if (stored !== null) {
        this.isDarkMode = JSON.parse(stored);
      } else {
        // fallback: follow system preference
        const prefersDark = window.matchMedia &&
          window.matchMedia('(prefers-color-scheme: dark)').matches;
        this.isDarkMode = prefersDark;
      }
    } catch (_) {
      this.isDarkMode = false;
    }

    this.applyDarkMode(this.isDarkMode);
  }

  private applyDarkMode(enabled: boolean): void {
    const body = document.body;

    // your custom dark styles (menu, etc.)
    body.classList.toggle('dark-theme', enabled);

    // Ionic's built-in dark palette support (since you imported dark.system.css)
    body.classList.toggle('dark', enabled);
  }

  // ============ NOTIFICATION SOUND ============

  loadNotificationSound(): void {
    try {
      const stored = localStorage.getItem(this.SOUND_KEY);
      if (stored) {
        this.selectedSound = stored;
      }
    } catch (_) {
      this.selectedSound = 'default';
    }
  }

  saveNotificationSound(): void {
    try {
      localStorage.setItem(this.SOUND_KEY, this.selectedSound);
    } catch (_) {
      // ignore
    }
  }

  // ============ STORAGE ACTIONS ============

  clearCache(): void {
    // Adjust to what you consider "cache" in your app
    try {
      // Example: if you store logs or computed data
      localStorage.removeItem('medguide-cache');
      // keep dark mode + sound settings
    } catch (_) {
      // ignore
    }
  }

  clearAllStorage(): void {
    try {
      localStorage.clear();
      // restore defaults after wipe
      this.isDarkMode = false;
      this.selectedSound = 'default';
      this.applyDarkMode(false);
    } catch (_) {
      // ignore
    }
  }
}
