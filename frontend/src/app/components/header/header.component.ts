import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  NgbModal,
  NgbActiveModal,
  NgbPopover,
} from '@ng-bootstrap/ng-bootstrap';
import { Player } from 'src/app/models/Player.model';
import { User } from 'src/app/models/User.model';
import { AuthService } from 'src/app/services/auth.service';
import { GameService } from 'src/app/services/game.service';
import { RoomModalComponent } from '../room/room-modal/room-modal.component';

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

  @ViewChild('popover') public popover: NgbPopover;

  constructor(
    private authService: AuthService,
    private modalService: NgbModal,
    private gameService: GameService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.popover = NgbPopover.prototype;
  }

  ngOnInit(): void {
    this.authService.isAuth$.subscribe((auth) => (this.isAuth = auth));
  }

  ngAfterViewInit() {
    this.popover.open();
    setTimeout(() => {
      this.popover.close();
    }, 10000);
  }

  onLogout() {
    this.slideMenu = false;
    this.authService.logout(false);
  }

  //Open Propose word popup
  openModal(modal: any) {
    this.slideMenu = false;
    return this.modalService.open(modal);
  }

  isInRoom() {
    return this.gameService.RoomComponent.Room;
  }

  isHost() {
    return this.isInRoom()
      ? this.gameService.RoomComponent.Room.host.username ==
          this.gameService.RoomComponent.Room.players.find(
            (val: Player) => val.isOwner
          )?.userInfo.username
      : false;
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
        this.Loading = false;
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
          return;
        }
        this.errorMessage.global = error.message;
      });
  }

  onDeployGameSettings() {
    this.gameService.RoomComponent.onDrawSettings();
  }

  onDrawVote() {
    this.gameService.RoomComponent.onDrawVote();
  }

  isVoteModalActive() {
    return this.isInRoom()
      ? this.gameService.RoomComponent.modalRef.componentInstance
      : false;
  }

  getVoteLockout() {
    return this.gameService.RoomComponent.voteLockout;
  }
  getPlayers() {
    return this.gameService.LobbyComponent.players;
  }
}
