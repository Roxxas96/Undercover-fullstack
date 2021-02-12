import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-password-change',
  templateUrl: './password-change.component.html',
  styleUrls: ['./password-change.component.scss'],
})
export class PasswordChangeComponent implements OnInit {
  errorMessage = {
    password: '',
    other: '',
  };
  loading = false;

  successMessage = '';

  navigateTimeout = setTimeout(() => {}, 5000);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {}

  onChangePassword(form: NgForm) {
    clearTimeout(this.navigateTimeout);
    //Reset error messages
    this.errorMessage = {
      password: '',
      other: '',
    };
    //Draw loading hint
    this.loading = true;
    //Retreive data
    const password = form.value['password'];
    const passwordRepeat = form.value['password-repeat'];
    const code = this.route.snapshot.params['code'];
    //If password does not match return
    if (password != passwordRepeat) {
      this.errorMessage.password = 'Les mot de passe doivent correspondre';
      this.loading = false;
      return;
    }
    //Call auth service to create new user
    this.authService
      .changePassword(code, password)
      .then(() => {
        this.loading = false;
        this.successMessage =
          'Votre mot de passe a été changé, vous serez redirigé vers la page de connexion dans 5 secondes';
        this.navigateTimeout = setTimeout(() => {
          this.router.navigate(['login']);
        }, 5000);
      })
      .catch((error) => {
        this.loading = false;
        if (error.error.error == 'Mot de passe trop court !') {
          this.errorMessage.password =
            'Veuillez saisir un mot de pass valide (8 caractères minimum)';
          return;
        }
        if (error.error.error == 'Code invalide !') {
          this.errorMessage.other =
            "Une erreur est survenue ! L'URL sur laquelle vous vous trouvez est invalide. Veuillez repasser par la page mot de passe oublié";
          return;
        }
        //Catch any other error
        this.errorMessage.other = error.message;
      });
  }
}
