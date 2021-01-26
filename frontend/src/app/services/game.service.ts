import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Room } from '../models/Room.model';
import { RoomSimple } from '../models/RoomSimple.model';

@Injectable({
  providedIn: 'root',
})
export class GameService {
  constructor(private http: HttpClient) {}

  //Get rooms : get an array of all roms, return type ; Array<Rooms> (see Room.model for more info)
  getRooms() {
    return new Promise<Array<RoomSimple>>((resolve, reject) => {
      //HTTP request : GET
      this.http
        .get<{
          result: Array<RoomSimple>;
        }>('http://localhost:3000/api/room')
        .subscribe(
          //Returned array is stored in result key
          (res: { result: Array<RoomSimple> }) => {
            resolve(res.result);
          },
          //Throw errors
          (error) => {
            console.log(error);
            reject(error);
          }
        );
    });
  }

  //Get single room, return type : Room
  getSingleRoom(roomId: number) {
    return new Promise<Room>((resolve, reject) => {
      //HTTP request : GET
      this.http
        .get<{ result: Room }>(
          'http://localhost:3000/api/room/' + roomId + '/get'
        )
        .subscribe(
          //Returned object is stored in result key
          (res: { result: Room }) => {
            console.log(res.result);
            resolve(res.result);
          },
          //Throw errors
          (error) => {
            console.log(error);
            reject(error);
          }
        );
    });
  }

  //Create room : call backend to create a room, return the index of created room
  createRoom(roomName: string, maxPlayers: number) {
    return new Promise((resolve, reject) => {
      //POST request
      this.http
        .post('http://localhost:3000/api/room/create', {
          roomName: roomName,
          maxPlayers: maxPlayers,
        })
        .subscribe(
          //Stored in result
          (res) => {
            resolve(null);
          },
          //Throw errors
          (error) => {
            console.log(error);
            reject(error);
          }
        );
    });
  }

  //Join room : call backend to make the player join a room and catch the result
  joinRoom(roomName: String) {
    return new Promise((resolve, reject) => {
      //GET Request
      this.http
        .get('http://localhost:3000/api/room/' + roomName + '/join')
        .subscribe(
          (res) => {
            resolve(null);
          },
          (error) => {
            //Throw
            console.log(error);
            reject(error);
          }
        );
    });
  }

  //Quit room : call back to kick player from room
  quitRoom(roomId: number) {
    return new Promise((resolve, reject) => {
      //GET Request
      this.http
        .get('http://localhost:3000/api/room/' + roomId + '/quit')
        .subscribe(
          (res) => {
            resolve(null);
          },
          (error) => {
            //Throw
            console.log(error);
            reject(error);
          }
        );
    });
  }

  //Push word : push word to player's word list
  pushWord(roomId: number, word: string) {
    return new Promise((resolve, reject) => {
      //POST Request
      this.http
        .post('http://localhost:3000/api/room/' + roomId + '/word', {
          word: word,
        })
        .subscribe(
          (res) => {
            resolve(null);
          },
          (error) => {
            //Throw
            console.log(error);
            reject(error);
          }
        );
    });
  }

  //Player vote : call back that the player wants to vote
  playerVote(roomId: number) {
    return new Promise((resolve, reject) => {
      //GET Request
      this.http
        .get('http://localhost:3000/api/room/' + roomId + '/vote')
        .subscribe(
          (res) => {
            resolve(null);
          },
          (error) => {
            //Throw
            console.log(error);
            reject(error);
          }
        );
    });
  }

  proposeWord(word1: string, word2: string) {
    return new Promise((resolve, reject) => {
      this.http
        .post('http://localhost:3000/api/words', { word1: word1, word2: word2 })
        .subscribe(
          (res) => {
            resolve(null);
          },
          (error) => {
            console.log(error);
            reject(error);
          }
        );
    });
  }

  startGame(roomId: number) {
    return new Promise((resolve, reject) => {
      this.http
        .get('http://localhost:3000/api/room/' + roomId + '/start')
        .subscribe(
          (res) => {
            resolve(res);
          },
          (error) => {
            console.log(error);
            reject(error);
          }
        );
    });
  }

  abortGame(roomId: number) {
    return new Promise((resolve, reject) => {
      this.http
        .get('http://localhost:3000/api/room/' + roomId + '/abort')
        .subscribe(
          (res) => {
            resolve(res);
          },
          (error) => {
            console.log(error);
            reject(error);
          }
        );
    });
  }
}
