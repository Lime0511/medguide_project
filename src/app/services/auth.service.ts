import { Injectable } from '@angular/core';

import {
    Auth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    User,
    sendPasswordResetEmail,
    sendEmailVerification
} from '@angular/fire/auth';

import { Firestore, doc, setDoc } from '@angular/fire/firestore';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})

export class AuthService {

    private currentUser = new BehaviorSubject<User | null>(null);
    user$ = this.currentUser.asObservable();

    constructor(
        private auth: Auth,
        private firestore: Firestore
    ) {
        this.monitorAuthState();
    }

    // 🔍 Monitor login state
    private monitorAuthState() {
        onAuthStateChanged(this.auth, (user) => {
            this.currentUser.next(user);
        });
    }

    // 🟢 Sign Up + Save name in Firestore
    async register(email: string, password: string, name: string) {
        const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);

        // Save name in Firestore
        const user = userCredential.user;

        await setDoc(doc(this.firestore, 'users', user.uid), {
            uid: user.uid,
            email,
            name,
            photoURL: null,
            createdAt: new Date()
        });

        // send email verification
        await sendEmailVerification(user);

        return userCredential;


    }


    // 🔵 LOGIN
    async login(email: string, password: string) {
        const result = await signInWithEmailAndPassword(this.auth, email, password);

        // Save user for activity logging
        localStorage.setItem('user', JSON.stringify(result.user));

        return result;
    }


    // 🟡 PASSWORD RESET
    resetPassword(email: string) {
        return sendPasswordResetEmail(this.auth, email);
    }

    // 🔴 LOGOUT
    logout() {
        localStorage.removeItem('user');
        return signOut(this.auth);
    }

    // user state
    getUser() {
        return this.currentUser.value;
    }

    isLoggedIn(): boolean {
        return !!this.currentUser.value;
    }
    //profile page support
    getUserProfile(uid: string) {
        return doc(this.firestore, 'users', uid);
    }

    updateUserProfile(uid: string, data: any) {
        return setDoc(doc(this.firestore, 'users', uid), data, { merge: true });
    }


}
