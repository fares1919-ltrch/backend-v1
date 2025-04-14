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
    {
      clientID: google.clientID,
      clientSecret: google.clientSecret,
      callbackURL: google.callbackURL,
      authProviderX509CertUrl: google.authProviderX509CertUrl,
      authUri: google.authUri,
      tokenUri: google.tokenUri,
      passReqToCallback: true,
      scope: ['profile', 'email']
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        if (!profile.emails?.[0]?.value) {
          throw new Error("No email found in Google profile");
        }

        const email = profile.emails[0].value;
        let user = await User.findOne({ email });

        if (!user) {
          const userRole = await Role.findOne({ name: "user" });
          if (!userRole) {
            throw new Error("Default user role not found");
          }
          
          user = new User({
            username: profile.displayName || email.split('@')[0],
            email,
            provider: "google",
            googleId: profile.id,
            roles: [userRole._id],
            firstName: profile.name?.givenName,
            lastName: profile.name?.familyName,
            photo: profile.photos?.[0]?.value
          });
          await user.save();
        }

        // Set user in the request
        req.user = user;

        return done(null, user);
      } catch (error) {
        console.error("Google OAuth error:", error);
        return done(error);
      }
    }
  )
);

// GitHub OAuth Strategy
passport.use(
  new GitHubStrategy(
    {
      clientID: github.clientID,
      clientSecret: github.clientSecret,
      callbackURL: github.callbackURL,
      authorizationURL: github.authorizationURL,
      tokenURL: github.tokenURL,
      passReqToCallback: true,
      scope: github.scope
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        console.log('GitHub Profile:', profile); // Debug log
        
        if (!profile.emails?.[0]?.value) {
          throw new Error("No email found in GitHub profile");
        }

        const email = profile.emails[0].value;
        let user = await User.findOne({ email });

        if (!user) {
          const userRole = await Role.findOne({ name: "user" });
          if (!userRole) {
            throw new Error("Default user role not found");
          }
          
          user = new User({
            username: profile.username || email.split('@')[0],
            email,
            provider: "github",
            githubId: profile.id,
            roles: [userRole._id],
            firstName: profile.name?.givenName,
            lastName: profile.name?.familyName,
            photo: profile.photos?.[0]?.value
          });
          await user.save();
        }

        // Set user in the request
        req.user = user;

        return done(null, user);
      } catch (error) {
        console.error("GitHub OAuth error:", error);
        return done(error);
      }
    }
  )
);

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user._id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).populate("roles");
    done(null, user);
  } catch (error) {
    done(error);
  }
});
