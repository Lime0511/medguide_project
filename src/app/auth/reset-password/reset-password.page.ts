import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    IonContent, IonHeader, IonTitle, IonToolbar,
    IonItem, IonLabel, IonInput, IonButton,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent
} from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { ModalController, ToastController } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';
import { ActivityService } from '../../services/activity.service';

@Component({
    selector: 'app-reset-password',
    standalone: true,
    templateUrl: './reset-password.page.html',
    imports: [
        CommonModule, FormsModule,
        IonContent, IonHeader, IonTitle, IonToolbar,
        IonItem, IonLabel, IonInput, IonButton
    ]
})
export class ResetPasswordPage {

    email = "";

    constructor(
        private modalCtrl: ModalController,
        private toastCtrl: ToastController,
        private authService: AuthService,
        private activity: ActivityService
    ) { }

    dismiss() {
        this.modalCtrl.dismiss();
    }

    async resetPassword() {
        if (!this.email) {
            return this.showToast("Please enter a valid email.", "warning");
        }

        try {
            await this.authService.resetPassword(this.email);
            // await this.activity.log('User logout');


            await this.showToast("Reset link sent! Check your email.", "success");
            this.dismiss();

        } catch (err) {
            this.showToast("Failed to send reset link. Try again.", "danger");
        }
    }

    private async showToast(message: string, color: string) {
        const toast = await this.toastCtrl.create({
            message,
            color,
            duration: 2000
        });
        toast.present();
    }
}

