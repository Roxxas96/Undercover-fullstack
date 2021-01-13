import { User } from './User.model';

export class Room {
  name: String = '';
  max_players: Number = 0;
  players: Array<{
    userInfo: User;
    words: Array<string>;
    isOwner: boolean;
    vote: boolean;
  }> = [{ userInfo: new User(), words: [], isOwner: false, vote: false }];
  gameTimeout: Number = -1;
  host: User = new User();
}
