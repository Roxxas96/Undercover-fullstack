import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { interval, Observable, Subscription } from 'rxjs';
import { Room } from '../../models/Room.model';
import { GameService } from '../../services/game.service';

@Component({
  selector: 'app-room',
  templateUrl: './room.component.html',
  styleUrls: ['./room.component.scss'],
})
export class RoomComponent implements OnInit {
  errorMessage = '';

  roomId = -1;

  Room: Room = {
    name: '',
    max_players: 0,
    players: [{ userInfo: { username: '' }, words: [] }],
  };

  refresh = interval(1000);
  refreshSub: Subscription = new Observable().subscribe();

  constructor(
    private gameService: GameService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.roomId = this.route.snapshot.params['roomId'];
    this.getRoomInfo();
    this.refreshSub = this.refresh.subscribe(() => {
      this.getRoomInfo();
    });
    //TODO : Fix le bug du perso qui se déco pas de la liste des joueurs sur ce component
    window.onbeforeunload = () => {
      this.gameService.quitRoom(this.roomId);
    };
  }

  ngOnDestroy() {
    this.gameService.quitRoom(this.roomId);
    this.refreshSub.unsubscribe();
  }

  getRoomInfo() {
    this.gameService
      .getSingleRoom(this.roomId)
      .then((res) => {
        //Update rooms array
        if (JSON.stringify(res) != JSON.stringify(this.Room)) {
          this.Room = res;
        }
      })
      .catch((error) => {
        this.errorMessage = error.message;
      });
  }
}
