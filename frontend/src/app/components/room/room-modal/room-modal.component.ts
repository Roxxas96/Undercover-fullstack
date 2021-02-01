import { Component, OnInit, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
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
    private gameService: GameService
  ) {}

  @Input() Room: Room = new Room();
  @Input() numSpectators = 0;
  @Input() roomId = '';
  @Input() ownerIndex = -1;

  voteLockout = -1;
  countdown = setInterval(() => {}, 1000);

  //Players have 20 sec to vote
  ngOnInit(): void {
    this.beginCountdown();
  }

  //onVote : tell back that the player want to vote for a target
  onVote(playerIndex: number) {
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
    this.voteLockout = Math.round(this.Room.players.length / 3) * 10;
    this.countdown = setInterval(() => {
      this.voteLockout -= 1;
      //On countdown end dismiss modal
      if (this.voteLockout <= 0) {
        clearInterval(this.countdown);
        this.activeModal.dismiss();
      }
    }, 1000);
  }
}
