import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const guestGuard: CanActivateFn = () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    const user = auth.getUser();

    // If logged in → block login/register pages
    if (user) {
        router.navigate(['/home']);
        return false;
    }

    return true; // allow access
};
