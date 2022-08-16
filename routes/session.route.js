const express = require('express');
const router = express.Router();

const service = require('../services/authentication.service');

router.post('/accessToken', (req, res) => {
  service.requestMeliAccessToken(req.body.code)
    .then(response => res.status(201).send(response))
    .catch(e => res.status(500).send(e.message));
  });

router.post('/refreshToken', (req, res) => {
  service.refreshMeliToken(req.body.refresh_token)
    .then(token => res.status(201).send(token))
    .catch(e => res.status(500).send(e.message));
});

router.post('/mobile/accessToken', (req, res) => {
  service.requestMeliAccessToken(req.body.code)
    .then(response => res.status(201).send(response))
    .catch(e => res.status(500).send(e.message));
});

router.post('/mobile/refreshToken', (req, res) => {
  service.refreshMeliToken(req.body.refresh_token)
    .then(token => res.status(201).send(token))
    .catch(e => res.status(500).send(e.message));
});

module.exports = router;
