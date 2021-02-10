import { Component, OnInit, Input } from '@angular/core';
import { NgbActiveModal, NgbModalConfig } from '@ng-bootstrap/ng-bootstrap';
import { Player } from 'src/app/models/Player.model';
import { GameService } from 'src/app/services/game.service';
import { Room } from '../../../models/Room.model';

@Component({
  selector: 'app-room-modal',
  templateUrl: './room-modal.component.html',
  styleUrls: ['./room-modal.component.scss'],
})
export class RoomModalComponent implements OnInit {
  constructor(
    private activeModal: NgbActiveModal,
    private gameService: GameService,
    private modalConfig: NgbModalConfig
  ) {}

  @Input() Room: Room = new Room();
  @Input() numSpectators = 0;
  @Input() roomId = '';
  @Input() ownerIndex = -1;
  @Input() results = false;

  timeOut = -1;
  countdown = setInterval(() => {}, 1000);
  numVotes = 0;

  undercovers: Array<Player> = [];
  civilians: Array<Player> = [];
  spectators: Array<Player> = [];

  //Players have 20 sec to vote
  ngOnInit(): void {
    //Handle spectators (they need to be ignored when dealing with game functions)
    this.spectators = this.Room.players.filter((player) => player.word == '');
    if (this.results) {
      this.civilians.push(this.Room.players[0]);
      this.Room.players.forEach((val, key) => {
        if (key == 0) return;
        if (
          this.spectators.find(
            (spec) => spec.userInfo.username == val.userInfo.username
          )
        )
          return;
        if (val.word != this.civilians[0].word) this.undercovers.push(val);
        else this.civilians.push(val);
      });
      if (this.undercovers.length > this.civilians.length) {
        let temp = this.civilians;
        this.civilians = this.undercovers;
        this.undercovers = temp;
      }
    } else {
      this.numVotes = Math.round(
        (this.Room.players.length - this.spectators.length) / 3
      );
      this.beginCountdown();
    }
  }

  //onVote : tell back that the player want to vote for a target
  onVote(playerIndex: number, cancelVote: boolean) {
    this.numVotes = cancelVote
      ? Math.min(
          Math.round((this.Room.players.length - this.spectators.length) / 3),
          this.numVotes + 1
        )
      : Math.max(0, this.numVotes - 1);
    this.gameService.voteFor(this.roomId, playerIndex);
  }

  //voteDone : Determin if player has used all his votes in order to draw a hint
  voteDone(index: number) {
    return (
      this.Room.players[index].voteFor.length >=
      Math.round((this.Room.players.length - this.numSpectators) / 3)
    );
  }

  //is Voted : Determin if a certain player is voted by the client in order to draw cancel button
  isVoted(index: number) {
    return this.Room.players[this.ownerIndex].voteFor.find(
      (val) => val == index
    );
  }

  //Begin vote countdown
  beginCountdown() {
    this.timeOut = Math.round(this.Room.players.length / 3) * 10;
    this.countdown = setInterval(() => {
      this.timeOut -= 1;
      //On countdown end dismiss modal
      if (this.timeOut <= 0) {
        clearInterval(this.countdown);
        this.modalConfig.backdrop = true;
        this.modalConfig.keyboard = true;
        this.activeModal.dismiss();
      }
    }, 1000);
  }

  dismissModal() {
    this.activeModal.dismiss();
  }
}
