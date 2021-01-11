export class Room {
  name: String = '';
  max_players: Number = 0;
  players: Array<{ userId: string; words: Array<string> }> = [
    { userId: '', words: [] },
  ];
}
