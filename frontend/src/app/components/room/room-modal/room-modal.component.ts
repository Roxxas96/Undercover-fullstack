import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { NgForm } from '@angular/forms';
import { NgbActiveModal, NgbModalConfig } from '@ng-bootstrap/ng-bootstrap';
import { BehaviorSubject } from 'rxjs';
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

  @Input() ParentRoom = new BehaviorSubject<Room>(new Room());
  @Input() roomId = '';
  @Input() ownerIndex = -1;
  @Input() modalState = 0;

  Room: Room = new Room();

  timeOut = -1;
  countdown = setInterval(() => {}, 1000);
  numVotes = 0;

  undercovers: Array<{ userInfo: Player; voted: boolean }> = [];
  civilians: Array<{ userInfo: Player; voted: boolean }> = [];
  spectators: Array<Player> = [];

  errorMessage = {
    name: '',
    maxPlayers: '',
    other: '',
  };
  loading = false;

  like = 0;

  skipRoomRefresh = false;

  //Var used to update h5 on top of range bar in create room modal
  rangeBarVal: Number = 3;

  //Players have 20 sec to vote
  ngOnInit(): void {
    this.ParentRoom.subscribe((observer) => {
      if (!this.skipRoomRefresh) this.Room = observer;
    });
    //Handle spectators (they need to be ignored when dealing with game functions)
    this.spectators = this.Room.players.filter((player) => player.word == '');
    switch (this.modalState) {
      //Vote modal
      case 0:
        //Register number of available votes
        this.numVotes = Math.round(
          (this.Room.players.length - this.spectators.length) / 3
        );
        //Begin countdown
        this.beginCountdown();
        break;
      //Results modal
      case 1:
        //Push 1 player to be the reference
        this.civilians.push({
          userInfo: this.Room.players[0],
          //Players have a voted var to identify if owner has voted them
          voted: this.Room.players[this.ownerIndex].voteFor.find(
            (val) => val == '0'
          )
            ? true
            : false,
        });
        //Compare all other players words to this player's word and push them to the arrays
        this.Room.players.forEach((player, key) => {
          //Ignore ref
          if (key == 0) return;
          //Ignore spec
          if (
            this.spectators.find(
              (spec) => spec.userInfo.username == player.userInfo.username
            )
          )
            return;
          if (player.word != this.civilians[0].userInfo.word)
            this.undercovers.push({
              userInfo: player,
              voted: this.Room.players[this.ownerIndex].voteFor.find(
                (val) => val == key.toString()
              )
                ? true
                : false,
            });
          else
            this.civilians.push({
              userInfo: player,
              voted: this.Room.players[this.ownerIndex].voteFor.find(
                (val) => val == key.toString()
              )
                ? true
                : false,
            });
        });
        //If arrays are twisted, invers them (undercovers length should be < civilians length)
        if (this.undercovers.length > this.civilians.length) {
          let temp = this.civilians;
          this.civilians = this.undercovers;
          this.undercovers = temp;
        }
        break;
      //Game settings modal
      case 2:
        this.rangeBarVal = this.Room.max_players;
        break;
    }
  }

  ngOnDestroy() {
    this.gameService
      .likeWords(
        this.like,
        this.undercovers[0].userInfo.word +
          '/' +
          this.civilians[0].userInfo.word
      )
      .catch((error) => {
        this.errorMessage.other = error.message;
      });
  }

  //onVote : tell back that the player want to vote for a target
  onVote(playerIndex: number, cancelVote: boolean) {
    this.skipRoomRefresh = true;
    if (cancelVote) {
      const targetIndex = this.Room.players[this.ownerIndex].voteFor.findIndex(
        (val) => val == playerIndex.toString()
      );
      if (targetIndex != -1)
        this.Room.players[this.ownerIndex].voteFor.splice(targetIndex, 1);
    } else {
      if (this.numVotes == 0) {
        this.Room.players[this.ownerIndex].voteFor.splice(0, 1);
      }
      this.Room.players[this.ownerIndex].voteFor.push(playerIndex.toString());
    }
    this.numVotes = cancelVote
      ? Math.min(
          Math.round((this.Room.players.length - this.spectators.length) / 3),
          this.numVotes + 1
        )
      : Math.max(0, this.numVotes - 1);
    this.gameService
      .voteFor(this.roomId, playerIndex)
      .then(() => {
        this.skipRoomRefresh = false;
      })
      .catch((error) => {
        this.skipRoomRefresh = false;
        this.errorMessage.other = error.message;
      });
  }

  //voteDone : Determin if player has used all his votes in order to draw a hint
  voteDone(index: number) {
    return (
      this.Room.players[index].voteFor.length >=
      Math.round((this.Room.players.length - this.spectators.length) / 3)
    );
  }

  //is Voted : Determin if a certain player is voted by the client in order to draw cancel button
  isVoted(index: number) {
    return this.Room.players[this.ownerIndex].voteFor.find(
      (val) => val == index.toString()
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

  onModifyRoom(form: NgForm) {
    //Reset var & draw loading hint
    this.loading = true;
    this.errorMessage = {
      name: '',
      maxPlayers: '',
      other: '',
    };
    //Retreive form data
    const maxPlayers = form.value['max-players'];
    //Call gameService createRoom func
    this.gameService
      .modifyRoom(maxPlayers, this.Room.name)
      .then(() => {
        //If creation succeded hide loading hint
        this.loading = false;
        this.dismissModal();
      })
      .catch((error) => {
        this.loading = false;
        if (error.status == 400) {
          //Catch invalid name (empty name) error
          if (error.error.error == 'Nom de la salle vide !') {
            this.errorMessage.name = 'Veuillez saisir un nom de salle valide';
          }
          //Catch name unique error
          if (error.error.error == 'Nom de salle déjà pris !') {
            this.errorMessage.name = 'Ce nom est déjà pris';
          }
          //Catch invalid number error (useless in theory)
          if (error.error.error == 'Nombre de joueurs invalide !') {
            this.errorMessage.maxPlayers =
              'Il y a eu un problème, veuillez réessayer';
          }
          if (
            error.error.error == 'Nombre de joueurs au dessus de la limite !'
          ) {
            this.errorMessage.maxPlayers =
              'Il y a trop de joueurs dans la salle pour cette limite';
          }
          return;
        }

        //Catch other errors
        this.errorMessage.other = error.message;
      });
  }

  dismissModal() {
    this.activeModal.dismiss();
  }

  onLike(like: boolean) {
    const operator = like ? 1 : -1;
    if (this.like == operator) this.like = 0;
    else this.like = operator;
  }
}
