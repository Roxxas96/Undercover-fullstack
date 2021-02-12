const Word = require("../models/word.model");

//Propose word : push a couple of words in DB
exports.proposeWord = (req, res, next) => {
  const word1 = req.body.word1;
  const word2 = req.body.word2;
  if (word1 <= 0) return res.status(400).json({ error: "Mot 1 invalide !" });
  if (word2 <= 0) return res.status(400).json({ error: "Mot 2 invalide !" });
  const word = new Word({
    words: word1.trim().concat("/", word2.trim()),
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
