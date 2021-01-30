import { Component, OnInit, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Room } from '../../../models/Room.model';

@Component({
  selector: 'app-room-modal',
  templateUrl: './room-modal.component.html',
  styleUrls: ['./room-modal.component.scss'],
})
export class RoomModalComponent implements OnInit {
  constructor(private activeModal: NgbActiveModal) {}

  @Input() Room: Room = new Room();

  ngOnInit(): void {
    this.Room = {
      name: 'coucou',
      max_players: 10,
      players: [
        {
          userInfo: { username: 'salut' },
          words: [],
          word: '',
          vote: false,
          isOwner: false,
        },
        {
          userInfo: { username: 'saluuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuut' },
          words: [],
          word: '',
          vote: false,
          isOwner: true,
        },
        {
          userInfo: { username: 'saluuuuuuuuuuuut' },
          words: [],
          word: '',
          vote: false,
          isOwner: false,
        },
        {
          userInfo: { username: 'salut' },
          words: [],
          word: '',
          vote: false,
          isOwner: false,
        },
        {
          userInfo: {
            username:
              'saluuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuut',
          },
          words: [],
          word: '',
          vote: false,
          isOwner: false,
        },
      ],
      gameState: 0,
      host: { username: 'vvv' },
    };
  }
}
