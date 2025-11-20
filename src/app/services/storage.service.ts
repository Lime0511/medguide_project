import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class StorageService {
    private STORAGE_KEY = 'medications_cache';

    // ✅ Save medication list locally
    saveMedications(medications: any[]) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(medications));
    }

    // ✅ Load cached medications
    loadMedications(): any[] {
        const data = localStorage.getItem(this.STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    }

    // ✅ Clear cache manually (optional)
    clearCache() {
        localStorage.removeItem(this.STORAGE_KEY);
    }
}
