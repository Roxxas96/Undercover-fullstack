const Word = require("../models/word.model");
const jwt = require("jsonwebtoken");

let connectedPlayers = require("./connectedPlayers");
const credentials = require("../credentials.json");

//Get userId from headers
const getUserId = (req) => {
  const token = req.headers.authorization.split(" ")[1];
  if (!token || token == "") return "";
  const decodedToken = jwt.verify(token, credentials.jwt);
  const userId = decodedToken.userId;
  return userId;
};

//Propose word : push a couple of words in DB
exports.proposeWord = (req, res, next) => {
  const word1 = req.body.word1;
  const word2 = req.body.word2;
  if (word1 <= 0) return res.status(400).json({ error: "Mot 1 invalide !" });
  if (word2 <= 0) return res.status(400).json({ error: "Mot 2 invalide !" });
  //Create a new word
  const word = new Word({
    words: word1.trim().concat("/", word2.trim()),
    fame: 0,
  });
  //Save to DB
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

//Like word : update the fame of a word, if a word has fame < -5 then delete it
exports.likeWords = (req, res, next) => {
  if (req.body.words == "")
    return res.status(400).json({ error: "Mots invalide !" });
  const userId = getUserId(req);
  const connectedPlayerIndex = connectedPlayers.findIndex(
    (val) => val.userId == userId
  );
  if (connectedPlayerIndex == -1)
    return res.status(400).json({ error: "Utilisateur non trouvé !" });
  //Anti spam, user are allowed to like a word onec in a game
  if (connectedPlayers[connectedPlayerIndex].like)
    return res.status(400).json({ error: "Cet Utilisateur a déjà liké !" });
  //Update DB
  Word.updateOne(
    { words: req.body.words },
    {
      //Increase fame by -1 or +1
      $inc: { fame: parseInt(req.params.like) },
      $currentDate: { lastModified: true },
    }
  )
    .then((updatedWords) => {
      //Word not found
      if (!updatedWords)
        return res.status(404).json({ error: "Mot non trouvé !" });
      //If word has a bad fame delete it
      if (updatedWords.fame < 5)
        //Call DB to delete
        Word.deleteOne({ words: words })
          .then(() => {
            return res.status(200).json({ message: "Mots supprimé !" });
          })
          //DB errors
          .catch((error) => {
            return res.status(500).json({ error: error });
          });
      //Set player as already liked for anti spam
      connectedPlayers[connectedPlayerIndex].like = true;
      return res.status(200).json({
        message: "Mots modifié ! ",
      });
    })
    //DB Errors
    .catch((error) => {
      return res.status(500).json({ error: error });
    });
};
