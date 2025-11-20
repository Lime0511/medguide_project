import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonItem, IonLabel, IonDatetime, IonButton,
  IonButtons, ModalController
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-edit-reminder-modal',
  standalone: true,
  templateUrl: './edit-reminder-modal.component.html',
  styleUrls: ['./edit-reminder-modal.component.scss'],
  imports: [
    CommonModule, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonItem, IonLabel, IonDatetime, IonButton, IonButtons
  ]
})
export class EditReminderModalComponent {
  @Input() reminder: any;
  newTime!: string;

  constructor(private modalCtrl: ModalController) { }

  save() {
    if (!this.newTime) return;
    this.modalCtrl.dismiss({ newTime: this.newTime }, 'save');
  }

  cancel() {
    this.modalCtrl.dismiss(null, 'cancel');
  }
}