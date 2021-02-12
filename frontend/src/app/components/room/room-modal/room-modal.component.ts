import { Component, OnInit, Input } from '@angular/core';
import { NgForm } from '@angular/forms';
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
  @Input() roomId = '';
  @Input() ownerIndex = -1;
  @Input() modalState = 0;

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

  //Var used to update h5 on top of range bar in create room modal
  rangeBarVal: Number = 3;

  //Players have 20 sec to vote
  ngOnInit(): void {
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
            (val) => val == 0
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
                (val) => val == key
              )
                ? true
                : false,
            });
          else
            this.civilians.push({
              userInfo: player,
              voted: this.Room.players[this.ownerIndex].voteFor.find(
                (val) => val == key
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
      Math.round((this.Room.players.length - this.spectators.length) / 3)
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

  onModifyRoom(form: NgForm) {
    //Reset var & draw loading hint
    this.loading = true;
    this.errorMessage = {
      name: '',
      maxPlayers: '',
      other: '',
    };
    //Retreive form data
    const roomName = form.value['name'];
    const maxPlayers = form.value['max-players'];
    //Call gameService createRoom func
    this.gameService
      .modifyRoom(maxPlayers, this.roomId)
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
}
