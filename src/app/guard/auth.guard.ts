import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {

    const auth = inject(AuthService);
    const router = inject(Router);

    const user = auth.getUser();

    // Allow unauthenticated access to login + register
    const publicRoutes = ['/login', '/register'];

    if (publicRoutes.includes(router.url)) {
        return true;
    }

    // Protect ALL other pages
    if (user) {
        return true;
    }

    router.navigate(['/login']);
    return false;
};