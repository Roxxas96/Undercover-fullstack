import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'Undercover';

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    //On app init fetch session var
    this.authService.token = sessionStorage.getItem('token') || '';
    this.authService.userId = sessionStorage.getItem('userId') || '';
    //If no session vas fetch localstorage
    if (sessionStorage.getItem('token') == null) {
      this.authService.token = localStorage.getItem('token') || '';
      this.authService.userId = localStorage.getItem('userId') || '';
    }
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
