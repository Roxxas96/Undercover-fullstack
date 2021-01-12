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

  WordLoading = false;
  VoteLoading = false;

  roomId = -1;

  Room: Room = new Room();

  refresh = interval(1000);
  refreshSub: Subscription = new Observable().subscribe();

  ownerIndex = -1;

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
          this.ownerIndex = this.Room.players.findIndex((val) => val.isOwner);
        }
      })
      .catch((error) => {
        this.errorMessage = error.message;
      });
  }

  onSubmitWord(form: NgForm) {
    this.errorMessage.word = '';
    this.WordLoading = true;

    const word = form.value['word'];

    if (word == '') {
      this.WordLoading = false;
      this.errorMessage.word = 'Veuillez entrer un mot valide';
      return;
    }

    this.Room.players[this.ownerIndex].words.push(word);

    this.gameService
      .pushWord(this.roomId, word)
      .then(() => {
        this.WordLoading = false;
        form.reset();
      })
      .catch((error) => {
        this.errorMessage.global = error.message;
        this.WordLoading = false;
        form.reset();
      });
  }

  onPlayerVote() {
    this.VoteLoading = true;

    this.gameService
      .playerVote(this.roomId)
      .then(() => {
        this.VoteLoading = false;
      })
      .catch((error) => {
        this.errorMessage.global = error.message;
        this.VoteLoading = false;
      });

    this.Room.players[this.ownerIndex].vote = !this.Room.players[
      this.ownerIndex
    ].vote;
  }
}
