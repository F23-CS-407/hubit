import session, { Cookie } from 'express-session';
import passport from 'passport';
import LocalStrategy from 'passport-local';
import MongoStore from 'connect-mongo';
import mongoose from 'mongoose';

import { verify, serializeUser, deserializeUser } from './utils.js';
import { createUser, deleteUser, login, logout, get_user } from './endpoints.js';

export default function useAuthentication(app, options) {
  // if max age given in options, use it, otherise expire in one day
  const oneDayMs = 86400000;
  let maxCookieAge = oneDayMs;
  if (options && options.cookieMaxAge) {
    maxCookieAge = options.cookieMaxAge;
  }

  // set up sessions and add them to the app
  app.use(
    session({
      name: 'hubit_cookie',
      secret: 'hubit secret',
      resave: false,
      saveUninitialized: true,
      store: new MongoStore({ mongoUrl: mongoose.connection.client.s.url }),
      cookie: { httpOnly: false, secure: false, maxAge: maxCookieAge },
    }),
  );

  // set up passport
  passport.use(new LocalStrategy(verify));
  passport.serializeUser(serializeUser);
  passport.deserializeUser(deserializeUser);
  app.use(passport.initialize());
  app.use(passport.session());

  // auth endpoints
  app.post('/login', login);
  app.delete('/logout', logout);
  app.post('/create_user', createUser);
  app.delete('/delete_user', deleteUser);

  // Get user data when logged in
  app.get('/user_info', get_user);

  return app;
}
