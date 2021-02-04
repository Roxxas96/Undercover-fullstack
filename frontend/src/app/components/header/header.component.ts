import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbModal, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from 'src/app/services/auth.service';
import { GameService } from 'src/app/services/game.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit {
  errorMessage = {
    word1: '',
    word2: '',
    global: '',
  };

  Loading = false;

  isAuth = false;

  slideMenu = false;

  constructor(
    private authService: AuthService,
    private modalService: NgbModal,
    private gameService: GameService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.isAuth$.subscribe((auth) => (this.isAuth = auth));
  }

  onLogout() {
    this.slideMenu = false;
    this.authService.logout(false);
  }

  //Open Propose word popup
  openModal(modal: any) {
    this.slideMenu = false;
    this.modalService.open(modal);
  }

  isInRoom() {
    return new RegExp('/room').test(this.router.url);
  }

  onProposeWord(form: NgForm, modal: NgbActiveModal) {
    this.Loading = true;
    this.errorMessage = {
      word1: '',
      word2: '',
      global: '',
    };

    const word1 = form.value['word1'];
    const word2 = form.value['word2'];

    this.gameService
      .proposeWord(word1, word2)
      .then(() => {
        this.Loading = false;
        modal.dismiss();
      })
      .catch((error) => {
        if (error.status == 400) {
          if (error.error.error == 'Mot 1 invalide !') {
            this.errorMessage.word1 = 'Veuillez entrer un mot valide';
          }
          if (error.error.error == 'Mot 2 invalide !') {
            this.errorMessage.word2 = 'Veuillez entrer un mot valide';
          }
          if (
            error.error.error.message &&
            error.error.error.message.includes('unique')
          ) {
            this.errorMessage.word1 =
              'Ce couple est déjà dans la base de données';
            this.errorMessage.word2 = ' ';
          }
          this.Loading = false;
          return;
        }
        this.errorMessage.global = error.message;
        this.Loading = false;
      });
  }
}
