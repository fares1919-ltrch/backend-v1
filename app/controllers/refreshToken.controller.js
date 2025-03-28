const db = require("../models");
const RefreshToken = db.refreshToken;
const User = db.user;
const jwt = require("jsonwebtoken");
const config = require("../config/auth.config");

exports.createRefreshToken = async (req, res) => {
  try {
    const { refreshToken: requestToken } = req.body;

    if (requestToken == null) {
      return res.status(403).json({ message: "Refresh Token is required!" });
    }

    let refreshToken = await RefreshToken.findOne({ token: requestToken });

    if (!refreshToken) {
      return res
        .status(403)
        .json({ message: "Refresh token is not in database!" });
    }

    if (RefreshToken.verifyExpiration(refreshToken)) {
      await RefreshToken.findByIdAndRemove(refreshToken._id, {
        useFindAndModify: false,
      });
      return res.status(403).json({
        message: "Refresh token was expired. Please make a new signin request",
      });
    }

    let newAccessToken = jwt.sign({ id: refreshToken.user }, config.secret, {
      expiresIn: config.jwtExpiration,
    });

    return res.status(200).json({
      accessToken: newAccessToken,
      refreshToken: refreshToken.token,
    });
  } catch (err) {
    return res.status(500).send({ message: err });
  }
};
