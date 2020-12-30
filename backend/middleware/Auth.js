const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  var authSucceded = false;
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decodedToken = jwt.verify(
      token,
      "8ubwh+bnbg8X45YWV3MWGx'2-.R<$0XK:.lF~r?w4Z[*V<7l3Lrg+Ba(z>lt2:p"
    );
    const userId = decodedToken.userId;
    if (req.body.userId && req.body.userId !== userId)
      throw "User ID non valable !";
    else {
      authSucceded = true;
      next();
    }
  } catch (error) {
    res.status(401).json({ error: error | "Requête non authentifiée !" });
  } finally {
    return authSucceded;
  }
};
