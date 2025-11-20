import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonContent, IonHeader, IonTitle, IonToolbar, IonItem, IonLabel, IonInput, IonButton, IonAvatar, IonButtons, IonMenuButton } from '@ionic/angular/standalone';

import { AuthService } from '../services/auth.service';
import { Firestore, doc, getDoc, updateDoc, deleteDoc } from '@angular/fire/firestore';
import { ToastController } from '@ionic/angular';

import {
    getDownloadURL, getStorage, ref,
    uploadBytes, deleteObject
} from '@angular/fire/storage';

import {
    updatePassword, EmailAuthProvider,
    reauthenticateWithCredential, deleteUser
} from '@angular/fire/auth';
import { AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { ActivityService } from '../services/activity.service';

@Component({
    selector: 'app-profile',
    standalone: true,
    templateUrl: './profile.page.html',
    styleUrls: ['./profile.page.scss'],
    imports: [
    CommonModule, FormsModule,
    IonContent, IonHeader, IonTitle, IonToolbar,
    IonItem, IonLabel, IonInput, IonButton, IonAvatar,
    IonButtons,
    IonMenuButton
]
})
export class ProfilePage implements OnInit {

    name = '';
    email: string | null = '';
    photoURL: string | null = 'assets/default-avatar.png';

    userId = '';

    constructor(
        private auth: AuthService,
        private firestore: Firestore,
        private toastCtrl: ToastController,
        private alertCtrl: AlertController,
        private router: Router,
        private activity: ActivityService
    ) { }

    async ngOnInit() {
        const user = this.auth.getUser();

        if (!user) return;

        this.userId = user.uid;
        this.email = user.email ?? '';

        // Fetch profile data
        const snap = await getDoc(doc(this.firestore, 'users', this.userId));

        if (snap.exists()) {
            const data: any = snap.data();
            this.name = data.name;
            this.photoURL = data.photoURL ?? 'assets/default-avatar.png';
        }
    }

    // 📷 Pick new image
    async changePhoto(event: any) {
        const file = event.target.files[0];
        if (!file) return;

        const storage = getStorage();
        const imgRef = ref(storage, `profile/${this.userId}.jpg`);

        // Upload image
        await uploadBytes(imgRef, file);

        // Get URL
        const url = await getDownloadURL(imgRef);
        this.photoURL = url;

        // Save in Firestore
        await updateDoc(doc(this.firestore, 'users', this.userId), {
            photoURL: url
        });

        await this.activity.log("Photo updated", "New profile picture uploaded");


        this.showToast("Photo updated!", "success");
    }

    // ✏️ Save name changes
    async saveProfile() {
        await updateDoc(doc(this.firestore, 'users', this.userId), {
            name: this.name
        });

        await this.activity.log("Profile updated", this.name);

        this.showToast("Profile updated successfully!", "success");
    }


    async showToast(message: string, color: string) {
        const t = await this.toastCtrl.create({
            message,
            color,
            duration: 1500
        });
        t.present();
    }

    async changePassword() {
        const user = this.auth.getUser();
        if (!user) return;

        // Ask the user for their current + new password
        const alert = await this.alertCtrl.create({
            header: 'Change Password',
            inputs: [
                { name: 'current', type: 'password', placeholder: 'Current Password' },
                { name: 'newPass', type: 'password', placeholder: 'New Password' }
            ],
            buttons: [
                { text: 'Cancel', role: 'cancel' },
                {
                    text: 'Update',
                    handler: async (data) => {
                        try {
                            // Re-authenticate user
                            const cred = EmailAuthProvider.credential(user.email!, data.current);
                            await reauthenticateWithCredential(user, cred);

                            // Update password
                            await updatePassword(user, data.newPass);

                            this.showToast('Password updated successfully!', 'success');
                        } catch (err) {
                            this.showToast('Incorrect current password.', 'danger');
                        }
                    }
                }
            ]
        });

        await alert.present();
    }

    async confirmDeleteAccount() {
        const alert = await this.alertCtrl.create({
            header: 'Delete Account',
            message: 'This action is permanent. Do you really want to delete your account?',
            buttons: [
                { text: 'Cancel', role: 'cancel' },
                {
                    text: 'Delete',
                    role: 'destructive',
                    handler: () => this.deleteAccount()
                }
            ]
        });

        await alert.present();
    }

    async deleteAccount() {
        const user = this.auth.getUser();
        if (!user) return;

        // Ask for password
        const alert = await this.alertCtrl.create({
            header: 'Re-authentication Required',
            message: 'Enter your password to continue.',
            inputs: [
                { name: 'password', type: 'password', placeholder: 'Password' }
            ],
            buttons: [
                { text: 'Cancel', role: 'cancel' },
                {
                    text: 'Confirm',
                    handler: async (data) => {
                        try {
                            // Re-auth user
                            const cred = EmailAuthProvider.credential(user.email!, data.password);
                            await reauthenticateWithCredential(user, cred);

                            // Delete Firestore user document
                            await deleteDoc(doc(this.firestore, 'users', user.uid));

                            // Delete profile photo if exists
                            const storage = getStorage();
                            const photoRef = ref(storage, `profile/${user.uid}.jpg`);
                            try { await deleteObject(photoRef); } catch { }

                            // Delete Firebase Auth account
                            await deleteUser(user);

                            this.showToast("Account deleted successfully", "success");

                            // Redirect to login
                            this.router.navigate(['/auth/login']);

                        } catch (err) {
                            this.showToast("Incorrect password or failed to delete.", "danger");
                        }
                    }
                }
            ]
        });

        await alert.present();
    }


}
