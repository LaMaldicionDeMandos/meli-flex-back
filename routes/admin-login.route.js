const express = require('express');
const router = express.Router();
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const authenticationService = require('../services/authentication.service');

//TODO recien empiezo con esto, no está implementado el service
passport.use(new LocalStrategy({usernameField: 'user'}, (user, password, done) =>
    authenticationService.login(user, password).then((accessToken) => done(null, accessToken)).catch(err => done(null, err))
));

router.post('/', passport.authenticate('local', { session: false }),
    (req, res) => {
      console.log(`User: ${req.user}`);
      if(!req.user.error) res.send(req.user);
      else res.status(401).send(req.user);
    });

module.exports = router;
