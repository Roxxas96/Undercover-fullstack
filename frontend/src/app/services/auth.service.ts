import { NgStyle } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { User } from '../models/User.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  isAuth$ = new BehaviorSubject<boolean>(false);
  token: string = '';
  userId: string = '';

  serverUnvailable = false;

  constructor(private http: HttpClient) {}

  //CreateUser : call backend to create new user and return success/failures
  createUser(username: string, email: string, password: string) {
    return new Promise((resolve, reject) => {
      //Send HTTP request POST
      this.http
        .post('https://play-undercover.herokuapp.com/api/auth/signup', {
          username: username,
          email: email,
          password: password,
        })
        //Catch response
        .subscribe(
          (result) => {
            //And login
            this.login(email, password, false)
              .then(() => {
                if (this.serverUnvailable) location.reload();
                resolve(null);
              })
              //Throw login errors
              .catch((error) => {
                console.log(error);
                if (error.status == 0) {
                  error = { message: 'Serveur introuvable !' };
                  this.serverUnvailable = true;
                }
                reject(error);
              });
          },
          //Throw backend errors
          (error) => {
            console.log(error);
            if (error.status == 0) {
              error = { message: 'Serveur introuvable !' };
              this.serverUnvailable = true;
            }
            reject(error);
          }
        );
    });
  }

  //Login : call backend to fatch user provided info with DB and return success/failures
  login(login: string, password: string, autoConnect: boolean) {
    return new Promise((resolve, reject) => {
      //Send HTTP request POST
      this.http
        .post<{ userId: string; token: string }>(
          'https://play-undercover.herokuapp.com/api/auth/login',
          {
            login: login,
            password: password,
          }
        )
        //Catch response
        .subscribe(
          (authData: { userId: string; token: string }) => {
            //Store local info
            this.token = authData.token;
            this.userId = authData.userId;
            this.isAuth$.next(true);
            //Store session info
            sessionStorage.setItem('token', this.token);
            sessionStorage.setItem('userId', this.userId);
            //Store or delete localstorage vars
            switch (autoConnect) {
              case true: {
                localStorage.setItem('token', this.token);
                localStorage.setItem('userId', this.userId);
                break;
              }
              case false: {
                localStorage.removeItem('token');
                localStorage.removeItem('userId');
              }
            }
            if (this.serverUnvailable) location.reload();
            resolve(null);
          },
          //Throw errors
          (error) => {
            console.log(error);
            if (error.status == 0) {
              error = { message: 'Serveur introuvable !' };
              this.serverUnvailable = true;
            }
            reject(error);
          }
        );
    });
  }

  //Logout
  logout(forceLogout: boolean) {
    //Set local var
    this.userId = '';
    this.isAuth$.next(false);
    //Force logout mean widown close/refresh
    if (!forceLogout) {
      //Remove session + local var
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('userId');
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
    }
    //Tell backen we disconnected
    this.http
      .get('https://play-undercover.herokuapp.com/api/auth/logout')
      .subscribe(
        () => {
          if (this.serverUnvailable) location.reload();
          this.token = '';
        },
        (error) => {
          console.log(error);
          if (error.status == 0) {
            error = { message: 'Serveur introuvable !' };
            this.serverUnvailable = true;
          }
          this.token = '';
        }
      );
  }

  //AuthRequest : fetch session info with backend to ensure that token hasn't expired
  authRequest() {
    return new Promise((resolve, reject) => {
      //HTTP request GET
      this.http
        //Provide userId (token is in header)
        .get('https://play-undercover.herokuapp.com/api/auth')
        .subscribe(
          (res) => {
            if (this.serverUnvailable) location.reload();
            resolve(null);
          },
          //Catch errors (could be wrong token or other)
          (error) => {
            console.log(error);
            if (error.status == 0) {
              error = { message: 'Serveur introuvable !' };
              this.serverUnvailable = true;
            }
            reject(error);
          }
        );
    });
  }

  //Get connected players : return an array of connected players, return type : Array<User> (see User.model for more info)
  getConnectedPlayers() {
    return new Promise<Array<User>>((resolve, reject) => {
      //HTTP request : GET
      this.http
        .get<{ result: Array<User> }>(
          'https://play-undercover.herokuapp.com/api/auth/players'
        )
        .subscribe(
          //Returned array is stored in result key
          (res: { result: Array<User> }) => {
            if (this.serverUnvailable) location.reload();
            resolve(res.result);
          },
          //Catch errors
          (error) => {
            console.log(error);
            if (error.status == 0) {
              error = { message: 'Serveur introuvable !' };
              this.serverUnvailable = true;
            }
            reject(error);
          }
        );
    });
  }

  recoverPassword(email: string) {
    return new Promise((resolve, reject) => {
      this.http
        .post('https://play-undercover.herokuapp.com/api/auth/recover', {
          email: email,
        })
        .subscribe(
          (res) => {
            console.log(res);
            resolve(null);
          },
          (error) => {
            console.log(error);
            reject(error);
          }
        );
    });
  }
}
