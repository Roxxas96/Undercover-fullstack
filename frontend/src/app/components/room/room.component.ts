import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { NgForm } from '@angular/forms';
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
  errorMessage = {
    global: '',
    word: '',
  };

  Loading = false;

  roomId = -1;

  Room: Room = {
    name: '',
    max_players: 0,
    players: [{ userInfo: { username: '' }, words: [], isOwner: false }],
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

  onSubmitWord(form: NgForm) {
    this.errorMessage.word = '';
    this.Loading = true;

    const word = form.value['word'];

    if (word == '') {
      this.Loading = false;
      this.errorMessage.word = 'Veuillez entrer un mot valide';
      return;
    }

    const ownerIndex = this.Room.players.findIndex((val) => val.isOwner);

    this.Room.players[ownerIndex].words.push(word);

    this.gameService
      .pushWord(this.roomId, word)
      .then(() => {
        this.Loading = false;
        form.reset();
      })
      .catch((error) => {
        this.errorMessage.global = error.message;
        this.Loading = false;
        form.reset();
      });
  }
}
