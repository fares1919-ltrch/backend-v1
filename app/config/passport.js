const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const GitHubStrategy = require("passport-github2").Strategy;
const jwt = require("jsonwebtoken");
const { google, github, jwtSecret } = require("./auth.config");
const User = require("../models/user.model");
const Role = require("../models/role.model");

// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    google,
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ email: profile.emails[0].value });

        if (!user) {
          const userRole = await Role.findOne({ name: "user" });
          user = new User({
            username: profile.displayName,
            email: profile.emails[0].value,
            provider: "google",
            googleId: profile.id,
            roles: [userRole._id],
          });
          await user.save();
        }

        // Generate JWT token
        const token = jwt.sign({ id: user._id }, jwtSecret, {
          expiresIn: 3600,
        });

        return done(null, { user, token });
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

// GitHub OAuth Strategy
passport.use(
  new GitHubStrategy(
    github,
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ email: profile.emails[0].value });

        if (!user) {
          const userRole = await Role.findOne({ name: "user" });
          user = new User({
            username: profile.username,
            email: profile.emails[0].value,
            provider: "github",
            githubId: profile.id,
            roles: [userRole._id],
          });
          await user.save();
        }

        // Generate JWT token
        const token = jwt.sign({ id: user._id }, jwtSecret, {
          expiresIn: 3600,
        });

        return done(null, { user, token });
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});
