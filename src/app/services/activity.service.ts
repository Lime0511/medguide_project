import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, query, where, orderBy, getDocs, doc, deleteDoc, setDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Auth } from '@angular/fire/auth';
import { collectionData } from '@angular/fire/firestore';

@Injectable({ providedIn: 'root' })
export class ActivityService {

    constructor(
        private firestore: Firestore,
        private auth: Auth
    ) { }

    async log(action: string, details: string) {
        const user = this.auth.currentUser;

        const colRef = collection(this.firestore, 'activity_logs');
        const docRef = await addDoc(colRef, {
            userId: user?.uid,
            action,
            details,
            timestamp: Date.now()
        });

        return { id: docRef.id };
    }

    getUserLogs(userId: string) {
        const colRef = collection(this.firestore, 'activity_logs');
        const q = query(colRef, where("userId", "==", userId), orderBy("timestamp", "desc"));

        return collectionData(q, { idField: 'id' }) as Observable<any[]>;
    }

    async deleteLog(id: string) {
        const ref = doc(this.firestore, 'activity_logs', id);
        await deleteDoc(ref);
    }

    async restoreLog(log: any) {
        const ref = doc(this.firestore, 'activity_logs', log.id);
        await setDoc(ref, log);
    }

}
