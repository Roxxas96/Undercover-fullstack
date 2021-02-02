import { Player } from './Player.model';
import { User } from './User.model';

export class Room {
  name: String = '';
  max_players: Number = 0;
  players: Array<Player> = [];
  gameState: Number = 0;
  host: User = new User();
}
