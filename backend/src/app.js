import express from 'express';
import session from 'express-session';
import body_parser from 'body-parser';
import passport from 'passport';
import LocalStrategy from 'passport-local';
import mongoose from 'mongoose';
import MongoStore from 'connect-mongo';

import { verify, serializeUser, deserializeUser } from './authentication/utils.js';
import { createUser, login, logout, auth_test } from "./authentication/endpoints.js";

export default async function createApp() {
    const MONGO_URL = process.env.MONGO_URL

    // set up express and define app
    const app = express();

    app.use(body_parser.json())
    app.use(body_parser.urlencoded({ extended: false }));

    // connect to mongodb
    mongoose.set('strictQuery', false);
    await mongoose.connect(MONGO_URL);
    const db = mongoose.connection;

    // set up sessions and add them to the app
    app.use(session({
        secret: 'hubit secret',
        resave: false,
        saveUninitialized: true,
        store: new MongoStore({ mongoUrl: db.client.s.url })
    }));

    // set up passport
    passport.use(new LocalStrategy(verify));
    passport.serializeUser(serializeUser);
    passport.deserializeUser(deserializeUser);
    app.use(passport.initialize());
    app.use(passport.session());

    // auth endpoints
    app.post('/login', login);
    app.delete('/logout', logout);
    app.post('/create_user', createUser)
    app.get('/auth_test', auth_test)

    return app
}