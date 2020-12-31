import { Component, OnInit, OnDestroy } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
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
  errorMessage = {
    players: '',
    rooms: '',
  };

  rooms: Array<Room> = [];

  players: Array<User> = [];

  refresh: Subscription = new Observable<string>().subscribe();

  constructor(
    private authService: AuthService,
    private gameService: GameService
  ) {}

  ngOnInit(): void {
    this.getPlayers();
    this.getRooms();
    //Refresh data every sec
    this.refresh = new Observable<string>((observer) => {
      setInterval(() => {
        this.getPlayers();
        this.getRooms();
      }, 1000);
    }).subscribe();
  }

  ngOnDestroy() {
    this.refresh.unsubscribe();
  }

  //Get an array of connected players from backend
  getPlayers() {
    this.authService
      .getConnectedPlayers()
      .then((users: Array<User>) => {
        //Update players array
        this.players = users;
      })
      //Catcn any errors
      .catch((error) => {
        this.errorMessage.players = error.message;
      });
  }

  //Get an array of rooms from backend
  getRooms() {
    this.gameService
      .getRooms()
      .then((rooms: Array<Room>) => {
        //Update rooms array
        this.rooms = rooms;
      })
      //Catch any errors
      .catch((error) => {
        this.errorMessage.rooms = error.message;
      });
  }
}
