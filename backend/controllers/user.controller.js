const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemail = require("nodemailer");
const cryptoString = require("crypto-random-string");

const User = require("../models/user.model");

const Auth = require("../middleware/Auth");

let connectedPlayers = require("./connectedPlayers");

let recoveryLinks = [];

//Get userId from headers
const getUserId = (req) => {
  ///*UserId part
  //Get token from headers
  const token = req.headers.authorization.split(" ")[1];
  if (!token || token == "") return "";
  //Decode using key
  const decodedToken = jwt.verify(
    token,
    "8ubwh+bnbg8X45YWV3MWGx'2-.R<$0XK:.lF~r?w4Z[*V<7l3Lrg+Ba(z>lt2:p"
  );
  //Get userId from decoded token
  const userId = decodedToken.userId;

  //*Activity part (for anti afk)
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

//Anti AFK, kick players that have not been kicked by disconnect()
const antiAFK = setInterval(() => {
  //Check for inactive players
  connectedPlayers.forEach((val, key) => {
    if (val.activity == 0) {
      //Remove them from connected players
      connectedPlayers.splice(key, 1);
    }
    //Reset player activity
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

//Change password : change the password of a player
exports.changePassword = (req, res, next) => {
  if (req.body.password.length < 8)
    return res.status(400).json({ error: "Mot de passe trop court !" });
  const user = recoveryLinks.find((val) => val.code == req.params.code);
  if (!user) return res.status(404).json({ error: "Code invalide !" });
  //Crypt pass
  bcrypt
    .hash(req.body.password, 10)
    .then((hash) => {
      //Update in DB
      User.updateOne(
        { email: user.email },
        {
          $set: { password: hash },
          $currentDate: { lastModified: true },
        }
      )
        .then((updatedUser) => {
          return res.status(200).json({ message: "Mot de passe modifié !" });
        })
        //DB error
        .catch((error) => {
          return res.status(500).json({ error: error });
        });
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
  const connectedPlayerIndex = connectedPlayers.findIndex(
    (val) => val.userId == userId
  );
  if (connectedPlayerIndex >= 0) {
    connectedPlayers.splice(connectedPlayerIndex, 1);
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
      connectedPlayers.push({
        userId: userId,
        activity: 0,
        room: "",
        like: false,
      });
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
  //Used only to update player activity (do not remove)
  const userId = getUserId(req);
  //Find in DB
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

//Recover password : send an email to the user with a usique generated link that last for 10 min, with this link he can modify his password
exports.recoverPassword = (req, res, next) => {
  //Find user in DB
  User.findOne({ email: req.body.email }).then((user) => {
    //Not found
    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouvé !" });
    }
    //Generate host informations
    const transport = nodemail.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: "noreply.play.undercover@gmail.com",
        pass: "RrSZP=`e>>m}5<r`",
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
    //Random link code
    const randomString = cryptoString({ length: 20 });
    let count = 0;
    //Max attempts to prevent infinite loops
    const maxAttempts = 100;
    //Be sure link is unique
    while (recoveryLinks.find((val) => val.code == randomString)) {
      randomString = cryptoString({ length: 20 });
      count = count + 1;
      if (count > maxAttempts)
        return res
          .status(500)
          .json({ error: "Nombre max de tentatives dépassé" });
    }
    //If an email was alrdy sent, don't send. Prevent user to have multiple password change links (for security)
    if (recoveryLinks.find((val) => val.email == req.body.email))
      return res.status(400).json({ error: "Mail déjà envoyé !" });
    const index = recoveryLinks.length;
    recoveryLinks.push({ email: req.body.email, code: randomString });
    //Delete link in 10 min
    setTimeout(() => {
      recoveryLinks.splice(index, 1);
    }, 600000);

    //Generate email info and body
    const mailOptions = {
      from: `"noreply.play.undercover", "noreply.play.undercover@gmail.com"`,
      to: req.body.email,
      subject: "Undercover, Récupération de mot de passe",
      html:
        "<h3>Undercover, Récupération de mot de passe</h3> <p>Bonjour,<br><br>Vous avez récemment demandé une réinitialisation de mot de passe sur le site web https://roxxas96.github.io/Undercover-fullstack<br>Pour changer votre mot de passe, veuillez cliquer sur le lien suivant : https://roxxas96.github.io/Undercover-fullstack/recover/" +
        randomString +
        "<br>Ce lien n'est disponible que pour une durée de 10 min !<br><br>Cordialement,<br>L'équipe Undercover.</p>",
    };

    //Send mail
    transport.sendMail(mailOptions, (error, info) => {
      if (error) return res.status(500).json({ message: error });
      return res.status(200).json({ message: "Mail envoyé !" });
    });
  });
};

//Recover request : Check for validity of a link code for password change page
exports.recoverRequest = (req, res, next) => {
  if (recoveryLinks.find((val) => val.code == req.params.code))
    return res.status(202).json({ message: "Code bon !" });
  else return res.status(401).json({ error: "Code invalide !" });
};
