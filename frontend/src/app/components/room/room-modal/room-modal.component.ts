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

  ngOnInit(): void {}

  onVote(playerIndex: number) {
    this.gameService.voteFor(this.roomId, playerIndex);
  }

  voteDone(index: number) {
    return (
      this.Room.players[index].voteFor.length >=
      Math.round((this.Room.players.length - this.numSpectators) / 3)
    );
  }

  isVoted(index: number) {
    return this.Room.players[this.ownerIndex].voteFor.find(
      (val) => val == index
    );
  }
}
