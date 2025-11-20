import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  CollectionReference,
  DocumentData
} from '@angular/fire/firestore';
import { Medication } from '../models/medication';
import { Observable } from 'rxjs';
import { StorageService } from './storage.service';
import { Auth } from '@angular/fire/auth';

@Injectable({
  providedIn: 'root'
})
export class MedicationService {

  constructor(
    private firestore: Firestore,
    private storage: StorageService,
    private auth: Auth
  ) {}

  /** Helper: get the current user's medication collection */
  private getUserMedCollection(): CollectionReference<DocumentData> {
    const uid = this.auth.currentUser?.uid;
    if (!uid) {
      throw new Error('User not authenticated');
    }
    return collection(this.firestore, `users/${uid}/medications`);
  }

  // Create
  addMedication(med: Medication) {
    const medCol = this.getUserMedCollection();
    const uid = this.auth.currentUser?.uid;

    return addDoc(medCol, {
      ...med,
      uid,
      createdAt: new Date()
    });
  }

  // Read
  getMedications(): Observable<Medication[]> {
    const medCol = this.getUserMedCollection();
    return collectionData(medCol, { idField: 'id' }) as Observable<Medication[]>;
  }

  // Update
  updateMedication(id: string, med: Partial<Medication>) {
    const uid = this.auth.currentUser?.uid;
    if (!uid) {
      throw new Error('User not authenticated');
    }

    const docRef = doc(this.firestore, `users/${uid}/medications/${id}`);
    return updateDoc(docRef, med);
  }

  // Delete
  deleteMedication(id: string) {
    const uid = this.auth.currentUser?.uid;
    if (!uid) {
      throw new Error('User not authenticated');
    }

    const docRef = doc(this.firestore, `users/${uid}/medications/${id}`);
    return deleteDoc(docRef);
  }
}
