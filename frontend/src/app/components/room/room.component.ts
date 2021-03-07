import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { interval, Observable, Subscription } from 'rxjs';
import { NgbModal, NgbModalConfig } from '@ng-bootstrap/ng-bootstrap';
import { Room } from '../../models/Room.model';
import { GameService } from '../../services/game.service';
import { RoomModalComponent } from './room-modal/room-modal.component';

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

  roomId = '';
  ownerIndex = -1;

  Room: Room = new Room();

  countdown = setInterval(() => {}, 1000);
  pregameLockout = -1;

  modalRef: any = '';

  refresh = interval(1000);
  refreshSub: Subscription = new Observable().subscribe();
  skipRoomRefresh = false;

  constructor(
    private gameService: GameService,
    private route: ActivatedRoute,
    private modalService: NgbModal,
    private router: Router
  ) {}

  ngOnInit(): void {
    //Store roomId from route params
    this.roomId = this.route.snapshot.params['roomId'];
    this.getRoomInfo(true);
    //Refres every sec
    this.refreshSub = this.refresh.subscribe(() => {
      //Don't update if local info prevent
      if (!this.skipRoomRefresh) this.getRoomInfo(false);
    });
  }

  ngOnDestroy() {
    //On destroy : make the player leave and unsub refresh
    this.gameService.quitRoom(this.roomId);
    this.refreshSub.unsubscribe();
    this.gameService.Room = new Room();
    this.modalService.dismissAll();
  }

  //Get room info : get the room informations from back and store in Room array
  getRoomInfo(firstTime: Boolean) {
    this.gameService
      .getSingleRoom(this.roomId)
      .then((res: Room) => {
        //Update rooms array only if different from local
        if (JSON.stringify(res) != JSON.stringify(this.Room)) {
          //Depending on game state do something
          if (res.gameState != this.Room.gameState) {
            switch (res.gameState) {
              //Results phase
              case 3:
                this.modalService.dismissAll();
                this.modalRef = this.modalService.open(RoomModalComponent);
                //Throw variables to modal
                this.modalRef.componentInstance.modalState = 1;
                this.modalRef.componentInstance.roomId = this.roomId;
                this.modalRef.componentInstance.ownerIndex = this.ownerIndex;
                break;
              //Vote phase
              case 2:
                //Show vote modal
                this.modalService.dismissAll();
                this.modalRef = this.modalService.open(RoomModalComponent);
                //Throw variables to modal
                this.modalRef.componentInstance.modalState = 0;
                this.modalRef.componentInstance.roomId = this.roomId;
                this.modalRef.componentInstance.ownerIndex = this.ownerIndex;
                break;
              //Game phase
              case 1:
                //Begin countdown only if player was here during game launch
                if (!firstTime) {
                  this.beginCountdown();
                } else this.pregameLockout = -2;
                break;
              //Pregame phase
              case 0:
                //Clear timer and reset game
                clearInterval(this.countdown);
                this.pregameLockout = -1;
            }
          }
          //Update Room
          this.Room = res;
          this.gameService.Room = res;
          //Update modal info
          if (this.modalRef.componentInstance) {
            this.modalRef.componentInstance.ParentRoom.next(this.Room);
          }
          //Update owner index too, just in case he mooved
          this.ownerIndex = this.Room.players.findIndex((val) => val.isOwner);
        }
      })
      //Throw
      .catch((error) => {
        if (error.error.error == "La salle n'existe pas !")
          return this.router.navigate(['lobby']);
        return (this.errorMessage.global = error.message);
      });
  }

  //On submit word : send submited word to backend
  onSubmitWord(form: NgForm) {
    //Reset vars
    this.errorMessage.word = '';

    //Store Data
    const word = form.value['word'];

    //Word empty error
    if (word == '') {
      this.errorMessage.word = 'Veuillez entrer un mot valide';
      return;
    }

    //Update local info
    this.Room.players[this.ownerIndex].words.push(word);
    this.skipRoomRefresh = true;

    //Tell back to update server info
    this.gameService
      .pushWord(this.roomId, word)
      .then(() => {
        form.reset();
        this.skipRoomRefresh = false;
      })
      //Throw
      .catch((error) => {
        this.errorMessage.global = error.message;
        form.reset();
        this.skipRoomRefresh = false;
      });
  }

  //On player vote : tell back player wants to vote
  onPlayerVote() {
    this.skipRoomRefresh = true;
    //Tell back to update server info
    this.gameService
      .playerVote(this.roomId)
      .then(() => {
        this.skipRoomRefresh = false;
      })
      //Throw
      .catch((error) => {
        this.errorMessage.global = error.message;
        this.skipRoomRefresh = false;
      });
    //Update local info
    this.Room.players[this.ownerIndex].vote = !this.Room.players[
      this.ownerIndex
    ].vote;
  }

  //Begin game : tell back to begin the game
  onBeginGame() {
    this.skipRoomRefresh = true;
    this.gameService
      .startGame(this.roomId)
      .then(() => {
        this.skipRoomRefresh = false;
      })
      //Throw
      .catch((error) => {
        if (error.error.error) {
          this.skipRoomRefresh = false;
          return (this.errorMessage.global = error.error.error);
        }
        this.errorMessage.global = error.message;
        this.skipRoomRefresh = false;
      });
    //Update local info
    this.Room.gameState = 1;
    this.beginCountdown();
  }

  //Abort game : tell back to abort
  onAbortGame() {
    this.skipRoomRefresh = true;
    this.gameService
      .abortGame(this.roomId)
      .then(() => {
        this.skipRoomRefresh = false;
      })
      //Throw
      .catch((error) => {
        this.errorMessage.global = error.message;
        this.skipRoomRefresh = false;
      });
    //Update local info
    this.Room.gameState = 0;
    clearInterval(this.countdown);
    this.pregameLockout = -1;
  }

  //Begin countdow : begin the countdown locally
  beginCountdown() {
    this.modalService.dismissAll();
    this.pregameLockout = 5;
    this.countdown = setInterval(() => {
      this.pregameLockout -= 1;
      //When countdown end, begin game
      if (this.pregameLockout <= 0) {
        clearInterval(this.countdown);
      }
    }, 1000);
  }

  //Draw game settings modal
  onDrawSettings() {
    this.modalService.dismissAll();
    this.modalRef = this.modalService.open(RoomModalComponent);
    //Throw variables to modal
    this.modalRef.componentInstance.modalState = 2;
    this.modalRef.componentInstance.ParentRoomId = this.roomId;
    this.modalRef.componentInstance.ownerIndex = this.ownerIndex;
    this.modalRef.componentInstance.ParentRoom.next(this.Room);
  }
}
