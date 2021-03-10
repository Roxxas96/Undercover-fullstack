const jwt = require("jsonwebtoken");

const Word = require("../models/word.model");
const User = require("../models/user.model");
const Room = require("../models/room.model");
const Player = require("../models/player.model");
const Chat = require("../models/chat.model");
const connectedPlayers = require("./connectedPlayers");

let Rooms = [];

let generalChat = [];

//Get userId from headers
const getUserId = (req) => {
  ///*UserId part
  //Get token from headers
  const token = req.headers.authorization.split(" ")[1];
  if (!token || token == "") return "";
  //Decode using key
  const decodedToken = jwt.verify(
    token,
    "?Ybca#H9!**Rv2qQpv@f_S-+5d@tPVjH*#65@%q_XJ9k-fy^^MRns9bSpmaq8@X@"
  );
  //Get userId from decoded token
  const userId = decodedToken.userId;

  //*Activity part (for anti afk)
  //Index of the player in the room
  let playerIndex = -1;
  //Index of the room in which the player is
  const roomIndex = Rooms.findIndex((room) => {
    //Set player Index in room
    playerIndex = room.players.findIndex((player) => player.userId == userId);
    return playerIndex != -1;
  });
  //Update player activity in the room
  if (roomIndex != -1)
    Rooms[roomIndex].players[playerIndex].activity =
      Rooms[roomIndex].players[playerIndex].activity + 1;
  //Index of the player in Connected players Array
  const connectedPlayerIndex = connectedPlayers.findIndex(
    (val) => val.userId == userId
  );
  //Update player activity in connected players array
  if (connectedPlayerIndex != -1)
    connectedPlayers[connectedPlayerIndex].activity =
      connectedPlayers[connectedPlayerIndex].activity + 1;
  //Finally return the userId
  return userId;
};

const playerQuitRoom = (roomIndex, playerIndex, userId) => {
  //Place player in rememberedPlayers to save his score
  //!!! Change player here if model changes
  Rooms[roomIndex].rememberedPlayers.push(
    new Player(
      Rooms[roomIndex].players[playerIndex].userId,
      [],
      false,
      "",
      [],
      Rooms[roomIndex].players[playerIndex].score,
      []
    )
  );
  //Remove player from Rooms
  Rooms[roomIndex].players.splice(playerIndex, 1);
  //Index of the player in Connected players Array
  const connectedPlayerIndex = connectedPlayers.findIndex(
    (val) => val.userId == userId
  );
  //Reset player like antispam
  if (connectedPlayerIndex != -1)
    connectedPlayers[connectedPlayerIndex].like == 0;
  //Stop game
  Rooms[roomIndex].gameState = 0;
  resetGame(roomIndex);
  //If room is empty delete it
  if (Rooms[roomIndex].players.length <= 0) Rooms.splice(roomIndex, 1);
  //If player was host change host
  else if (Rooms[roomIndex] && Rooms[roomIndex].host == userId)
    Rooms[roomIndex].host = Rooms[roomIndex].players[0].userId;
};

//Anti AFK :  kick players that have not been kicked by quitRoom()
const antiAFK = setInterval(() => {
  Rooms.forEach((room, roomIndex) => {
    //For each room chexk for inactive player
    room.players.forEach((player, playerIndex) => {
      if (player.activity == 0) {
        playerQuitRoom(roomIndex, playerIndex, player.userId);
      }
      //Reset player activity
      player.activity = 0;
    });
  });
  //Anti AFK trigger every 5 sec
}, 5000);

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
        result: Rooms.map((room, roomIndex) => {
          return {
            //!!! Change if model changes
            name: room.name,
            max_players: room.max_players,
            //Only return length
            players: room.players.length,
            gameState: room.gameState,
            host: users[roomIndex],
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
    res.status(404).json({ error: "Le joueur n'est pas dans la salle !" });
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
      User.findOne(
        { _id: Rooms[roomIndex].host },
        { _id: false, password: false, email: false }
      )
        .then((hostInfo) => {
          //Host not found
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
              undercovers: Rooms[roomIndex].undercovers,
              //in players array, don't return userId but return isOwner that tell front if this user = client (front doesn't have access to userIds)
              players: Rooms[roomIndex].players.map((player, index) => {
                const user = users.find((val) => {
                  return val._id == player.userId;
                });
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
                  kick: player.kick,
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
  if (req.body.maxPlayers > 10 || req.body.maxPlayers < 3)
    return res.status(400).json({ error: "Nombre de joueurs invalide !" });
  if (req.body.undercovers > 4 || req.body.undercovers < 1)
    return res.status(400).json({ error: "Nombre d'undercovers invalide !" });
  if (req.body.undercovers >= req.body.maxPlayers / 2)
    return res.status(400).json({
      error:
        "Nombre d'undercovers au dessus de la limite fixée par le nombre de joueurs !",
    });
  const userId = getUserId(req);
  //Push array
  //!!! Change Room here if model changes
  Rooms.push(
    new Room(
      req.body.roomName,
      req.body.maxPlayers,
      req.body.undercovers,
      [],
      0,
      userId,
      [],
      []
    )
  );
  //Return index of created room
  return res.status(201).json({ message: "Salle créée !" });
};

//Create room, create a room and push it to Rooms array
exports.modifyRoom = (req, res, next) => {
  //Not needed in theory
  if (req.body.maxPlayers > 10 || req.body.maxPlayers < 3)
    return res.status(400).json({ error: "Nombre de joueurs invalide !" });
  if (req.body.undercovers > 4 || req.body.undercovers < 1)
    return res.status(400).json({ error: "Nombre d'undercovers invalide !" });
  if (req.body.undercovers >= req.body.maxPlayers / 2)
    return res.status(400).json({
      error:
        "Nombre d'undercovers au dessus de la limite fixée par le nombre de joueurs !",
    });
  const roomIndex = Rooms.findIndex((val) => val.name == req.params.roomName);
  if (req.body.maxPlayers < Rooms[roomIndex].players.length)
    return res
      .status(400)
      .json({ error: "Nombre de joueurs au dessus de la limite !" });
  Rooms[roomIndex].max_players = req.body.maxPlayers;
  Rooms[roomIndex].undercovers = req.body.undercovers;
  //Return index of created room
  return res.status(201).json({ message: "Salle modifiée !" });
};

//Join room : make a player join a specified room
exports.joinRoom = (req, res, next) => {
  const roomIndex = Rooms.findIndex((val) => val.name == req.params.roomName);
  //Room not found
  if (Rooms[roomIndex] == null)
    return res.status(404).json({ error: "Cette salle n'existe pas !" });
  //User already in the room
  const userId = getUserId(req);
  if (Rooms[roomIndex].players.find((val) => val.userId == userId))
    return res
      .status(400)
      .json({ error: "Cet user est déjà dans la parite !" });
  //Room is full
  if (Rooms[roomIndex].players.length >= Rooms[roomIndex].max_players)
    return res.status(401).json({ error: "La salle est pleine !" });
  //User banned
  if (Rooms[roomIndex].bannedPlayers.find((val) => val == userId))
    return res.status(401).json({ error: "Cet user est ban !" });
  //Push player to Rooms array
  //!!! Change player here if model changes
  Rooms[roomIndex].players.push(
    Rooms[roomIndex].rememberedPlayers.find((val) => val.userId == userId) ||
      new Player(userId, [], false, "", [], 0, [])
  );
  return res.status(200).json({ message: "Salle rejoint !" });
};

//Quit room : make a player leave a specified room
exports.quitRoom = (req, res, next) => {
  const roomIndex = Rooms.findIndex((val) => val.name == req.params.roomName);
  //Room not found
  if (Rooms[roomIndex] == null)
    return res.status(404).json({ error: "Cette salle n'existe pas !" });
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
  playerQuitRoom(roomIndex, playerIndex, userId);
  return res.status(200).json({ message: "Salle quitée !" });
};

exports.chat = (req, res, next) => {
  if (req.body.text <= 0)
    return res.status(400).json({ error: "Le texte est vide !" });
  const userId = getUserId(req);
  generalChat.push(new Chat(userId, req.body.text, new Date()));
  return res.status(200).json({ message: "Message envoyé !" });
};

exports.getChat = (req, res, next) => {
  //Find in DB
  User.find(
    {
      _id: {
        $in: generalChat.map((val) => {
          return val.author;
        }),
      },
    },
    { password: false, email: false }
  )
    .then((users) => {
      return res.status(200).json({
        result: generalChat.map((chat, chatIndex) => {
          const user = users.find((val) => {
            return val._id == chat.author;
          });
          let playerInfo = {
            username: user.username,
          };
          return {
            author: playerInfo,
            content: chat.content,
            date:
              "le " +
              chat.date.getDate() +
              "/" +
              (chat.date.getMonth() + 1) +
              " à " +
              (chat.date.getHours() < 10 ? "0" : "") +
              chat.date.getHours() +
              ":" +
              (chat.date.getMinutes() < 10 ? "0" : "") +
              chat.date.getMinutes(),
          };
        }),
      });
    })
    .catch((error) => {
      return res.status(500).json({ error: error });
    });
};
//*-----------------------------------------------------------------------------------------------Game Part-------------------------------------------------------------------------------------------------------------------

//Timeout between vote phase and result show
let voteTimeout = setTimeout(() => {}, 10);

//Reset game, reset all game variables
const resetGame = (index) => {
  Rooms[index].players.forEach((val) => {
    val.words = [];
    val.vote = false;
    val.voteFor = [];
    val.word = "";
  });
};

const calculateResults = (roomIndex) => {
  //Verify that the game has not been cancelled
  if (Rooms[roomIndex].gameState == 2) {
    Rooms[roomIndex].gameState = 3;
    //Initialize civilians and undercovers
    let civilians = [];
    let undercovers = [];
    //Handle spectators
    let spectators = Rooms[roomIndex].players.filter(
      (player) => player.word == ""
    );
    //Push 1 player to be the reference
    civilians.push(Rooms[roomIndex].players[0]);
    //Compare all other players words to this player's word and push them to the arrays
    Rooms[roomIndex].players.forEach((player, key) => {
      //Ignore ref
      if (key == 0) return;
      //Ignore spec
      if (spectators.find((spec) => spec.userId == player.userId)) return;
      if (player.word != civilians[0].word) undercovers.push(player);
      else civilians.push(player);
    });
    //If arrays are twisted, invers them (undercovers length should be < civilians length)
    if (undercovers.length > civilians.length) {
      let temp = civilians;
      civilians = undercovers;
      undercovers = temp;
    }
    //Calculate score
    Rooms[roomIndex].players.forEach((player, key) => {
      //Ignore spec
      if (spectators.find((spec) => spec.userId == player.userId)) return;
      //Score of civilans will cout by 50 from 0 to max
      if (civilians.find((civ) => civ.userId == player.userId)) {
        player.voteFor.forEach((vote) => {
          //If voted player is undercover
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
        //Score of undercovers will cout by 50 from max to 0
      } else {
        player.score = player.score + 50 * civilians.length;
      }
    });
    //Change to state 0 after 5 sec
    setTimeout(() => {
      if (Rooms[roomIndex]) {
        Rooms[roomIndex].gameState = 0;
        resetGame(roomIndex);
      }
    }, 5000);
  }
};

//Push word : push a specified word in the room.players[player].words array
exports.pushWord = (req, res, next) => {
  const roomIndex = Rooms.findIndex((val) => val.name == req.params.roomName);
  //Room not found
  if (Rooms[roomIndex] == null)
    return res.status(404).json({ error: "Cette salle n'existe pas !" });
  //Empty word
  if (req.body.word == "")
    return res.status(400).json({ error: "Le mot entré est vide !" });
  //Verify game phase
  if (Rooms[roomIndex].gameState != 1)
    return res.status(400).json({ error: "Mauvaise phase !" });
  //Get the index of the player in the room.players array
  const userId = getUserId(req);
  const playerIndex = Rooms[roomIndex].players
    .map((user) => {
      return user.userId;
    })
    .indexOf(userId);
  //User not found
  if (playerIndex == -1)
    return res.status(404).json({ error: "Utilisateur non trouvé !" });
  //Push word
  Rooms[roomIndex].players[playerIndex].words.push(req.body.word);
  return res.status(200).json({ message: "Le mot a été entré !" });
};

//Player vote : switch on/off room.players[player].vote
exports.playerVote = (req, res, next) => {
  //Get the index of the player in the room.players array
  const userId = getUserId(req);
  const roomIndex = Rooms.findIndex((val) => val.name == req.params.roomName);
  //Room not found
  if (Rooms[roomIndex] == null)
    return res.status(404).json({ error: "Cette salle n'existe pas !" });
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
  let spectators = Rooms[roomIndex].players.filter(
    (player) => player.word == ""
  );
  //If enought votes begin vote phase
  if (
    Rooms[roomIndex].players.filter((val) => val.vote == true).length >
    (Rooms[roomIndex].players.length - spectators.length) / 2
  ) {
    Rooms[roomIndex].gameState = 2;
    //Timeout to draw and calculate results
    voteTimeout = setTimeout(() => {
      calculateResults(roomIndex);
    }, Math.round(Rooms[roomIndex].players.length / 3) * 5000 + 10000);
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
    return res.status(404).json({ error: "Cette salle n'existe pas !" });
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
      .json({ error: "Pas assez de joueurs pour commencer la partie !" });
  //Not enought players to start
  if (Rooms[roomIndex].undercovers >= Rooms[roomIndex].players.length / 2)
    return res.status(400).json({ error: "Il y a trop d'undercovers !" });
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
        val.word = words[0].words.split("/")[1 - undercoverIndex];
      });
      //Vars used to prevent random from chosing an undercover again
      let previousRandInts = [];
      let i = 0;
      let pickedUndercovers = 0;
      //Set a max attemps var to prevent infinite loop
      const maxAtempts = 500;
      //number of Untercover
      const numberOfUndercovers = Rooms[roomIndex].undercovers;
      //Then asign undercover word to random unique players
      while (pickedUndercovers < numberOfUndercovers && i <= maxAtempts) {
        //Random var between 0 and number of players - 1
        let index = Math.floor(
          Math.random() * (Rooms[roomIndex].players.length - 1)
        );
        //If var was not picked before, assign undercover word to player
        if (!previousRandInts.find((val) => val == index)) {
          Rooms[roomIndex].players[index].word = words[0].words.split("/")[
            undercoverIndex
          ];
          pickedUndercovers += 1;
          previousRandInts.push(index);
        }
        i += 1;
      }
      //Finaly reset like antispam of each players
      connectedPlayers.forEach((val, key) => {
        val.like = false;
      });
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
    return res.status(404).json({ error: "Cette salle n'existe pas !" });
  //Verify game phase
  if (Rooms[roomIndex].gameState != 1)
    return res.status(400).json({ error: "Mauvaise phase !" });
  const userId = getUserId(req);
  //Only host can stop game
  if (Rooms[roomIndex].host != userId)
    return res
      .status(400)
      .json({ error: "Seul l'hote peut stoper une partie !" });
  //Change game state
  Rooms[roomIndex].gameState = 0;
  //Reset game
  resetGame(roomIndex);
  return res.status(200).json({ message: "Partie stopée !" });
};

//Vote for : vote gestion store all votes of a player in an array
exports.voteFor = (req, res, next) => {
  const userId = getUserId(req);
  const roomIndex = Rooms.findIndex((val) => val.name == req.params.roomName);
  //Room not found
  if (Rooms[roomIndex] == null)
    return res.status(404).json({ error: "Cette salle n'existe pas !" });
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
  //If target is in array splice it
  if (targetIndex != -1) {
    Rooms[roomIndex].players[playerIndex].voteFor.splice(targetIndex, 1);
    res.status(200).json({ message: "Cible déVoté !" });
  } else {
    //If target can't be targeted because max target reached (multiple targets allowed)
    if (
      Rooms[roomIndex].players[playerIndex].voteFor.length >=
      Rooms[roomIndex].undercovers
    ) {
      //Splice oldest target
      Rooms[roomIndex].players[playerIndex].voteFor.splice(0, 1);
    }
    //Push target
    Rooms[roomIndex].players[playerIndex].voteFor.push(req.body.target);
    res.status(200).json({ message: "Cible Voté !" });
  }
  //When all players voted, skip timer and pass results
  if (
    Rooms[roomIndex].players.filter(
      (val) => val.voteFor.length >= Rooms[roomIndex].undercovers
    ).length == Rooms[roomIndex].players.length
  ) {
    clearTimeout(voteTimeout);
    calculateResults(roomIndex);
  }
};
//Vote for : vote gestion store all votes of a player in an array
exports.voteKick = (req, res, next) => {
  const userId = getUserId(req);
  const roomIndex = Rooms.findIndex((val) => val.name == req.params.roomName);
  //Room not found
  if (Rooms[roomIndex] == null)
    return res.status(404).json({ error: "Cette salle n'existe pas !" });
  const playerIndex = Rooms[roomIndex].players
    .map((user) => {
      return user.userId;
    })
    .indexOf(userId);
  //User not found
  if (playerIndex == -1)
    return res.status(404).json({ error: "Utilisateur non trouvé !" });
  const playerIndexInKickList = Rooms[roomIndex].players[
    req.body.target
  ].kick.findIndex((val) => val == playerIndex);
  //Kick or unKick player
  if (playerIndexInKickList == -1)
    Rooms[roomIndex].players[req.body.target].kick.push(playerIndex);
  else {
    Rooms[roomIndex].players[req.body.target].kick.splice(
      playerIndexInKickList,
      1
    );
  }
  //Add player to ban list if vote succeded
  if (
    Rooms[roomIndex].players[req.body.target].kick.length >=
    Rooms[roomIndex].players.length / 2
  ) {
    Rooms[roomIndex].bannedPlayers.push(
      Rooms[roomIndex].players[req.body.target].userId
    );
    playerQuitRoom(
      roomIndex,
      req.body.target,
      Rooms[roomIndex].players[req.body.target].userId
    );
  }
  return res.status(200).json({ message: "Player Kicked/UnKicked !" });
};
