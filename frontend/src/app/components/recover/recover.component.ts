import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-recover',
  templateUrl: './recover.component.html',
  styleUrls: ['./recover.component.scss'],
})
export class RecoverComponent implements OnInit {
  errorMessage = {
    email: '',
    other: '',
  };

  successMessage = '';

  loading = false;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {}

  onRecover(form: NgForm) {
    this.errorMessage = {
      email: '',
      other: '',
    };
    this.successMessage = '';
    this.loading = true;
    const email = form.value['email'];
    this.authService
      .recoverPassword(email)
      .then(() => {
        this.loading = false;
        this.successMessage =
          "Un mail vous a été envoyé. Si vous ne l'avez pas reçu, vérifiez bien vos spams ou réessayez";
      })
      .catch((error) => {
        this.loading = false;
        if (error.error.error == 'Utilisateur non trouvé !') {
          this.errorMessage.email =
            "Cette adresse mail n'est liée à aucun compte";
          return;
        }
        if (error.error.error == 'Mail déjà envoyé !') {
          this.errorMessage.email = 'Un mail vous a déjà été envoyé';
          return;
        }
        this.errorMessage.other = error.message;
      });
  }
}
