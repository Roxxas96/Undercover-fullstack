const jwt = require("jsonwebtoken");

const User = require("../models/user.model");

let Rooms = [];

//Get userId from headers
getUserId = (req) => {
  const token = req.headers.authorization.split(" ")[1];
  const decodedToken = jwt.verify(
    token,
    "8ubwh+bnbg8X45YWV3MWGx'2-.R<$0XK:.lF~r?w4Z[*V<7l3Lrg+Ba(z>lt2:p"
  );
  const userId = decodedToken.userId;
  return userId;
};

//Get rooms, return Rooms
exports.getRooms = (req, res, next) => {
  return res.status(200).json({
    result: Rooms.map((e) => {
      return {
        name: e.name,
        max_players: e.max_players,
        players: e.players.length,
      };
    }),
  });
};

exports.getSingleRoom = (req, res, next) => {
  User.find(
    {
      _id: {
        $in: Rooms[req.params.roomId].players.map((Player) => {
          return Player.userId;
        }),
      },
    },
    { _id: false, password: false, email: false }
  )
    .then((users) => {
      return res.status(200).json({
        result: {
          name: Rooms[req.params.roomId].name,
          max_players: Rooms[req.params.roomId].max_players,
          players: Rooms[req.params.roomId].players.map((Player, index) => {
            return {
              userInfo: users[index],
              words: Player.words,
              isOwner:
                Rooms[req.params.roomId].players[index].userId ==
                getUserId(req),
            };
          }),
        },
      });
    })
    .catch((error) => {
      return res.status(500).json({ error: error });
    });
};

//Create room, create a room and push it to Rooms array
exports.createRoom = (req, res, next) => {
  //Name must be unique
  if (Rooms.find((val) => val.name === req.body.roomName))
    return res.status(400).json({ error: "Nom de salle déjà pris !" });
  //Not needed in theory
  if (req.body.maxPlayers > 10 || req.body.maxPlayers < 2)
    return res.status(400).json({ error: "Nombre de joueurs invalide !" });
  let index = Rooms.length;
  //Push array
  Rooms.push({
    name: req.body.roomName,
    max_players: req.body.maxPlayers,
    players: [],
  });
  //Return index of created room
  return res.status(201).json({ message: "Salle créée !", result: index });
};

exports.joinRoom = (req, res, next) => {
  if (Rooms[req.params.roomId] == null)
    return res.status(400).json({ error: "Cette salle n'existe pas !" });
  if (
    Rooms[req.params.roomId].players.find((val) => val.userId == getUserId(req))
  )
    return res
      .status(400)
      .json({ error: "Cet user est déjà dans la parite !" });
  //Not needed in theory
  if (
    Rooms[req.params.roomId].players.length >=
    Rooms[req.params.roomId].max_players
  )
    return res.status(401).json({ error: "La salle est pleine !" });
  Rooms[req.params.roomId].players.push({ userId: getUserId(req), words: [] });
  return res.status(200).json({ message: "Salle rejoint !" });
};

exports.quitRoom = (req, res, next) => {
  if (Rooms[req.params.roomId] == null)
    return res.status(400).json({ error: "Cette salle n'existe pas !" });
  const index = Rooms[req.params.roomId].players
    .map((user) => {
      return user.userId;
    })
    .indexOf(getUserId(req));
  if (index == -1)
    return res.status(400).json({
      error: "Cet user n'est pas dans la parite !",
      test: Rooms[req.params.roomId].players,
    });
  Rooms[req.params.roomId].players.splice(index, 1);
  if (Rooms[req.params.roomId].players.length <= 0)
    Rooms.splice(req.params.roomId, 1);
  return res.status(200).json({ message: "Salle quitée !" });
};

exports.pushWord = (req, res, next) => {
  if (req.body.word == "")
    return res.status(400).json({ error: "Le mot entré est vide !" });
  const index = Rooms[req.params.roomId].players
    .map((user) => {
      return user.userId;
    })
    .indexOf(getUserId(req));
  Rooms[req.params.roomId].players[index].words.push(req.body.word);
  return res.status(200).json({ message: "Le mot a été entré !" });
};
