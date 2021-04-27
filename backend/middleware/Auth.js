const jwt = require("jsonwebtoken");
const credentials = require("../credentials.json");

const cryptKey = credentials.jwt;

module.exports = (req, res, next) => {
  var authSucceded = false;
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decodedToken = jwt.verify(token, cryptKey);
    const userId = decodedToken.userId;
    //if token deos not match
    if (req.body.userId && req.body.userId !== userId)
      //Throw error
      throw "User ID non valable !";
    else {
      //If not auth succeded
      authSucceded = true;
      next();
    }
    //Catch any errors (can be worng token or internal errors)
  } catch (error) {
    return res
      .status(401)
      .json({ error: error | "Requête non authentifiée !" });
    //Return authSucceded var in cas we want to use Auth as a func (and not a simple middleware)
  } finally {
    return authSucceded;
  }
};
