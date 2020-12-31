import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-lobby',
  templateUrl: './lobby.component.html',
  styleUrls: ['./lobby.component.scss'],
})
export class LobbyComponent implements OnInit {
  errorMessage = '';
  players: Array<string> = [];

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    new Observable<string>((observer) => {
      setInterval(() => {
        this.authService
          .getConnectedPlayers()
          .then(
            (users: { message: Array<{ _id: string; username: string }> }) => {
              this.players = [];
              users.message.forEach((val) => {
                this.players.push(val.username);
              });
            }
          )
          .catch((error) => {
            this.errorMessage = error.message;
          });
      }, 1000);
    }).subscribe();
  }
}
