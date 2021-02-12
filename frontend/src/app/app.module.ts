import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { SignupComponent } from './components/signup/signup.component';
import { FormsModule } from '@angular/forms';
import { AuthService } from './services/auth.service';
import { LoginComponent } from './components/login/login.component';
import { LobbyComponent } from './components/lobby/lobby.component';
import { AuthInterceptor } from './services/auth.interceptor';
import { HeaderComponent } from './components/header/header.component';
import { AuthGuard } from './services/auth.guard';
import { GameService } from './services/game.service';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { RoomComponent } from './components/room/room.component';
import { CommonModule } from '@angular/common';
import { RoomModalComponent } from './components/room/room-modal/room-modal.component';
import { RecoverComponent } from './components/recover/recover.component';
import { PasswordChangeComponent } from './components/recover/password-change/password-change.component';
import { RecoverGuard } from './services/recover.guard';

@NgModule({
  declarations: [
    AppComponent,
    SignupComponent,
    LoginComponent,
    LobbyComponent,
    HeaderComponent,
    RoomComponent,
    RoomModalComponent,
    RecoverComponent,
    PasswordChangeComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
    NgbModule,
    CommonModule,
  ],
  providers: [
    AuthService,
    AuthGuard,
    RecoverGuard,
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    GameService,
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
