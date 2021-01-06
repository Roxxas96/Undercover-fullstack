import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgForm } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { interval, Observable, Subscription } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';
import { GameService } from 'src/app/services/game.service';

import { Room } from '../../models/Room.model';
import { User } from '../../models/User.model';

@Component({
  selector: 'app-lobby',
  templateUrl: './lobby.component.html',
  styleUrls: ['./lobby.component.scss'],
})
export class LobbyComponent implements OnInit {
  errorMessageRefresh = {
    players: '',
    rooms: '',
  };
  errorMessageCreateRoom = {
    name: '',
    maxPlayers: '',
    other: '',
  };

  createRoomLoading = false;

  //Var used to update h5 on top of range bar in create room modal
  rangeBarVal = 2;

  rooms: Array<Room> = [];

  players: Array<User> = [];

  refresh = interval(1000);
  refreshSub: Subscription = new Observable().subscribe();

  constructor(
    private authService: AuthService,
    private gameService: GameService,
    private modalService: NgbModal
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
  }

  //Get an array of connected players from backend
  getPlayers() {
    this.errorMessageRefresh.players = '';
    this.authService
      .getConnectedPlayers()
      .then((users: Array<User>) => {
        //Update players array
        this.players = users;
      })
      //Catcn any errors
      .catch((error) => {
        this.errorMessageRefresh.players = error.message;
      });
  }

  //Get an array of rooms from backend
  getRooms() {
    this.errorMessageRefresh.rooms = '';
    this.gameService
      .getRooms()
      .then((rooms: Array<Room>) => {
        //Update rooms array
        this.rooms = rooms;
      })
      //Catch any errors
      .catch((error) => {
        this.errorMessageRefresh.rooms = error.message;
      });
  }

  //Open Create room popup
  openModal(modal: any) {
    this.modalService.open(modal);
  }

  //Create room : Gather form info and call gameService to create a room
  onCreateRoom(form: NgForm) {
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
        //TODO : make the player join
        this.createRoomLoading = false;
      })
      .catch((error) => {
        //Catch name unique error
        if (error.error.error == 'Nom de salle déjà pris !') {
          this.errorMessageCreateRoom.name = 'Ce nom est déjà pris';
          this.createRoomLoading = false;
          return;
        }
        //Catch invalid number error (useless in theory)
        if (error.error.error == 'Nombre de joueurs invalide !') {
          this.errorMessageCreateRoom.maxPlayers =
            'Il y a eu un problème, veuillez réessayer';
          this.createRoomLoading = false;
          return;
        }
        //Catch other errors
        this.errorMessageCreateRoom.other = error.message;
        this.createRoomLoading = false;
      });
  }
}
