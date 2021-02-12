import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { interval, Observable, Subscription } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';
import { GameService } from 'src/app/services/game.service';

import { User } from '../../models/User.model';
import { RoomSimple } from '../../models/RoomSimple.model';

@Component({
  selector: 'app-lobby',
  templateUrl: './lobby.component.html',
  styleUrls: ['./lobby.component.scss'],
})
export class LobbyComponent implements OnInit {
  errorMessageMain = {
    players: '',
    rooms: '',
  };
  errorMessageCreateRoom = {
    name: '',
    maxPlayers: '',
    other: '',
  };

  createRoomLoading = false;
  joinRoomLoading: String = '';

  //Var used to update h5 on top of range bar in create room modal
  rangeBarVal = 3;

  rooms: Array<RoomSimple> = [];

  players: Array<User> = [];

  refresh = interval(1000);
  refreshSub: Subscription = new Observable().subscribe();

  constructor(
    private authService: AuthService,
    private gameService: GameService,
    private modalService: NgbModal,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.getPlayers();
    this.getRooms();
    //Refresh data every sec
    this.refreshSub = this.refresh.subscribe(() => {
      this.getPlayers();
      this.getRooms();
    });
  }

  //On lobby quit stop refreshing
  ngOnDestroy() {
    this.refreshSub.unsubscribe();
    this.modalService.dismissAll();
  }

  //Get an array of connected players from backend
  getPlayers() {
    this.authService
      .getConnectedPlayers()
      .then((users: Array<User>) => {
        //Update players array only if different from local
        if (JSON.stringify(users) != JSON.stringify(this.players))
          this.players = users;
      })
      //Catcn any errors
      .catch((error) => {
        this.errorMessageMain.players = error.message;
      });
  }

  //Get an array of rooms from backend
  getRooms() {
    this.gameService
      .getRooms()
      .then((rooms: Array<RoomSimple>) => {
        //Update rooms array only if different from local
        if (JSON.stringify(rooms) != JSON.stringify(this.rooms)) {
          this.rooms = rooms;
        }
      })
      //Catch any errors
      .catch((error) => {
        this.errorMessageMain.rooms = error.message;
      });
  }

  //Open Create room popup
  openModal(modal: any) {
    this.modalService.open(modal);
  }

  //Create room : Gather form info and call gameService to create a room
  onCreateRoom(form: NgForm, modal: NgbActiveModal) {
    //Reset var & draw loading hint
    this.createRoomLoading = true;
    this.errorMessageCreateRoom = {
      name: '',
      maxPlayers: '',
      other: '',
    };
    //Retreive form data
    const roomName = form.value['name'];
    const maxPlayers = form.value['max-players'];
    //Call gameService createRoom func
    this.gameService
      .createRoom(roomName, maxPlayers)
      .then(() => {
        //If creation succeded hide loading hint
        this.createRoomLoading = false;
        modal.dismiss();
        this.onJoinRoom(roomName);
      })
      .catch((error) => {
        this.createRoomLoading = false;
        if (error.status == 400) {
          //Catch invalid name (empty name) error
          if (error.error.error == 'Nom de la salle vide !') {
            this.errorMessageCreateRoom.name =
              'Veuillez saisir un nom de salle valide';
          }
          //Catch name unique error
          if (error.error.error == 'Nom de salle déjà pris !') {
            this.errorMessageCreateRoom.name = 'Ce nom est déjà pris';
          }
          //Catch invalid number error (useless in theory)
          if (error.error.error == 'Nombre de joueurs invalide !') {
            this.errorMessageCreateRoom.maxPlayers =
              'Nombre de joueurs invalide';
          }
          return;
        }

        //Catch other errors
        this.errorMessageCreateRoom.other = error.message;
      });
  }

  //Join room : make the player join a room
  onJoinRoom(roomName: String) {
    this.joinRoomLoading = roomName;
    this.gameService
      .joinRoom(roomName)
      .then(() => {
        this.joinRoomLoading = '';
        this.router.navigate(['room/' + roomName]);
      })
      .catch((error) => {
        this.joinRoomLoading = '';
        //Error : User already in the game
        if (error.error.error == 'Cet user est déjà dans la parite !') {
          this.errorMessageMain.rooms =
            'Une érreur est survenue ! Vous semblez déjà être dans la partie. Si vous avez eu un problème de connexion, attendez quelques seccondes (10 max)';
          return;
        }
        //Error unknown room (useless in theory)
        if (error.error.error == "Cette salle n'existe pas !") {
          this.errorMessageMain.rooms =
            "Il semblerait que cette salle n'existe pas, veuillez réssayer";
          return;
        }
        //Error : room full
        if (error.error.error == 'La salle est pleine !') {
          this.errorMessageMain.rooms = 'Cette salle est pleine';
          return;
        }
        //Other errors
        this.errorMessageMain.rooms = error.message;
      });
  }
}
