export class Room {
  name: String = '';
  max_players: Number = 0;
  players: [
    {
      userId: String;
    }
  ] = [{ userId: '' }];
}
