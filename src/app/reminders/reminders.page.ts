import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonList,
  IonItem, IonLabel, IonButton, IonButtons, IonIcon,
  IonMenuButton, ViewWillEnter
} from '@ionic/angular/standalone';

import { LocalNotifications } from '@capacitor/local-notifications';
import { addIcons } from 'ionicons';
import { trash, notifications, checkmarkCircle, closeCircle } from 'ionicons/icons';

import { ModalController, ToastController } from '@ionic/angular';
import { EditReminderModalComponent } from '../edit-reminder-modal/edit-reminder-modal.component';

import { Storage } from '@ionic/storage-angular';

import { MedicationLogService } from '../services/medication-log.service';
import { ActivityService } from '../services/activity.service';
import { MedicationService } from '../services/medication.service';
import { Firestore, doc, updateDoc } from '@angular/fire/firestore';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-reminders',
  templateUrl: './reminders.page.html',
  styleUrls: ['./reminders.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonList, IonItem, IonLabel, IonButton,
    IonButtons, IonIcon, IonMenuButton
  ]
})
export class RemindersPage implements ViewWillEnter {

  reminders: any[] = [];

  todayLogs: any[] = [];
  isLogsReady = false;

  private cacheKey = 'reminders_cache';
  private storageReady = false;

  constructor(
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
    private storage: Storage,
    private medLogService: MedicationLogService,
    private medService: MedicationService,
    private activity: ActivityService,
    private firestore: Firestore
  ) {
    addIcons({ trash, notifications, checkmarkCircle, closeCircle });
    this.initStorage();
  }

  // ----------------------------- STORAGE INIT -----------------------------
  private async initStorage() {
    await this.storage.create();
    this.storageReady = true;
  }

  async checkPermissions() {
    const permission = await LocalNotifications.checkPermissions();
    if (permission.display !== 'granted') {
      await LocalNotifications.requestPermissions();
    }
  }

  // ----------------------------- PAGE ENTER -----------------------------
  async ionViewWillEnter() {
    await this.checkPermissions();

    // Load cached reminders
    if (!this.storageReady) {
      await this.initStorage();
    }
    const cached = await this.storage.get(this.cacheKey);
    if (cached) {
      this.reminders = cached;
    }

    // Load device notifications
    await this.loadReminders();

    // Load medication logs
    await this.loadTodayLogs();

    // Auto detect missed meds
    this.checkForMissedMeds();
  }

  // ----------------------------- NOTIFICATION LOGIC -----------------------------
  async loadReminders() {
    const result = await LocalNotifications.getPending();
    this.reminders = result.notifications || [];

    if (this.storageReady) {
      await this.storage.set(this.cacheKey, this.reminders);
    }
  }

  async cancelReminder(id: number) {
    await LocalNotifications.cancel({ notifications: [{ id }] });

    this.reminders = this.reminders.filter(r => r.id !== id);

    if (this.storageReady) {
      await this.storage.set(this.cacheKey, this.reminders);
    }
  }

  async cancelAllReminders() {
    await LocalNotifications.cancel({ notifications: [] });

    this.reminders = [];

    if (this.storageReady) {
      await this.storage.set(this.cacheKey, []);
    }

    const toast = await this.toastCtrl.create({
      message: '🗑️ All reminders cancelled successfully.',
      duration: 2500,
      color: 'medium'
    });
    await toast.present();
  }

  // ----------------------------- EDIT REMINDER -----------------------------
  async editReminder(reminder: any) {
    const modal = await this.modalCtrl.create({
      component: EditReminderModalComponent,
      componentProps: { reminder }
    });
    await modal.present();

    const { data } = await modal.onWillDismiss();

    // User closed without saving or modal returned nothing
    if (!data || !data.newTime) {
      return;
    }

    // Build Date from modal return value
    let newDate: Date;

    if (typeof data.newTime === 'string' || data.newTime instanceof Date) {
      // If modal returns ISO string or Date
      newDate = new Date(data.newTime);
    } else if (
      typeof data.newTime === 'object' &&
      data.newTime.hour != null &&
      data.newTime.minute != null
    ) {
      // Modal returns { hour, minute }
      const now = new Date();
      newDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        data.newTime.hour,
        data.newTime.minute,
        0,
        0
      );
    } else {
      // Unexpected format
      return;
    }

    const newTimeStr = newDate.toTimeString().slice(0, 5); // "HH:MM"

    // 1) Cancel old notification
    await LocalNotifications.cancel({
      notifications: [{ id: reminder.id }]
    });

    // 2) Schedule new one at updated time
    await LocalNotifications.schedule({
      notifications: [
        {
          ...reminder,
          schedule: { at: newDate, repeats: true, every: 'day' }
        }
      ]
    });

    // 3) If this reminder is tied to a medication_logs entry, update that too
    if (reminder.extra?.logId) {
      try {
        await updateDoc(
          doc(this.firestore, 'medication_logs', reminder.extra.logId),
          { time: newTimeStr }
        );
        await this.loadTodayLogs();
      } catch (err) {
        console.error('Failed to update medication_logs time:', err);
      }
    }

    // 4) Sync medication time in "medications" collection (what Home uses)
    try {
      const meds = await firstValueFrom(this.medService.getMedications());

      // We don't have medId on the reminder, so match by name/dosage in the body
      const body: string = reminder.body || '';

      const target = meds.find(m => {
        const nameMatch = m.name && body.includes(m.name);
        const dosageMatch = m.dosage ? body.includes(m.dosage) : true;
        return nameMatch && dosageMatch;
      });

      if (target && (target as any).id) {
        await this.medService.updateMedication((target as any).id, { time: newTimeStr });
      }
    } catch (err) {
      console.error('Failed to sync medication time with reminder:', err);
    }

    // 5) Refresh reminders from device + recache
    await this.loadReminders();

    // 6) Toast feedback
    const toast = await this.toastCtrl.create({
      message: '⏰ Reminder updated.',
      duration: 2500,
      color: 'success'
    });
    await toast.present();
  }

  // ----------------------------- MEDICATION LOGS -----------------------------
  async loadTodayLogs() {
    const today = new Date().toISOString().split('T')[0];

    this.todayLogs = await this.medLogService.getLogsForDate(today);
    this.isLogsReady = true;
  }

  async markTaken(log: any) {
    await updateDoc(doc(this.firestore, 'medication_logs', log.id), {
      status: 'taken'
    });

    log.status = 'taken';

    await this.activity.log('Medication taken', log.name);

    const toast = await this.toastCtrl.create({
      message: `${log.name} marked as taken.`,
      color: 'success',
      duration: 1500
    });
    await toast.present();
  }

  async checkForMissedMeds() {
    const now = new Date();

    for (const log of this.todayLogs) {
      if (log.status !== 'upcoming') continue;

      const [h, m] = log.time.split(':').map(Number);
      const scheduled = new Date();
      scheduled.setHours(h, m, 0, 0);

      if (scheduled < now) {
        await updateDoc(doc(this.firestore, 'medication_logs', log.id), {
          status: 'missed'
        });
        log.status = 'missed';
      }
    }
  }
}
