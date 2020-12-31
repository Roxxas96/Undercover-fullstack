import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class GameService {
  constructor(private http: HttpClient) {}

  getRooms() {
    return new Promise<{ message: Array<{ name: string; players: string }> }>(
      (resolve, reject) => {
        this.http
          .get<{ message: Array<{ name: string; players: string }> }>(
            'http://localhost:3000/api/room'
          )
          .subscribe(
            (rooms: { message: Array<{ name: string; players: string }> }) => {
              resolve(rooms);
            },
            (error) => {
              console.log(error);
              reject(error);
            }
          );
      }
    );
  }
}
