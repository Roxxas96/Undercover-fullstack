const jwt = require("jsonwebtoken");

const Word = require("../models/word.model");
const User = require("../models/user.model");
const Room = require("../models/room.model");
const Player = require("../models/player.model");

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

//*-----------------------------------------------------------------------------------------------Room control part----------------------------------------------------------------------------------------------------------

//Get rooms, return Rooms
exports.getRooms = (req, res, next) => {
  User.find(
    {
      _id: {
        $in: Rooms.map((room) => {
          if (room) return room.host;
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
        result: Rooms.map((room, index) => {
          return {
            //!!! Change if model changes
            name: room.name,
            max_players: room.max_players,
            //Only return length
            players: room.players.length,
            gameState: room.gameState,
            host: users[index],
          };
        }),
      });
    })
    //Throw
    .catch((error) => {
      return res.status(500).json({ error: error });
    });
};

//Get single room, return a single room info (in details)
exports.getSingleRoom = (req, res, next) => {
  const roomIndex = Rooms.findIndex((val) => val.name == req.params.roomName);
  if (!Rooms[roomIndex])
    return res.status(404).json({ error: "La salle n'xiste pas !" });
  //Get Room.players info in order to extract userId
  User.find(
    {
      _id: {
        $in: Rooms[roomIndex].players.map((player, index) => {
          return player.userId;
        }),
      },
    },
    { password: false, email: false }
  )
    .then((users) => {
      //None user found
      if (!users)
        return res
          .status(404)
          .json({ error: "Aucun utilisateurs trouvés dans cette salle !" });
      const userId = getUserId(req);
      User.findOne(
        { _id: Rooms[roomIndex].host },
        { _id: false, password: false, email: false }
      )
        .then((hostInfo) => {
          if (!hostInfo) {
            return res
              .status(404)
              .json({ error: "L'hôte de la salle n'as pas été trouvé !" });
          }
          return res.status(200).json({
            //Return remaped Room info
            //!!! Change if model changes
            result: {
              name: Rooms[roomIndex].name,
              max_players: Rooms[roomIndex].max_players,
              //in players array, don't return userId but return isOwner that tell front if this user = client (front doesn't have access to userIds)
              players: Rooms[roomIndex].players.map((player, index) => {
                const user = users.find((val) => {
                  return val._id == player.userId;
                });
                //Pas ouf comme méthode
                let playerInfo = {
                  username: user.username,
                };
                return {
                  userInfo: playerInfo,
                  words: player.words,
                  isOwner: Rooms[roomIndex].players[index].userId == userId,
                  vote: player.vote,
                  word: player.word,
                  voteFor: player.voteFor,
                };
              }),
              gameState: Rooms[roomIndex].gameState,
              host: hostInfo,
            },
          });
        })
        //Throw
        .catch((error) => {
          return res.status(500).json({ error: error });
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
  if (req.body.maxPlayers > 10 || req.body.maxPlayers < 3)
    return res.status(400).json({ error: "Nombre de joueurs invalide !" });
  const index = Rooms.length;
  const userId = getUserId(req);
  //Push array
  //!!! Change Room here if model changes
  Rooms.push(new Room(req.body.roomName, req.body.maxPlayers, [], 0, userId));
  //Return index of created room
  return res.status(201).json({ message: "Salle créée !" });
};

//Join room : make a player join a specified room
exports.joinRoom = (req, res, next) => {
  const roomIndex = Rooms.findIndex((val) => val.name == req.params.roomName);
  //Room not found
  if (Rooms[roomIndex] == null)
    return res.status(400).json({ error: "Cette salle n'existe pas !" });
  //User already in the room
  const userId = getUserId(req);
  if (Rooms[roomIndex].players.find((val) => val.userId == userId))
    return res
      .status(400)
      .json({ error: "Cet user est déjà dans la parite !" });
  //Room is full
  if (Rooms[roomIndex].players.length >= Rooms[roomIndex].max_players)
    return res.status(401).json({ error: "La salle est pleine !" });
  //Push player to Rooms array
  //!!! Change player here if model changes
  Rooms[roomIndex].players.push(new Player(userId, [], false, "", []));
  return res.status(200).json({ message: "Salle rejoint !" });
};

//Quit room : make a player leave a specified room
exports.quitRoom = (req, res, next) => {
  const roomIndex = Rooms.findIndex((val) => val.name == req.params.roomName);
  //Room not found
  if (Rooms[roomIndex] == null)
    return res.status(400).json({ error: "Cette salle n'existe pas !" });
  //Get the index of the player in the room.players array
  const userId = getUserId(req);
  const playerIndex = Rooms[roomIndex].players
    .map((user) => {
      return user.userId;
    })
    .indexOf(userId);
  //User not in the room
  if (playerIndex == -1)
    return res.status(400).json({
      error: "Cet user n'est pas dans la parite !",
      test: Rooms[roomIndex].players,
    });
  //Remove player from Rooms
  Rooms[roomIndex].players.splice(playerIndex, 1);
  //If room is empty delete it
  if (Rooms[roomIndex].players.length <= 0) Rooms.splice(roomIndex, 1);
  //If player was host change host
  else if (Rooms[roomIndex] && Rooms[roomIndex].host == userId)
    Rooms[roomIndex].host = Rooms[roomIndex].players[0].userId;
  //Stop game if players < 3
  else if (Rooms[roomIndex].players.length < 3) Rooms[roomIndex].gameState = 0;
  return res.status(200).json({ message: "Salle quitée !" });
};

//*-----------------------------------------------------------------------------------------------Game Part-------------------------------------------------------------------------------------------------------------------

//Push word : push a specified word in the room.players[player].words array
exports.pushWord = (req, res, next) => {
  const roomIndex = Rooms.findIndex((val) => val.name == req.params.roomName);
  //Empty word
  if (req.body.word == "")
    return res.status(400).json({ error: "Le mot entré est vide !" });
  //Get the index of the player in the room.players array
  const userId = getUserId(req);
  const index = Rooms[roomIndex].players
    .map((user) => {
      return user.userId;
    })
    .indexOf(userId);
  //User not found
  if (index == -1)
    return res.status(404).json({ error: "Utilisateur non trouvé !" });
  Rooms[roomIndex].players[index].words.push(req.body.word);
  return res.status(200).json({ message: "Le mot a été entré !" });
};

//Player vote : switch on/off room.players[player].vote
exports.playerVote = (req, res, next) => {
  //Get the index of the player in the room.players array
  const userId = getUserId(req);
  const roomIndex = Rooms.findIndex((val) => val.name == req.params.roomName);
  const playerIndex = Rooms[roomIndex].players
    .map((user) => {
      return user.userId;
    })
    .indexOf(userId);
  //User not found
  if (playerIndex == -1)
    return res.status(404).json({ error: "Utilisateur non trouvé !" });
  Rooms[roomIndex].players[playerIndex].vote = !Rooms[roomIndex].players[
    playerIndex
  ].vote;
  const numSpectators = Rooms[roomIndex].players.filter(
    (player) => player.word == ""
  ).length;
  if (
    Rooms[roomIndex].players.filter((val) => val.vote == true).length >
    (Rooms[roomIndex].players.length - numSpectators) / 2
  )
    Rooms[roomIndex].gameState = 2;
  return res.status(200).json({
    message:
      "Le vote a été changé en " +
      Rooms[roomIndex].players[playerIndex].vote +
      " !",
  });
};

exports.startGame = (req, res, next) => {
  const roomIndex = Rooms.findIndex((val) => val.name == req.params.roomName);
  if (Rooms[roomIndex].players.length < 3)
    return res
      .status(400)
      .json({ error: "Pass assez de joueurs pour commencer la partie !" });
  Rooms[roomIndex].gameState = 1;
  Rooms[roomIndex].players.forEach((val) => {
    val.words = [];
    val.vote = false;
    val.voteFor = [];
  });
  Word.aggregate([{ $sample: { size: 1 } }])
    .then((words) => {
      const undercoverIndex = Math.floor(Math.random() * 2);
      Rooms[roomIndex].players.forEach((val) => {
        val.word = words[0].words.split("/")[Math.abs(1 - undercoverIndex)];
      });
      let previousRandInt = -1;
      let i = 0;
      while (i < Math.round(Rooms[roomIndex].players.length / 3)) {
        let index = Math.floor(
          Math.random() * (Rooms[roomIndex].players.length - 1)
        );
        if (index != previousRandInt) {
          Rooms[roomIndex].players[index].word = words[0].words.split("/")[
            undercoverIndex
          ];
          i = i + 1;
        }
      }
      res.status(200).json({ message: "Partie lancée !" });
    })
    .catch((error) => {
      res.status(500).json({ error: error });
    });
};

exports.abortGame = (req, res, next) => {
  const roomIndex = Rooms.findIndex((val) => val.name == req.params.roomName);
  Rooms[roomIndex].gameState = 0;
  return res.status(200).json({ message: "Partie stopée !" });
};

exports.voteFor = (req, res, next) => {
  const userId = getUserId(req);
  const roomIndex = Rooms.findIndex((val) => val.name == req.params.roomName);
  const playerIndex = Rooms[roomIndex].players
    .map((user) => {
      return user.userId;
    })
    .indexOf(userId);
  const targetIndex = Rooms[roomIndex].players[playerIndex].voteFor.findIndex(
    (val) => val == req.body.target
  );
  if (targetIndex != -1) {
    Rooms[roomIndex].players[playerIndex].voteFor.splice(targetIndex, 1);
    return res.status(200).json({ message: "Cible déVoté !" });
  }
  const numSpectators = Rooms[roomIndex].players.filter(
    (player) => player.word == ""
  ).length;
  if (
    Rooms[roomIndex].players[playerIndex].voteFor.length >=
    Math.round((Rooms[roomIndex].players.length - numSpectators) / 3)
  ) {
    Rooms[roomIndex].players[playerIndex].voteFor[
      Rooms[roomIndex].players[playerIndex].voteFor.length - 1
    ] = req.body.target;
    return res.status(200).json({ message: "Changement de cible !" });
  } else {
    Rooms[roomIndex].players[playerIndex].voteFor.push(req.body.target);
    return res.status(200).json({ message: "Cible Voté !" });
  }
};
