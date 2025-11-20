import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class AdService {
  private isProUser = false;

  constructor(private platform: Platform) { }

  // Initialize AdMob (simulated in the browser)
  initialize() {
    if (this.platform.is('capacitor')) {
      console.log('[AdService] Initializing AdMob...');
    } else {
      console.log('[AdService] Simulating ads in browser.');
    }
  }

  // Show banner ad for non-Pro users
  showBanner() {
    if (this.isProUser) return; // No banner for Pro users
    console.log('[AdService] SIMULATING: Showing Banner Ad');
  }

  // Hide banner ad
  hideBanner() {
    console.log('[AdService] SIMULATING: Hiding Banner Ad');
  }

  // Show interstitial ad for non-Pro users
  showInterstitial() {
    if (this.isProUser) return; // No interstitial for Pro users
    console.log('[AdService] SIMULATING: Showing Interstitial Ad');
  }

  // Simulate the Pro purchase (disable ads)
  purchasePro() {
    console.log('[AdService] User has purchased Pro! Disabling ads.');
    this.isProUser = true;
  }
}
