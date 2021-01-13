import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss'],
})
export class SignupComponent implements OnInit {
  loading = false;

  errorMessage = {
    username: '',
    email: '',
    password: '',
    other: '',
  };

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    if (this.authService.isAuth$.getValue()) this.router.navigate(['lobby']);
  }

  onSignup(form: NgForm) {
    //Reset error messages
    this.errorMessage = {
      username: '',
      email: '',
      password: '',
      other: '',
    };
    //Draw loading hint
    this.loading = true;
    //Retreive data
    const username = form.value['username'];
    const email = form.value['email'];
    const password = form.value['password'];
    const passwordRepeat = form.value['password-repeat'];
    //If password does not match return
    if (password != passwordRepeat) {
      this.errorMessage.password = 'Les mot de passe doivent correspondre';
      this.loading = false;
      return;
    }
    //Call auth service to create new user
    this.authService
      .createUser(username, email, password)
      .then(() => {
        this.loading = false;
        this.router.navigate(['lobby']);
      })
      .catch((error) => {
        if (error.status == 400) {
          //Draw classic errors
          if (error.error.error == 'Pseudo vide !') {
            this.errorMessage.username = 'Veuillez saisir un pseudo valide';
          }
          if (error.error.error == 'Email invalide !') {
            this.errorMessage.email = 'Veuillez saisir une adresse mail valide';
          }
          if (error.error.error == 'Mot de passe trop court !') {
            this.errorMessage.password =
              'Veuillez saisir un mot de pass valide (8 caractères minimum)';
          }
          //If user alrdy exists catch it
          if (
            error.error.error.message &&
            error.error.error.message.includes('username')
          ) {
            this.errorMessage.username = 'Ce pseudo est déjà utilisé';
          }
          if (
            error.error.error.message &&
            error.error.error.message.includes('email')
          ) {
            this.errorMessage.email = 'Cette adresse mail est déjà utilisée';
          }
          this.loading = false;
          return;
        }
        //Catch any other error
        this.errorMessage.other = error.message;
        this.loading = false;
      });
  }
}
