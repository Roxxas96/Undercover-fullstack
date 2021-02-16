const Word = require("../models/word.model");
const jwt = require("jsonwebtoken");

let connectedPlayers = require("./connectedPlayers");

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

//Propose word : push a couple of words in DB
exports.proposeWord = (req, res, next) => {
  const word1 = req.body.word1;
  const word2 = req.body.word2;
  if (word1 <= 0) return res.status(400).json({ error: "Mot 1 invalide !" });
  if (word2 <= 0) return res.status(400).json({ error: "Mot 2 invalide !" });
  const word = new Word({
    words: word1.trim().concat("/", word2.trim()),
    fame: 0,
  });
  word
    .save()
    .then(() => {
      return res.status(201).json({ message: "Couple créé !" });
    })
    //DB errors
    .catch((error) => {
      return res.status(500).json({ error });
    });
};

exports.likeWords = (req, res, next) => {
  const words =
    req.body.words.split(":")[0] + "/" + req.body.words.split(":")[1];
  if (words == "") return res.status(400).json({ error: "Mots invalide !" });
  const playerIndex = connectedPlayers.findIndex(
    (val) => val.userId == getUserId(req)
  );
  if (playerIndex == -1)
    return res.status(404).json({ error: "Utilisateur non trouvé !" });
  const operator =
    req.params.like == "true"
      ? +1
      : req.params.like == "false"
      ? -1
      : 0 - connectedPlayers[playerIndex].like;
  Word.updateOne(
    { words: words },
    { $inc: { fame: operator }, $currentDate: { lastModified: true } }
  )
    .then((updatedWords) => {
      if (updatedWords.fame < 5)
        Word.deleteOne({ words: words })
          .then(() => {
            return res.status(200).json({ message: "Mots supprimé !" });
          })
          .catch((error) => {
            return res.status(400).json({ error: error });
          });
      connectedPlayers[playerIndex].like = operator;
      return res.status(200).json({
        message: "Mots modifié ! " + operator,
      });
    })
    .catch((error) => {
      return res.status(400).json({ error: error });
    });
};
