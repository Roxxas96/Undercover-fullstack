import { NgStyle } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  isAuth$ = new BehaviorSubject<boolean>(false);
  token: string = '';
  userId: string = '';

  constructor(private http: HttpClient) {}

  //CreateUser : call backend to create new user and return success/failures
  createUser(username: string, email: string, password: string) {
    return new Promise((resolve, reject) => {
      //Send HTTP request POST
      this.http
        .post('http://localhost:3000/api/auth/signup', {
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
                resolve(null);
              })
              //Throw login errors
              .catch((error) => {
                console.log(error);
                reject(error);
              });
          },
          //Throw backend errors
          (error) => {
            console.log(error);
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
          'http://localhost:3000/api/auth/login',
          {
            login: login,
            password: password,
          }
        )
        //Catch response
        .subscribe(
          (authData: { userId: string; token: string }) => {
            //Stock local info
            this.token = authData.token;
            this.userId = authData.userId;
            this.isAuth$.next(true);
            //Stock session info
            sessionStorage.setItem('token', this.token);
            sessionStorage.setItem('userId', this.userId);
            //Stock or delete localstorage vars
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

  //Logout
  logout(forceLogout: boolean) {
    //Set local var
    this.token = '';
    this.isAuth$.next(false);
    //Force logout mean widown close/refresh
    if (!forceLogout) {
      //Remove session + local var
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('userId');
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
    }
    //Tell backen we disconnected (userId is needed)
    this.authRequest()
      .then(() => (this.userId = ''))
      .catch((error) => {
        this.userId = '';
        console.log(error);
      });
  }

  //AuthRequest : fetch session info with backend to ensure that token hasn't expired
  authRequest() {
    return new Promise((resolve, reject) => {
      //HTTP request POST
      this.http
        //Provide userId (token is in header)
        .post('http://localhost:3000/api/auth', { userId: this.userId })
        .subscribe(
          (res) => {
            resolve(null);
          },
          //Catch errors (could be wrong token or other)
          (error) => {
            console.log(error);
            reject(error);
          }
        );
    });
  }

  getConnectedPlayers() {
    return new Promise<{ message: Array<{ _id: string; username: string }> }>(
      (resolve, reject) => {
        this.http
          .get<{ message: Array<{ _id: string; username: string }> }>(
            'http://localhost:3000/api/auth'
          )
          .subscribe(
            (res: { message: Array<{ _id: string; username: string }> }) => {
              resolve(res);
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
