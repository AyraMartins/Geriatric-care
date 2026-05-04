import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class OnboardingGuard implements CanActivate {

  constructor(private router: Router) {}

  canActivate(): boolean {

    const jaViu = localStorage.getItem('onboarding');

    if (!jaViu) {
      this.router.navigate(['/primeirapg']);
      return false;
    }

    return true;
  }
}