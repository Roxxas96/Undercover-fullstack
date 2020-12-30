const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = require("../models/user.model");

const Auth = require("../middleware/Auth");

//Signup func : send new uer info to DB
exports.signUp = (req, res, next) => {
  //Crypt password
  bcrypt
    .hash(req.body.password, 10)
    .then((hash) => {
      const user = new User({
        //Create user info
        username: req.body.username,
        email: req.body.email,
        password: hash,
      });
      //Save to DB
      user
        .save()
        .then((createdUser) =>
          res.status(201).json({ message: "Utilisateur créé !" + createdUser })
        )
        //Error : User already exist
        .catch((error) => res.status(400).json({ error }));
    })
    //Internal errors
    .catch((error) => res.status(500).json({ error }));
};

//Login func : check connection info and fetch with DB
exports.login = (req, res, next) => {
  //Determine if login info is a mail or a username
  if (req.body.login.includes("@")) {
    //Find user on DB
    User.findOne({ email: req.body.login })
      .then((user) => {
        //User not found
        if (!user)
          return res.status(401).json({ error: "Utilisateur non trouvé !" });
        //User found, fetch password with DB info
        bcrypt
          .compare(req.body.password, user.password)
          .then((valid) => {
            //Invalid password
            if (!valid)
              return status(401).json({ error: "Mot de passe incorrect !" });
            res.status(202).json({
              userId: user._id,
              token: jwt.sign({ userId: user._id }, "RANDOM_TOKEN_SECRET", {
                expiresIn: "24h",
              }),
            });
          })
          //Bcrypt compare errors
          .catch((error) => res.status(500).json({ error }));
      })
      //Internal errors
      .catch((error) => res.status(500).json({ error }));
  } else {
    //Same with username
    User.findOne({ username: req.body.login })
      .then((user) => {
        if (!user)
          return res.status(401).json({ error: "Utilisateur non trouvé !" });
        bcrypt
          .compare(req.body.password, user.password)
          .then((valid) => {
            if (!valid)
              return status(401).json({ error: "Mot de passe incorrect !" });
            res.status(202).json({
              userId: user._id,
              token: jwt.sign(
                { userId: user._id },
                "8ubwh+bnbg8X45YWV3MWGx'2-.R<$0XK:.lF~r?w4Z[*V<7l3Lrg+Ba(z>lt2:p",
                {
                  expiresIn: "72h",
                }
              ),
            });
          })
          .catch((error) => res.status(500).json({ error }));
      })
      .catch((error) => res.status(500).json({ error }));
  }
};

var connectedPlayers = [];

exports.auth = (req, res, next) => {
  const authResult = Auth(req, res, next);
  const index = connectedPlayers.indexOf(req.body.userId);
  if (authResult) {
    if (index == -1) connectedPlayers.push(req.body.userId);
    return res.status(202).json({ message: "Authentification réussie !" });
  }
  if (!authResult) {
    if (index >= 0) connectedPlayers.splice(index, 1);
    return res.status(401).json({ error: "Authentification échouée !" });
  }
};