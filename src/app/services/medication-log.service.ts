import { Injectable } from '@angular/core';
import {
    Firestore,
    collection,
    collectionData,
    query,
    where,
    addDoc,
    doc,
    updateDoc
} from '@angular/fire/firestore';

@Injectable({
    providedIn: 'root'
})
export class MedicationLogService {

    constructor(private firestore: Firestore) { }

    // 🔵 Create a new log entry
    async createLog(data: any) {
        const ref = collection(this.firestore, 'medication_logs');
        return await addDoc(ref, data);
    }

    // 🔵 Get all logs for a specific date (YYYY-MM-DD)
    getLogsForDate(date: string) {
        const ref = collection(this.firestore, 'medication_logs');
        const q = query(ref, where('date', '==', date));

        return collectionData(q, { idField: 'id' }) as any;
    }

    // 🔵 Update a log status (taken/missed/etc.)
    async updateLog(id: string, data: any) {
        const logRef = doc(this.firestore, 'medication_logs', id);
        return await updateDoc(logRef, data);
    }
}
