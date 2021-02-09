const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemail = require("nodemailer");

const User = require("../models/user.model");

const Auth = require("../middleware/Auth");

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
  const index = connectedPlayers.findIndex((val) => val.userId == userId);
  if (index != -1)
    connectedPlayers[index].activity = connectedPlayers[index].activity + 1;
  return userId;
};

const antiAFK = setInterval(() => {
  connectedPlayers.forEach((val, key) => {
    if (val.activity == 0) {
      connectedPlayers.splice(key, 1);
    }
    val.activity = 0;
  });
}, 10000);

//Signup : send new uer info to DB
exports.signUp = (req, res, next) => {
  //Handle classic errors
  if (req.body.username.length <= 0)
    return res.status(400).json({ error: "Pseudo vide !" });
  if (!req.body.email.includes("@"))
    return res.status(400).json({ error: "Email invalide !" });
  if (req.body.password.length < 8)
    return res.status(400).json({ error: "Mot de passe trop court !" });
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
          res.status(201).json({ message: "Utilisateur créé !" })
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
          return res.status(404).json({ error: "Utilisateur non trouvé !" });
        //User found, fetch password with DB info
        bcrypt
          .compare(req.body.password, user.password)
          .then((valid) => {
            //Invalid password
            if (!valid)
              return res
                .status(401)
                .json({ error: "Mot de passe incorrect !" });
            //User already connected (prevent 2 users to be on the same account)
            if (connectedPlayers.find((val) => val.userId == user._id) != null)
              return res.status(401).json({
                error: "Quelqu'un est déjà connecté à ce compte !",
              });
            //Return user id + a connection token that last 72h max
            res.status(202).json({
              userId: user._id,
              token: jwt.sign(
                { userId: user._id },
                "8ubwh+bnbg8X45YWV3MWGx'2-.R<$0XK:.lF~r?w4Z[*V<7l3Lrg+Ba(z>lt2:p",
                {
                  expiresIn: "72h",
                }
              ),
              username: user.username,
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
          return res.status(404).json({ error: "Utilisateur non trouvé !" });
        bcrypt
          .compare(req.body.password, user.password)
          .then((valid) => {
            if (!valid)
              return res
                .status(401)
                .json({ error: "Mot de passe incorrect !" });
            if (connectedPlayers.find((val) => val.userId == user._id) != null)
              return res.status(401).json({
                error: "Quelqu'un est déjà connecté à ce compte !",
              });
            res.status(202).json({
              userId: user._id,
              token: jwt.sign(
                { userId: user._id },
                "8ubwh+bnbg8X45YWV3MWGx'2-.R<$0XK:.lF~r?w4Z[*V<7l3Lrg+Ba(z>lt2:p",
                {
                  expiresIn: "72h",
                }
              ),
              username: user.username,
            });
          })
          .catch((error) => res.status(500).json({ error }));
      })
      .catch((error) => res.status(500).json({ error }));
  }
};

//Logout : remove player from Connected Players array
exports.logout = (req, res, next) => {
  const userId = getUserId(req);
  const index = connectedPlayers.findIndex((val) => val.userId == userId);
  if (index >= 0) {
    connectedPlayers.splice(index, 1);
    return res.status(200).json({ message: "Utilisateur déconnecté !" });
  }
  //Throw errors
  return res.status(400).json({
    error: "L'utilisateur n'est pas dans la liste des joueurs connectés !",
  });
};

//Auth : check validity of user's token + register if connected or not
exports.auth = (req, res, next) => {
  const userId = getUserId(req);
  const index = connectedPlayers.findIndex((val) => val.userId == userId);
  //Call auth to check token and return succession
  const authResult = Auth(req, res, next);
  if (authResult) {
    //Add user only if not in connectedPlayers
    if (index == -1)
      connectedPlayers.push({ userId: userId, activity: 0, room: "" });
    return res.status(202).json({ message: "Authentification réussie !" });
  }
  if (!authResult) {
    //Remove user from connectedPlayers
    if (index >= 0) connectedPlayers.splice(index, 1);
    return res.status(401).json({ error: "Authentification échouée !" });
  }
};

//Get connected players : return an array of all connected players
exports.getConnectedPlayers = (req, res, next) => {
  const userId = getUserId(req);
  User.find(
    {
      _id: {
        $in: connectedPlayers.map((val) => {
          return val.userId;
        }),
      },
    },
    { _id: false, password: false, email: false }
  )
    .then((users) => {
      return res.status(200).json({ result: users });
    })
    .catch((error) => {
      return res.status(500).json({ error: error });
    });
};

exports.recoverPassword = (req, res, next) => {
  User.findOne({ email: req.body.email }).then((user) => {
    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouvé !" });
    }
    const transport = nodemail.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: "noreply.play.undercover@gmail.com",
        pass: "druY,k}#3b7G*sY!W+W>~EexGnBQ4T/4m8Db@",
      },
    });
    const mailOptions = {
      from: `"noreply.play.undercover", "noreply.play.undercover@gmail.com"`,
      to: req.body.email,
      subject: "Undercover, Récupération de mot de passe",
      html: "<h1>And here is the place for HTML</h1>",
    };

    transport.sendMail(mailOptions, (error, info) => {
      if (error) return res.status(500).json({ error: error });
      return res.status(200).json({ message: "Mail envoyé !" });
    });
  });
};
