import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LobbyComponent } from './components/lobby/lobby.component';
import { LoginComponent } from './components/login/login.component';
import { SignupComponent } from './components/signup/signup.component';
import { RoomComponent } from './components/room/room.component';
import { AuthGuard } from './services/auth.guard';
import { RecoverComponent } from './components/recover/recover.component';
import { PasswordChangeComponent } from './components/recover/password-change/password-change.component';
import { RecoverGuard } from './services/recover.guard';

const routes: Routes = [
  { path: 'lobby', canActivate: [AuthGuard], component: LobbyComponent },
  { path: 'room/:roomId', canActivate: [AuthGuard], component: RoomComponent },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'recover', component: RecoverComponent },
  {
    path: 'recover/:code',
    canActivate: [RecoverGuard],
    component: PasswordChangeComponent,
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
