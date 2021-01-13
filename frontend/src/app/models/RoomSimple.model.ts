export class RoomSimple {
  name: String = '';
  max_players: Number = 0;
  players: Number = 0;
  gameTimeout: Number = -1;
  host: { username: String } = { username: '' };
}
