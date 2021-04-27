const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const credentials = require("./credentials.json");

const UserRoutes = require("./routes/user.route");
const RoomRoutes = require("./routes/room.route");
const WordRoutes = require("./routes/word.route");

const app = express();

//MongoDB
mongoose
  .connect(
    "mongodb+srv://Roxxas96:" +
      credentials.mongo +
      "@dbperso.apphb.mongodb.net/undercover?retryWrites=true&w=majority",
    { useNewUrlParser: true, useUnifiedTopology: true }
  )
  .then(() => console.log("Connexion à MongoDB réussie !"))
  .catch(() => console.log("Connexion à MongoDB échouée !"));

//CURSE
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content, Accept, Content-Type, Authorization"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS"
  );
  if (req.method == "OPTIONS") return res.sendStatus(200);
  next();
});

//JSON request
app.use(bodyParser.json());

//Routes
app.use("/api/auth", UserRoutes);
app.use("/api/room", RoomRoutes);
app.use("/api/words", WordRoutes);

module.exports = app;
