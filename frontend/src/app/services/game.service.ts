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
}
