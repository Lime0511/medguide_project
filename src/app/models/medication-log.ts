export interface MedicationLog {
    id?: string;             // Firestore ID
    medId: string;           // ID of medication this log is linked to
    name: string;            // Medication name
    time: string;            // Scheduled time (HH:mm)
    date: string;            // YYYY-MM-DD
    status: 'taken' | 'missed' | 'upcoming';
    createdAt: number;
}
