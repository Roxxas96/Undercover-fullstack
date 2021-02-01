import { User } from './User.model';

export class Room {
  name: String = '';
  max_players: Number = 0;
  players: Array<{
    userInfo: User;
    words: Array<string>;
    isOwner: boolean;
    vote: boolean;
    word: string;
    voteFor: Array<Number>;
  }> = [
    {
      userInfo: new User(),
      words: [],
      isOwner: false,
      vote: false,
      word: '',
      voteFor: [],
    },
  ];
  gameState: Number = 0;
  host: User = new User();
}
