import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';
import { GameService } from 'src/app/services/game.service';

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

  rooms: Array<{ name: string }> = [];

  players: Array<string> = [];

  constructor(
    private authService: AuthService,
    private gameService: GameService
  ) {}

  ngOnInit(): void {
    this.getPlayers();
    this.getRooms();
    new Observable<string>((observer) => {
      setInterval(() => {
        this.getPlayers();
        this.getRooms();
      }, 1000);
    }).subscribe();
  }

  getPlayers() {
    this.authService
      .getConnectedPlayers()
      .then((users: { message: Array<{ _id: string; username: string }> }) => {
        this.players = [];
        users.message.forEach((val) => {
          this.players.push(val.username);
        });
      })
      .catch((error) => {
        this.errorMessage = error.message;
      });
  }

  getRooms() {
    this.gameService
      .getRooms()
      .then((rooms: { message: Array<{ name: string; players: string }> }) => {
        this.rooms = [];
        rooms.message.forEach((val) => {
          this.rooms.push(val);
        });
      });
  }
}
