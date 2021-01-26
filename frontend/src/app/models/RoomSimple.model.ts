export class RoomSimple {
  name: String = '';
  max_players: Number = 0;
  players: Number = 0;
  gameInProgress: Boolean = false;
  host: { username: String } = { username: '' };
}
