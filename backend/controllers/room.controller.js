const jwt = require("jsonwebtoken");

const Word = require("../models/word.model");
const User = require("../models/user.model");
const Room = require("../models/room.model");
const Player = require("../models/player.model");

let Rooms = [];

let voteTimeout = setTimeout(() => {}, 10);

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
    return res.status(404).json({ error: "La salle n'existe pas !" });
  //Get the index of the player in the room.players array
  const userId = getUserId(req);
  const playerIndex = Rooms[roomIndex].players
    .map((user) => {
      return user.userId;
    })
    .indexOf(userId);
  //Players not in the game are not alowed to get info
  if (playerIndex == -1)
    res.status(403).json({ error: "Le joueur n'est pas dans la salle !" });
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
                  word:
                    Rooms[roomIndex].players[index].userId == userId ||
                    player.word == "" ||
                    Rooms[roomIndex].gameState == 3
                      ? player.word
                      : "woof",
                  voteFor:
                    Rooms[roomIndex].players[index].userId == userId ||
                    Rooms[roomIndex].gameState == 3
                      ? player.voteFor
                      : player.voteFor.map((val) => {
                          return -42;
                        }),
                  score: player.score,
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
  Rooms[roomIndex].players.push(new Player(userId, [], false, "", [], 0));
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

//Reset game, reset all game variables
const resetGame = (index) => {
  Rooms[index].players.forEach((val) => {
    val.words = [];
    val.vote = false;
    val.voteFor = [];
    val.word = "";
  });
};

//Push word : push a specified word in the room.players[player].words array
exports.pushWord = (req, res, next) => {
  const roomIndex = Rooms.findIndex((val) => val.name == req.params.roomName);
  //Room not found
  if (Rooms[roomIndex] == null)
    return res.status(400).json({ error: "Cette salle n'existe pas !" });
  //Empty word
  if (req.body.word == "")
    return res.status(400).json({ error: "Le mot entré est vide !" });
  //Verify game phase
  if (Rooms[roomIndex].gameState != 1)
    return res.status(400).json({ error: "Mauvaise phase !" });
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
  //Push word
  Rooms[roomIndex].players[index].words.push(req.body.word);
  return res.status(200).json({ message: "Le mot a été entré !" });
};

//Player vote : switch on/off room.players[player].vote
exports.playerVote = (req, res, next) => {
  //Get the index of the player in the room.players array
  const userId = getUserId(req);
  const roomIndex = Rooms.findIndex((val) => val.name == req.params.roomName);
  //Room not found
  if (Rooms[roomIndex] == null)
    return res.status(400).json({ error: "Cette salle n'existe pas !" });
  //Verify game phase
  if (Rooms[roomIndex].gameState != 1)
    return res.status(400).json({ error: "Mauvaise phase !" });
  const playerIndex = Rooms[roomIndex].players
    .map((user) => {
      return user.userId;
    })
    .indexOf(userId);
  //User not found
  if (playerIndex == -1)
    return res.status(404).json({ error: "Utilisateur non trouvé !" });
  //Change vote
  Rooms[roomIndex].players[playerIndex].vote = !Rooms[roomIndex].players[
    playerIndex
  ].vote;
  //Handle spectators (they need to be ignored when dealing with game functions)
  const numSpectators = Rooms[roomIndex].players.filter(
    (player) => player.word == ""
  ).length;
  //If enought votes begin vote phase
  if (
    Rooms[roomIndex].players.filter((val) => val.vote == true).length >
    (Rooms[roomIndex].players.length - numSpectators) / 2
  ) {
    Rooms[roomIndex].gameState = 2;
    voteTimeout = setTimeout(() => {
      if (Rooms[roomIndex].gameState == 2) {
        Rooms[roomIndex].gameState = 3;
        let civilians = [];
        let undercovers = [];
        civilians.push(Rooms[roomIndex].players[0]);
        Rooms[roomIndex].players.forEach((val, key) => {
          if (key == 0) return;
          if (val.word != civilians[0].word) undercovers.push(val);
          else civilians.push(val);
        });
        if (undercovers.length > civilians.length) {
          let temp = civilians;
          civilians = undercovers;
          undercovers = temp;
        }
        Rooms[roomIndex].players.forEach((player, key) => {
          if (civilians.find((civ) => civ.userId == player.userId)) {
            player.voteFor.forEach((vote) => {
              if (
                undercovers.find(
                  (undercover) =>
                    undercover.userId == Rooms[roomIndex].players[vote].userId
                )
              ) {
                player.score = player.score + 50;
                Rooms[roomIndex].players[vote].score =
                  Rooms[roomIndex].players[vote].score - 50;
              }
            });
          } else {
            player.score = player.score + 50 * civilians.length;
          }
        });
        setTimeout(() => {
          Rooms[roomIndex].gameState = 0;
          resetGame(roomIndex);
        }, 5000);
      }
    }, Math.round(Rooms[roomIndex].players.length / 3) * 10000 + 2000);
  }
  return res.status(200).json({
    message: "Le vote a été changé !",
  });
};

//Start game : initialize the game
exports.startGame = (req, res, next) => {
  const roomIndex = Rooms.findIndex((val) => val.name == req.params.roomName);
  //Room not found
  if (Rooms[roomIndex] == null)
    return res.status(400).json({ error: "Cette salle n'existe pas !" });
  //Verify game phase
  if (Rooms[roomIndex].gameState != 0)
    return res.status(400).json({ error: "Mauvaise phase !" });
  const userId = getUserId(req);
  //Only host can start game
  if (Rooms[roomIndex].host != userId)
    return res
      .status(400)
      .json({ error: "Seul l'hote peut commencer une partie !" });
  //Not enought players to start
  if (Rooms[roomIndex].players.length < 3)
    return res
      .status(400)
      .json({ error: "Pass assez de joueurs pour commencer la partie !" });
  //Change game state (begin game)
  Rooms[roomIndex].gameState = 1;
  //Reset players info
  resetGame(roomIndex);
  //Pick a couple of words from DB
  Word.aggregate([{ $sample: { size: 1 } }])
    .then((words) => {
      //Random number in [0,1] (index of the undercover word)
      const undercoverIndex = Math.floor(Math.random() * 2);
      //First asign civilian word to all players
      Rooms[roomIndex].players.forEach((val) => {
        val.word = words[0].words.split("/")[Math.abs(1 - undercoverIndex)];
      });
      let previousRandInt = -1;
      let i = 0;
      //Then asign undercover word to random unique players
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
    //DB errors
    .catch((error) => {
      res.status(500).json({ error: error });
    });
};

//Abort game : stop the current game
exports.abortGame = (req, res, next) => {
  const roomIndex = Rooms.findIndex((val) => val.name == req.params.roomName);
  //Room not found
  if (Rooms[roomIndex] == null)
    return res.status(400).json({ error: "Cette salle n'existe pas !" });
  //Verify game phase
  if (Rooms[roomIndex].gameState != 1)
    return res.status(400).json({ error: "Mauvaise phase !" });
  const userId = getUserId(req);
  //Only host can stop game
  if (Rooms[roomIndex].host != userId)
    return res
      .status(400)
      .json({ error: "Seul l'hote peut commencer une partie !" });
  //Change game state
  Rooms[roomIndex].gameState = 0;
  resetGame(roomIndex);
  return res.status(200).json({ message: "Partie stopée !" });
};

//Vote for : vote gestion store all votes of a player in an array
exports.voteFor = (req, res, next) => {
  const userId = getUserId(req);
  const roomIndex = Rooms.findIndex((val) => val.name == req.params.roomName);
  //Room not found
  if (Rooms[roomIndex] == null)
    return res.status(400).json({ error: "Cette salle n'existe pas !" });
  //Verify game phase
  if (Rooms[roomIndex].gameState != 2)
    return res.status(400).json({ error: "Mauvaise phase !" });
  const playerIndex = Rooms[roomIndex].players
    .map((user) => {
      return user.userId;
    })
    .indexOf(userId);
  //User not found
  if (playerIndex == -1)
    return res.status(404).json({ error: "Utilisateur non trouvé !" });
  const targetIndex = Rooms[roomIndex].players[playerIndex].voteFor.findIndex(
    (val) => val == req.body.target
  );
  //Invalid target
  if (!Rooms[roomIndex].players[playerIndex])
    return res.status(404).json({ error: "Cible invalide !" });
  //If target is not in array push it
  if (targetIndex != -1) {
    Rooms[roomIndex].players[playerIndex].voteFor.splice(targetIndex, 1);
    return res.status(200).json({ message: "Cible déVoté !" });
  }
  const numSpectators = Rooms[roomIndex].players.filter(
    (player) => player.word == ""
  ).length;
  //If target can't be targeted because max target reached (multiple targets allowed)
  if (
    Rooms[roomIndex].players[playerIndex].voteFor.length >=
    Math.round((Rooms[roomIndex].players.length - numSpectators) / 3)
  ) {
    //Replace oldest target by new one
    Rooms[roomIndex].players[playerIndex].voteFor[
      Rooms[roomIndex].players[playerIndex].voteFor.length - 1
    ] = req.body.target;
    return res.status(200).json({ message: "Changement de cible !" });
    //Else if taget can be targeted
  } else {
    //Push target
    Rooms[roomIndex].players[playerIndex].voteFor.push(req.body.target);
    return res.status(200).json({ message: "Cible Voté !" });
  }
};
