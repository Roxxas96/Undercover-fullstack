import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  version = '1.3.2';

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    //On app init fetch session/local var
    this.authService.token =
      sessionStorage.getItem('token') || localStorage.getItem('token') || '';
    this.authService.userId =
      sessionStorage.getItem('userId') || localStorage.getItem('userId') || '';
    //If token is not empty
    if (this.authService.token != '') {
      //And request token verification
      this.authService
        .authRequest()
        //If token match => redirect to lobby
        .then(() => {
          this.authService.isAuth$.next(true);
          this.router.navigate(['lobby']);
        })
        //If not do nothing (auth guard will do the rest)
        .catch(() => this.authService.isAuth$.next(false));

      //Setup logout on window close
      window.onbeforeunload = () => {
        this.authService.logout(true);
      };
    }
  }
}
