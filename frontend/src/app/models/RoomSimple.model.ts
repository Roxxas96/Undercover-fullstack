export class RoomSimple {
  name: String = '';
  max_players: Number = 0;
  players: Number = 0;
  gameInProgress: Number = 0;
  host: { username: String } = { username: '' };
}
