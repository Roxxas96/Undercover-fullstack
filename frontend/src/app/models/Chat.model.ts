import { User } from './User.model';

export class Chat {
  author: User = new User();
  content: String = '';
  date: String = '';
}
