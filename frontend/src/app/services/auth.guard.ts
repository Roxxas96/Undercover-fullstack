import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
  Router,
} from '@angular/router';
import { observable, Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private router: Router, private authService: AuthService) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return new Observable((observer) => {
      this.authService.isAuth$.subscribe((auth) => {
        if (!auth) {
          this.router.navigate(['login']);
        } else {
          this.authService
            .authRequest()
            .catch(() => this.authService.isAuth$.next(false));
        }
        observer.next(true);
      });
    });
  }
}
