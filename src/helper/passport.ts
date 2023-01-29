import passport from 'passport'
import {Strategy as JwtStrategy} from 'passport-jwt'
const GoogleStrategy = require('passport-google-oidc')
import {config} from '../config'
const ExtractJWT = require('passport-jwt').ExtractJwt;

passport.use(
    new JwtStrategy(
      {
        secretOrKey: `${config.SECRET}`,
  
        jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
      },
      // eslint-disable-next-line consistent-return
      async (token, done) => {
      }
    )
  );
  
  passport.use(new GoogleStrategy({
    clientID: process.env['GOOGLE_CLIENT_ID'],
    clientSecret: process.env['GOOGLE_CLIENT_SECRET'],
    callbackURL: 'https://www.example.com/oauth2/redirect/google'
  },
  function(issuer, profile, cb) {
   
  }
));