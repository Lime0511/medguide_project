import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonInput, IonButton, IonButtons, IonIcon, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonMenuButton, IonSpinner, IonBadge, IonAccordionGroup, IonAccordion, IonItemSliding, IonItemOptions, IonItemOption } from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { MedicationService } from '../services/medication.service';
import { Medication } from '../models/medication';
import { firstValueFrom } from 'rxjs';
import { ModalController, AlertController } from '@ionic/angular';
import { EditModalComponent } from './edit-modal.component';
import { addIcons } from 'ionicons';
import { create, trash } from 'ionicons/icons';
import { LocalNotifications } from '@capacitor/local-notifications';
import { ToastController } from '@ionic/angular';
import { Storage } from '@ionic/storage-angular';
import { ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { Auth } from '@angular/fire/auth';
import { ActivityService } from '../services/activity.service';
import Chart from 'chart.js/auto';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Share } from '@capacitor/share';
import { OnInit, OnDestroy } from '@angular/core';
import { AdService } from '../services/ad';



@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  imports: [
    CommonModule, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonList, IonItem, IonLabel, IonInput, IonButton,
    IonButtons, IonIcon, IonCard,
    IonCardContent, IonMenuButton,
    IonSpinner,
    IonBadge,
    IonAccordionGroup,
    IonAccordion,
    IonItemSliding,
    IonItemOptions,
    IonItemOption
  ]
})

export class HomePage {

  todayMeds: any[] = [];
  takenToday = 0;
  missedToday = 0;
  upcomingToday = 0;
  totalToday = 0;
  adherence = 0;
  nextMed: any = null;

  dashOffset = 0;
  logs: any[] = [];

  medications: Medication[] = [];
  newMed: Medication = { name: '', dosage: '', time: '' };
  offline = !navigator.onLine;
  isPageReady = false;

  streak = 0;
  longestStreak = 0;

  chart: any;
  weeklyData: number[] = [];
  weekLabels: string[] = [];


  private cacheKey = 'medications_cache';
  private storageReady = false;


  async shareApp() {
    // If there is no upcoming medication
    if (!this.nextMed || !this.nextMed.time) {
      await Share.share({
        title: 'Medication Reminder',
        text: 'No upcoming medication scheduled right now.',
        dialogTitle: 'Share Medication Reminder'
      });
      return;
    }

    const timeLeftText = this.getTimeLeftText(this.nextMed.time);

    const message = `Reminder: ${this.nextMed.name} – ${this.nextMed.dosage} at ${this.nextMed.time}. ${timeLeftText}`;

    await Share.share({
      title: 'Medication Reminder',
      text: message,
      dialogTitle: 'Share Medication Reminder'
    });
  }

  private getTimeLeftText(medTime: string): string {
    // medTime expected format: "HH:mm" (e.g. "20:20")
    const now = new Date();

    const [hourStr, minuteStr] = medTime.split(':');
    const medDate = new Date();
    medDate.setHours(Number(hourStr), Number(minuteStr), 0, 0);

    let diffMs = medDate.getTime() - now.getTime();

    // If the time has passed, you can tweak this behaviour.
    if (diffMs <= 0) {
      return 'The medication time has already passed.';
    }

    const totalMinutes = Math.round(diffMs / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    let parts: string[] = [];
    if (hours > 0) {
      parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
    }
    if (minutes > 0) {
      parts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);
    }

    return `Time left: ${parts.join(' ')}.`;
  }


  async shareSpecificMed(med: any) {
    if (!med) {
      return;
    }

    let timeLeftText = '';

    if (med.time) {
      timeLeftText = this.getTimeLeftText(med.time);
    }

    let message = `Reminder: ${med.name} – ${med.dosage}`;
    if (med.time) {
      message += ` at ${med.time}.`;
    } else {
      message += '.';
    }

    if (timeLeftText) {
      message += ` ${timeLeftText}`;
    }

    await Share.share({
      title: 'Medication Reminder',
      text: message,
      dialogTitle: 'Share Medication Reminder'
    });
  }

  constructor(
    private medService: MedicationService,
    private modalCtrl: ModalController,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private storage: Storage,
    private auth: Auth,
    private activity: ActivityService,
    private adService: AdService
  ) {
    addIcons({ create, trash });

    this.initialize();
    this.listenForNetworkChanges();
    this.requestNotificationPermission();
    this.dashOffset = 314 - (314 * this.adherence) / 100;
    this.loadStreak();


  }

  // 🔹 Main initialization: cache → live data
  ngOnInit() {
    // Initialize the AdService and show the banner ad for non-Pro users
    this.adService.initialize();  // Initialize the ad service (can be simulated for now in browser)
    this.adService.showBanner();  // Show banner ad when the page loads
  }

  ngOnDestroy() {
    // Hide banner ad when leaving the page
    this.adService.hideBanner();
  }

  // Trigger interstitial ad when the user clicks the button
  showInterstitialAd() {
    this.adService.showInterstitial();
  }

  // Simulate Pro purchase and hide ads
    goPro() {
    // Simulate the Pro version purchase and disable ads
    this.adService.purchasePro();
    alert('You are now a Pro user, and ads are disabled!');
  }

    private async initialize() {
    await this.initStorage();
    await this.loadCachedMedications();  // show something quickly
    this.loadDashboard();

    this.loadLiveMedications();
    this.loadLogs();

    // show the UI only after cache is loaded immediately
    this.isPageReady = true;// then sync from Firestore when online
  }

  private listenForNetworkChanges() {
    window.addEventListener('online', () => (this.offline = false));
    window.addEventListener('offline', () => (this.offline = true));
  }

  // 🔹 Storage setup
  private async initStorage() {
    await this.storage.create();
    this.storageReady = true;
  }

  // 🔹 Load cached meds first (offline support)
  private async loadCachedMedications() {
    if (!this.storageReady) return;

    const cached = await this.storage.get(this.cacheKey);
    if (cached && cached.length > 0) {
      this.medications = cached;
      console.log('💾 Loaded cached medications:', cached);
    } else {
      console.log('⚠️ No cached medication data found.');
    }
  }

  // 🔹 Load live meds from Firestore (online only)
  private loadLiveMedications() {
    if (!navigator.onLine) {
      console.log('🌐 Offline — skipping Firestore fetch.');
      return;
    }

    this.medService.getMedications().subscribe(async meds => {
      if (meds && meds.length > 0) {
        this.medications = meds;

        this.loadDashboard();


        if (this.storageReady) {
          await this.storage.set(this.cacheKey, meds);
          console.log('💾 Cache updated from Firestore.');
        }
      } else {
        console.log('⚠️ Firestore returned no medications.');
      }
    });
  }

  // 🔹 Notification permission
  async requestNotificationPermission() {
    const perm = await LocalNotifications.requestPermissions();
    if (perm.display !== 'granted') {
      const alert = await this.alertCtrl.create({
        header: 'Permission Required',
        message: 'Please allow notifications to receive medication reminders.',
        buttons: ['OK']
      });
      await alert.present();
    }
  }

  // 🔹 Add medication
  async addMedication() {
    if (!this.newMed.name || !this.newMed.dosage || !this.newMed.time) {
      const alert = await this.alertCtrl.create({
        header: 'Missing Information',
        message: 'Please fill in all fields before adding a medication.',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    try {
      await this.medService.addMedication(this.newMed);
      await this.scheduleNotification(this.newMed);

      const toast = await this.toastCtrl.create({
        message: `💊 ${this.newMed.name} added! Reminder set for ${this.newMed.time}.`,
        duration: 3000,
        color: 'success',
        position: 'bottom',
        cssClass: 'medguide-toast success-toast',
        icon: 'checkmark-circle',
        animated: true,
        swipeGesture: 'vertical'
      });
      await toast.present();

      // refresh list + cache
      const meds = await firstValueFrom(this.medService.getMedications());
      this.medications = meds;
      await this.storage.set(this.cacheKey, meds);
      console.log('✅ Cached updated medications to local storage.');

      this.newMed = { name: '', dosage: '', time: '' };
    } catch (err) {
      const error = await this.alertCtrl.create({
        header: 'Error',
        message: 'Could not add medication. Try again later.',
        buttons: ['OK']
      });
      await error.present();
    }
  }

  // 🔹 Schedule notification
  async scheduleNotification(med: Medication) {
    try {
      const [hour, minute] = med.time.split(':').map(Number);

      const now = new Date();
      const scheduledTime = new Date();
      scheduledTime.setHours(hour, minute, 0, 0);

      if (scheduledTime < now) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
      }

      await LocalNotifications.schedule({
        notifications: [
          {
            title: '💊 Medication Reminder',
            body: `Time to take ${med.name} (${med.dosage})`,
            id: Date.now(),
            schedule: {
              repeats: true,
              every: 'day',
              at: scheduledTime
            },
            sound: 'default',
            smallIcon: 'ic_launcher'
          }
        ]
      });

      console.log('Notification scheduled for:', scheduledTime);

      const toast = await this.toastCtrl.create({
        message: `📅 Daily reminder set for ${med.name} at ${med.time}.`,
        duration: 3000,
        color: 'tertiary',
        position: 'bottom',
        cssClass: 'medguide-toast reminder-toast',
        icon: 'notifications',
        animated: true
      });
      await toast.present();
    } catch (error) {
      console.error('Error scheduling notification:', error);

      const errorToast = await this.toastCtrl.create({
        message: '⚠️ Failed to schedule reminder. Please try again.',
        duration: 3000,
        color: 'danger',
        position: 'bottom',
        cssClass: 'medguide-toast delete-toast'
      });
      await errorToast.present();
    }
  }

  // 🔹 Delete medication
  async deleteMedication(id: string, name: string) {
    const alert = await this.alertCtrl.create({
      header: 'Confirm Delete',
      message: `Delete ${name}?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: async () => {
            await this.medService.deleteMedication(id);
            const toast = await this.toastCtrl.create({
              message: `${name} deleted successfully.`,
              duration: 2500,
              color: 'light',
              position: 'bottom',
              cssClass: 'medguide-toast delete-toast',
              icon: 'trash',
              animated: true
            });
            await toast.present();

            const meds = await firstValueFrom(this.medService.getMedications());
            this.medications = meds;
            await this.storage.set(this.cacheKey, meds);
          }
        }
      ]
    });
    await alert.present();
  }

  // 🔹 Edit medication (modal)
  async openEditModal(med: Medication) {
    const modal = await this.modalCtrl.create({
      component: EditModalComponent,
      componentProps: { medication: med }
    });

    await modal.present();

    const { data, role } = await modal.onWillDismiss();

    if (role === 'save' && data) {
      await this.medService.updateMedication(med.id!, data);

      const meds = await firstValueFrom(this.medService.getMedications());
      this.medications = meds;
      await this.storage.set(this.cacheKey, meds);
    }
  }

  async loadDashboard() {
    const today = new Date().toISOString().split("T")[0];

    // Get logs of today from your existing meds
    this.todayMeds = this.medications.map(med => {
      return {
        ...med,
        status: this.getStatusForToday(med)
      };
    });

    this.takenToday = this.todayMeds.filter(l => l.status === 'taken').length;
    this.missedToday = this.todayMeds.filter(l => l.status === 'missed').length;
    this.upcomingToday = this.todayMeds.filter(l => l.status === 'upcoming').length;
    this.totalToday = this.todayMeds.length;

    this.adherence = Math.round((this.takenToday / this.totalToday) * 100) || 0;

    this.nextMed = this.todayMeds
      .filter(l => l.status === 'upcoming')
      .sort((a, b) => a.time.localeCompare(b.time))[0];

    this.updateStreak();
    setInterval(() => this.checkMissedDoses(), 45_000);  // checks every 45 seconds


  }

  getStatusForToday(med: any): string {
    if (!this.logs) return "upcoming";

    const today = new Date().toISOString().split("T")[0];

    // Convert med.time -> Date object today
    const [hour, minute] = med.time.split(":").map(Number);
    const medDate = new Date();
    medDate.setHours(hour, minute, 0, 0);

    const now = new Date();

    // STEP 1 — FILTER TODAY'S LOGS
    const todaysLogs = this.logs.filter(log => {
      const logDate = new Date(log.timestamp).toISOString().split("T")[0];
      return logDate === today;
    });

    // STEP 2 — FIND IF USER TOOK THIS MED
    const taken = todaysLogs.find(log =>
      log.action.toLowerCase().includes("take") &&
      log.details.toLowerCase().includes(med.name.toLowerCase())
    );

    if (taken) return "taken";

    // STEP 3 — MISSED (if time passed and not taken)
    if (medDate < now) return "missed";

    // STEP 4 — Otherwise upcoming
    return "upcoming";
  }

  getMedIcon(med: any): string {
    const name = med.name?.toLowerCase() || '';

    // Based on medication type
    if (name.includes('insulin')) return 'medkit-outline';    // 💉
    if (name.includes('tablet') || name.includes('vitamin')) return 'capsule-outline';  // 💊
    if (name.includes('spray')) return 'color-wand-outline';  // nasal spray
    if (name.includes('cream')) return 'brush-outline';

    // Based on time of day
    const hour = parseInt(med.time.split(':')[0], 10);
    if (hour >= 20 || hour < 6) return 'moon-outline';   // 🌙 night dose
    if (hour >= 6 && hour < 12) return 'sunny-outline';  // ☀️ morning
    if (hour >= 12 && hour < 18) return 'partly-sunny-outline'; // afternoon

    return 'ellipse-outline';
  }

  loadLogs() {
    const user = this.auth.currentUser;
    if (!user) return;

    this.activity.getUserLogs(user.uid).subscribe((logs: any[]) => {
      this.logs = logs;
      this.loadDashboard(); // refresh dashboard with real statuses
      this.buildWeeklyAdherence();
    });
  }

  async markTaken(med: any) {
    const user = this.auth.currentUser;
    if (!user) return;

    // CREATE ACTIVITY LOG
    await this.activity.log(
      "Take Medication",
      `User took ${med.name} (${med.dosage})`
    );

    med.status = "taken";

    const toast = await this.toastCtrl.create({
      message: `💊 Marked ${med.name} as taken.`,
      duration: 2000,
      color: 'success'
    });
    toast.present();

    this.loadLogs(); // refresh statuses
  }

  async undoTaken(med: any) {
    const user = this.auth.currentUser;
    if (!user) return;

    // Find today's "take medication" log
    const today = new Date().toISOString().split("T")[0];

    const todaysLogs = this.logs.filter(log => {
      const logDate = new Date(log.timestamp).toISOString().split("T")[0];
      return logDate === today;
    });

    const log = todaysLogs.find(l =>
      l.action.includes("Take") &&
      l.details.toLowerCase().includes(med.name.toLowerCase())
    );

    if (!log) return;

    // delete the log from Firestore
    await this.activity.deleteLog(log.id);

    med.status = this.getStatusForToday(med); // recalc status

    const toast = await this.toastCtrl.create({
      message: `⤺ Undid taken: ${med.name}`,
      duration: 2000,
      color: 'warning'
    });
    toast.present();

    this.loadLogs(); // refresh UI
  }

  async loadStreak() {
    this.streak = (await this.storage.get("adherence_streak")) || 0;
    this.longestStreak = (await this.storage.get("longest_streak")) || 0;
  }

  async updateStreak() {
    // If adherence >= 80%, increase streak
    if (this.adherence >= 80) {
      this.streak++;
      if (this.streak > this.longestStreak) {
        this.longestStreak = this.streak;
        await this.storage.set("longest_streak", this.longestStreak);
      }
    } else {
      this.streak = 0; // streak broken
    }

    await this.storage.set("adherence_streak", this.streak);
  }

  missedAlerts: Set<string> = new Set(); // avoids repeated alerts

  async checkMissedDoses() {
    const now = new Date();

    for (const med of this.medications) {
      const [hour, minute] = med.time.split(":").map(Number);

      const medTime = new Date();
      medTime.setHours(hour, minute, 0, 0);

      // Dose is eligible for "missed" status
      if (medTime < now) {

        // already marked as missed earlier
        if (this.missedAlerts.has(med.id!)) continue;

        // check logs (if user already took it)
        const taken = this.logs.find(log =>
          log.action.includes("Take") &&
          log.details.toLowerCase().includes(med.name.toLowerCase())
        );

        if (!taken) {
          // Mark alert as sent
          this.missedAlerts.add(med.id!);

          // 1) create Firestore log
          await this.activity.log(
            "Missed Dose",
            `${med.name} (${med.dosage}) was missed`
          );

          // 2) show in-app notification
          await LocalNotifications.schedule({
            notifications: [{
              title: "⚠️ Missed Dose",
              body: `You missed your dose of ${med.name}.`,
              id: Date.now(),
              sound: "default"
            }]
          });

          // 3) dashboard refresh
          this.loadLogs();
          this.loadDashboard();
        }
      }
    }
  }

  buildWeeklyAdherence() {
    const now = new Date();
    const days = 7;

    this.weekLabels = [];
    this.weeklyData = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(now.getDate() - i);

      const dayStr = date.toISOString().split("T")[0];

      const dayLogs = this.logs.filter(l =>
        new Date(l.timestamp).toISOString().split("T")[0] === dayStr
      );

      const taken = dayLogs.filter(l => l.action.includes("Take")).length;
      const total = this.medications.length;

      const adherence = total > 0 ? Math.round((taken / total) * 100) : 0;

      this.weekLabels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
      this.weeklyData.push(adherence);
    }

    this.renderChart();
  }

  renderChart() {
    const ctx = document.getElementById('adherenceChart') as HTMLCanvasElement;

    if (this.chart) this.chart.destroy();

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.weekLabels,
        datasets: [{
          label: 'Adherence %',
          data: this.weeklyData,
          borderColor: '#2563eb',
          backgroundColor: 'rgba(37,99,235,0.25)',
          fill: true,
          tension: 0.35,
          borderWidth: 3,
          pointRadius: 5,
          pointBackgroundColor: '#1d4ed8'
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            min: 0,
            max: 100
          }
        }
      }
    });
  }

  async triggerHaptic() {
    await Haptics.impact({ style: ImpactStyle.Medium });
  }

  async skipDose(med: any) {
    await this.triggerHaptic();

    med.status = "skipped";

    await this.activity.log(
      "Skipped Dose",
      `${med.name} (${med.dosage}) was skipped`
    );

    const toast = await this.toastCtrl.create({
      message: `⏭ Skipped ${med.name}`,
      duration: 2000,
      color: 'medium'
    });
    toast.present();

    this.loadLogs();
  }

  async openMedDetails(med: any) {
    const alert = await this.alertCtrl.create({
      header: med.name,
      message: `
      <strong>Dosage:</strong> ${med.dosage}<br/>
      <strong>Time:</strong> ${med.time}<br/>
      <strong>Status:</strong> ${med.status}
    `,
      buttons: ["Close"]
    });
    await alert.present();
  }


}