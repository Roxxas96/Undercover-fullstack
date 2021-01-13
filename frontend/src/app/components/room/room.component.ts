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
  ownerIndex = -1;

  Room: Room = new Room();

  refresh = interval(1000);
  refreshSub: Subscription = new Observable().subscribe();
  //Used when pushing word or voting to prevent server to tell local that variables are wrong (ppl with more than 1s ping can still have this issue)
  skipRefresh = false;

  constructor(
    private gameService: GameService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    //Store roomId from route params
    this.roomId = this.route.snapshot.params['roomId'];
    this.getRoomInfo();
    //Refres every sec
    this.refreshSub = this.refresh.subscribe(() => {
      //Don't update if local info prevent
      if (!this.skipRefresh) this.getRoomInfo();
      this.skipRefresh = false;
    });
  }

  ngOnDestroy() {
    //On destroy : make the player leave and unsub refresh
    this.gameService.quitRoom(this.roomId);
    this.refreshSub.unsubscribe();
  }

  //Get room info : get the room informations from back and store in Room array
  getRoomInfo() {
    this.gameService
      .getSingleRoom(this.roomId)
      .then((res) => {
        //Update rooms array only if different from local
        if (JSON.stringify(res) != JSON.stringify(this.Room)) {
          this.Room = res;
          //Update owner index too, just in case he mooved
          this.ownerIndex = this.Room.players.findIndex((val) => val.isOwner);
        }
      })
      //Throw
      .catch((error) => {
        this.errorMessage = error.message;
      });
  }

  //On submit word : send submited word to backend
  onSubmitWord(form: NgForm) {
    //Reset vars
    this.errorMessage.word = '';
    this.WordLoading = true;

    //Store Data
    const word = form.value['word'];

    //Word empty error
    if (word == '') {
      this.WordLoading = false;
      this.errorMessage.word = 'Veuillez entrer un mot valide';
      return;
    }

    //Update local info
    this.Room.players[this.ownerIndex].words.push(word);
    this.skipRefresh = true;

    //Tell back to update server info
    this.gameService
      .pushWord(this.roomId, word)
      .then(() => {
        this.WordLoading = false;
        form.reset();
      })
      //Throw
      .catch((error) => {
        this.errorMessage.global = error.message;
        this.WordLoading = false;
        form.reset();
      });
  }

  //On player vote : tell back player wants to vote
  onPlayerVote() {
    this.VoteLoading = true;

    //Tell back to update server info
    this.gameService
      .playerVote(this.roomId)
      .then(() => {
        this.VoteLoading = false;
      })
      //Throw
      .catch((error) => {
        this.errorMessage.global = error.message;
        this.VoteLoading = false;
      });

    //Update local info
    this.Room.players[this.ownerIndex].vote = !this.Room.players[
      this.ownerIndex
    ].vote;
    this.skipRefresh = true;
  }
}
