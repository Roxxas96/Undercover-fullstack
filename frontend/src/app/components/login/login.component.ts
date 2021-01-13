import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  loading = false;
  errorMessage = {
    username: '',
    password: '',
    other: '',
  };

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    if (this.authService.isAuth$.getValue()) this.router.navigate(['lobby']);
  }

  onLogin(form: NgForm) {
    //Reset error messages
    this.errorMessage = {
      username: '',
      password: '',
      other: '',
    };
    //Draw loading hint
    this.loading = true;
    //Retreive data
    const login = form.value['login'];
    const password = form.value['password'];
    const autoConnect = form.value['auto-connect'];
    //Call auth service to login
    this.authService
      .login(login, password, autoConnect)
      .then(() => {
        this.loading = false;
        this.router.navigate(['lobby']);
      })
      //If bad login info, catch it
      .catch((error) => {
        //Draw classic errors
        if (
          error.error.error == 'Utilisateur non trouvé !' ||
          error.error.error == 'Mot de passe incorrect !'
        ) {
          this.errorMessage.password = 'Login ou mot de passe incorect';
          this.loading = false;
          return;
        }
        if (error.error.error == "Quelqu'un est déjà connecté à ce compte !") {
          this.errorMessage.username =
            "Quelqu'un est déjà connecté à ce compte";
          this.loading = false;
          return;
        }
        //Catch any other error
        this.errorMessage.other = error.message;
        this.loading = false;
      });
  }
}
