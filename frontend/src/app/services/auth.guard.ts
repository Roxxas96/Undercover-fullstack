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
      //Sub to auth$ so AuthGuard can activate at each time it changes (and not on route change only)
      this.authService.isAuth$.subscribe((auth) => {
        //If user is not auth redirect to login page
        if (!auth) {
          this.router.navigate(['login']);
        } else {
          //If user is auth, tell backend to check his token
          this.authService
            .authRequest()
            //If token invalid
            //TODO : à préciser
            .catch(() => this.authService.isAuth$.next(false));
        }
        observer.next(true);
      });
    });
  }
}
