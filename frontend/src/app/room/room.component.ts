import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Room } from '../models/Room.model';
import { GameService } from '../services/game.service';

@Component({
  selector: 'app-room',
  templateUrl: './room.component.html',
  styleUrls: ['./room.component.scss'],
})
export class RoomComponent implements OnInit {
  roomId = -1;

  constructor(
    private gameService: GameService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.roomId = this.route.snapshot.params['roomId'];

    //TODO : Fix le bug du perso qui se déco pas de la liste des joueurs sur ce component
    window.onbeforeunload = () => {
      this.gameService.quitRoom(this.roomId);
    };
  }

  ngOnDestroy() {
    this.gameService.quitRoom(this.roomId);
  }
}
