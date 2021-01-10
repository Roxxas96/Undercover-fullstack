import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Room } from '../models/Room.model';

@Injectable({
  providedIn: 'root',
})
export class GameService {
  constructor(private http: HttpClient) {}

  //Get rooms : get an array of all roms, return type ; Array<Rooms> (see Room.model for more info)
  getRooms() {
    return new Promise<Array<Room>>((resolve, reject) => {
      //HTTP request : GET
      this.http
        .get<{ result: Array<Room> }>('http://localhost:3000/api/room')
        .subscribe(
          //Returned array is stored in result key
          (res: { result: Array<Room> }) => {
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
    return new Promise<number>((resolve, reject) => {
      //POST request
      this.http
        .post<{ message: string; result: number }>(
          'http://localhost:3000/api/room/create',
          {
            roomName: roomName,
            maxPlayers: maxPlayers,
          }
        )
        .subscribe(
          //Stored in result
          (res: { message: string; result: number }) => {
            resolve(res.result);
            console.log(res);
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
  joinRoom(roomId: number) {
    return new Promise((resolve, reject) => {
      //GET Request
      this.http.get('http://localhost:3000/api/room/' + roomId).subscribe(
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
}
