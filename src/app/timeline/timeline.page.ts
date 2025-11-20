import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonContent, IonHeader, IonToolbar, IonTitle, IonIcon, IonCard, IonCardContent, IonSegment, IonSegmentButton, IonLabel, IonInput, IonItem, IonItemSliding, IonItemOptions, IonItemOption, IonButton, IonButtons, IonMenuButton } from '@ionic/angular/standalone';

import { Firestore, doc, deleteDoc, setDoc } from '@angular/fire/firestore';
import { ToastController } from '@ionic/angular';

import { AuthService } from '../services/auth.service';
import { ActivityService } from '../services/activity.service';
import { firstValueFrom } from 'rxjs';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Share } from '@capacitor/share';

@Component({
    selector: 'app-timeline',
    standalone: true,
    templateUrl: './timeline.page.html',
    styleUrls: ['./timeline.page.scss'],
    imports: [
    CommonModule, FormsModule,
    IonContent, IonHeader, IonToolbar, IonTitle,
    IonIcon, IonCard, IonCardContent,
    IonSegment, IonSegmentButton, IonLabel,
    IonInput, IonItem,
    IonItemSliding, IonItemOptions,
    IonItemOption, IonButton,
    IonButtons,
    IonMenuButton
]
})
export class TimelinePage implements OnInit {


    logs: any[] = [];
    filteredLogs: any[] = [];
    groupedLogs: any[] = [];

    segment: string = "all";
    searchText: string = "";

    collapsedGroups: { [date: string]: boolean } = {};

    /** Selection Mode */
    isSelectionMode = false;
    selectedLogs: Set<string> = new Set();

    /** Long press */
    private pressTimeout: any = null;
    private pressDuration = 400;

    constructor(
        private auth: AuthService,
        private activity: ActivityService,
        private firestore: Firestore,
        private toastCtrl: ToastController
    ) { }

    async ngOnInit() {
        await this.refresh();
    }

    /** Refresh timeline from Firestore */
    async refresh() {
        const user = this.auth.getUser();
        if (!user) return;

        const data = await firstValueFrom(this.activity.getUserLogs(user.uid));

        this.logs = data.map((log: any) => ({
            ...log,
            time: new Date(log.timestamp).toLocaleString()
        }));

        this.applyFilters();
    }

    // -------------------------------------------------
    // FILTERS
    // -------------------------------------------------
    applyFilters() {
        let list = [...this.logs];

        if (this.searchText.trim() !== "") {
            const s = this.searchText.toLowerCase();
            list = list.filter(log =>
                log.action.toLowerCase().includes(s) ||
                log.details.toLowerCase().includes(s)
            );
        }

        if (this.segment === "today") {
            const today = new Date().toISOString().split("T")[0];
            list = list.filter(log =>
                new Date(log.timestamp).toISOString().startsWith(today)
            );
        }

        if (this.segment === "week") {
            const now = new Date();
            const weekAgo = new Date();
            weekAgo.setDate(now.getDate() - 7);

            list = list.filter(log => {
                const d = new Date(log.timestamp);
                return d >= weekAgo && d <= now;
            });
        }

        this.filteredLogs = list;
        this.groupLogsByDate();
    }

    // -------------------------------------------------
    // GROUPING
    // -------------------------------------------------
    groupLogsByDate() {
        const groups: any = {};

        this.filteredLogs.forEach(log => {
            const date = new Date(log.timestamp).toISOString().split("T")[0];
            if (!groups[date]) groups[date] = [];
            groups[date].push(log);
        });

        this.groupedLogs = Object.keys(groups).map(date => ({
            date,
            items: groups[date]
        }));
    }

    toggleGroup(date: string) {
        this.collapsedGroups[date] = !this.collapsedGroups[date];
    }

    isCollapsed(date: string) {
        return this.collapsedGroups[date];
    }

    // -------------------------------------------------
    // ICON + COLOR
    // -------------------------------------------------
    getIcon(action: string) {
        const a = action.toLowerCase();
        if (a.includes('added')) return 'add-circle-outline';
        if (a.includes('deleted')) return 'trash-outline';
        if (a.includes('updated')) return 'create-outline';
        if (a.includes('login')) return 'log-in-outline';
        if (a.includes('logout')) return 'log-out-outline';
        if (a.includes('reminder')) return 'notifications-outline';
        return 'time-outline';
    }

    getColor(action: string) {
        const a = action.toLowerCase();
        if (a.includes('added')) return '#4caf50';
        if (a.includes('deleted')) return '#e53935';
        if (a.includes('updated')) return '#fb8c00';
        if (a.includes('login')) return '#039be5';
        if (a.includes('logout')) return '#6a1b9a';
        if (a.includes('reminder')) return '#8e24aa';
        return '#777';
    }

    // -------------------------------------------------
    // SELECTION MODE
    // -------------------------------------------------
    enterSelectionMode() {
        this.isSelectionMode = true;
        this.selectedLogs.clear();
    }

    exitSelectionMode() {
        this.isSelectionMode = false;
        this.selectedLogs.clear();
    }

    onLogClick(log: any, event: Event) {
        if (!this.isSelectionMode) return;

        event.stopPropagation();

        if (this.selectedLogs.has(log.id)) {
            this.selectedLogs.delete(log.id);
        } else {
            this.selectedLogs.add(log.id);
        }
    }

    // Long press
    async startPress(log: any, event: Event) {
        if (this.isSelectionMode) return;

        event.stopPropagation();

        this.cancelPress();
        this.pressTimeout = setTimeout(() => {
            this.isSelectionMode = true;
            this.selectedLogs.clear();
            this.selectedLogs.add(log.id);

            Haptics.impact({ style: ImpactStyle.Medium });
        }, this.pressDuration);
    }

    cancelPress() {
        if (this.pressTimeout) {
            clearTimeout(this.pressTimeout);
            this.pressTimeout = null;
        }
    }

    selectAll() {
        this.selectedLogs.clear();

        for (const group of this.groupedLogs) {
            for (const log of group.items) {
                this.selectedLogs.add(log.id);
            }
        }
    }

    // -------------------------------------------------
    // DELETE
    // -------------------------------------------------
    async deleteLog(log: any) {
        await Haptics.impact({ style: ImpactStyle.Medium });

        const deleted = { ...log };

        this.logs = this.logs.filter(l => l.id !== log.id);
        this.applyFilters();

        await this.activity.deleteLog(log.id);

        const toast = await this.toastCtrl.create({
            message: 'Log deleted',
            duration: 4000,
            color: 'danger',
            buttons: [
                {
                    text: 'Undo',
                    handler: async () => {
                        await setDoc(doc(this.firestore, 'activity_logs', deleted.id), deleted);
                        this.refresh();
                    }
                }
            ]
        });

        toast.present();
    }

    async shareLog(log: any) {
        if (!log) return;

        const timeText = new Date(log.timestamp).toLocaleString();

        const message =
            `Medication Activity\n` +
            `Action: ${log.action}\n` +
            `Details: ${log.details}\n` +
            `Time: ${timeText}`;

        await Share.share({
            title: 'Medication Activity Log',
            text: message,
            dialogTitle: 'Share Medication Activity'
        });
    }


    async deleteSelected() {
        if (this.selectedLogs.size === 0) return;

        const ids = Array.from(this.selectedLogs);
        const deletedData = this.logs.filter(l => ids.includes(l.id));

        this.logs = this.logs.filter(l => !ids.includes(l.id));
        this.applyFilters();

        for (let id of ids) {
            await this.activity.deleteLog(id);
        }

        this.exitSelectionMode();

        const toast = await this.toastCtrl.create({
            message: `${ids.length} logs deleted`,
            duration: 4000,
            color: 'danger',
            buttons: [
                {
                    text: 'Undo',
                    handler: async () => {
                        for (let log of deletedData) {
                            await setDoc(doc(this.firestore, 'activity_logs', log.id), log);
                        }
                        this.refresh();
                    }
                }
            ]
        });

        toast.present();
    }

    onDrag() {
        Haptics.impact({ style: ImpactStyle.Light });
    }
async shareSpecificMed(med: any) {
  try {
    await Share.share({
      title: 'Medication Details',
      text: `Medication: ${med.name}\nDosage: ${med.dosage}\nTime: ${med.time}`,
      dialogTitle: 'Share Medication'
    });
  } catch (error) {
    console.error('Share error:', error);
  }
}   
}
