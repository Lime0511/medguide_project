import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonItem, IonLabel, IonInput, IonButton
} from '@ionic/angular/standalone';
import { ModalController } from '@ionic/angular';
import { Medication } from '../models/medication';

@Component({
    selector: 'app-edit-modal',
    standalone: true,
    template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Edit Medication</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-item>
        <ion-label position="floating">Name</ion-label>
        <ion-input [(ngModel)]="editableMed.name"></ion-input>
      </ion-item>

      <ion-item>
        <ion-label position="floating">Dosage</ion-label>
        <ion-input [(ngModel)]="editableMed.dosage"></ion-input>
      </ion-item>

      <ion-item>
        <ion-label position="floating">Time</ion-label>
        <ion-input type="time" [(ngModel)]="editableMed.time"></ion-input>
      </ion-item>

      <ion-button expand="block" (click)="save()">Save</ion-button>
      <ion-button expand="block" color="medium" (click)="dismiss()">Cancel</ion-button>
    </ion-content>
  `,
    imports: [
        CommonModule, FormsModule,
        IonHeader, IonToolbar, IonTitle, IonContent,
        IonItem, IonLabel, IonInput, IonButton
    ]
})
export class EditModalComponent {
    @Input() medication!: Medication;
    editableMed!: Medication;

    constructor(private modalCtrl: ModalController) { }

    ngOnInit() {
        this.editableMed = { ...this.medication };
    }

    save() {
        this.modalCtrl.dismiss(this.editableMed, 'save');
    }

    dismiss() {
        this.modalCtrl.dismiss(null, 'cancel');
    }
}
