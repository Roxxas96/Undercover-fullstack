const jwt = require("jsonwebtoken");

const User = require("../models/user.model");

let Rooms = [];

//Get userId from headers
const getUserId = (req) => {
  const token = req.headers.authorization.split(" ")[1];
  if (!token || token == "") return "";
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
        //Only return length
        players: e.players.length,
      };
    }),
  });
};

//Get single room, return a single room info (in details)
exports.getSingleRoom = (req, res, next) => {
  //Get Room.players info in order to extract userId
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
      //None user found
      if (!users)
        return res
          .status(404)
          .json({ error: "Aucun utilisateurs trouvés dans cette salle !" });
      return res.status(200).json({
        //Return remaped Room info
        result: {
          name: Rooms[req.params.roomId].name,
          max_players: Rooms[req.params.roomId].max_players,
          //in players array, don't return userId + return isOwner that tell front if this user = client (front doesn't have access to userIds)
          players: Rooms[req.params.roomId].players.map((Player, index) => {
            return {
              userInfo: users[index],
              words: Player.words,
              isOwner:
                Rooms[req.params.roomId].players[index].userId ==
                getUserId(req),
              vote: Player.vote,
            };
          }),
        },
      });
    })
    //Throw
    .catch((error) => {
      return res.status(500).json({ error: error });
    });
};

//Create room, create a room and push it to Rooms array
exports.createRoom = (req, res, next) => {
  if (req.body.roomName.length <= 0)
    return res.status(400).json({ error: "Nom de la salle vide !" });
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

//Join room : make a player join a specified room
exports.joinRoom = (req, res, next) => {
  //Room not found
  if (Rooms[req.params.roomId] == null)
    return res.status(400).json({ error: "Cette salle n'existe pas !" });
  //User already in the room
  if (
    Rooms[req.params.roomId].players.find((val) => val.userId == getUserId(req))
  )
    return res
      .status(400)
      .json({ error: "Cet user est déjà dans la parite !" });
  //Room is full
  if (
    Rooms[req.params.roomId].players.length >=
    Rooms[req.params.roomId].max_players
  )
    return res.status(401).json({ error: "La salle est pleine !" });
  //Push player to Rooms array
  Rooms[req.params.roomId].players.push({
    userId: getUserId(req),
    words: [],
    vote: false,
  });
  return res.status(200).json({ message: "Salle rejoint !" });
};

//Quit room : make a player leave a specified room
exports.quitRoom = (req, res, next) => {
  //Room not found
  if (Rooms[req.params.roomId] == null)
    return res.status(400).json({ error: "Cette salle n'existe pas !" });
  //Get the index of the player in the room.players array
  const index = Rooms[req.params.roomId].players
    .map((user) => {
      return user.userId;
    })
    .indexOf(getUserId(req));
  //User not in the room
  if (index == -1)
    return res.status(400).json({
      error: "Cet user n'est pas dans la parite !",
      test: Rooms[req.params.roomId].players,
    });
  //Remove player from Rooms
  Rooms[req.params.roomId].players.splice(index, 1);
  //If room is empty delete it
  if (Rooms[req.params.roomId].players.length <= 0)
    Rooms.splice(req.params.roomId, 1);
  return res.status(200).json({ message: "Salle quitée !" });
};

//Push word : push a specified word in the room.players[player].words array
exports.pushWord = (req, res, next) => {
  //Empty word
  if (req.body.word == "")
    return res.status(400).json({ error: "Le mot entré est vide !" });
  //Get the index of the player in the room.players array
  const index = Rooms[req.params.roomId].players
    .map((user) => {
      return user.userId;
    })
    .indexOf(getUserId(req));
  //User not found
  if (index == -1)
    return res.status(404).json({ error: "Utilisateur non trouvé !" });
  Rooms[req.params.roomId].players[index].words.push(req.body.word);
  return res.status(200).json({ message: "Le mot a été entré !" });
};

//Player vote : switch on/off room.players[player].vote
exports.playerVote = (req, res, next) => {
  //Get the index of the player in the room.players array
  const index = Rooms[req.params.roomId].players
    .map((user) => {
      return user.userId;
    })
    .indexOf(getUserId(req));
  //User not found
  if (index == -1)
    return res.status(404).json({ error: "Utilisateur non trouvé !" });
  Rooms[req.params.roomId].players[index].vote = !Rooms[req.params.roomId]
    .players[index].vote;
  return res.status(200).json({
    message:
      "Le vote a été changé en " +
      Rooms[req.params.roomId].players[index].vote +
      " !",
  });
};
