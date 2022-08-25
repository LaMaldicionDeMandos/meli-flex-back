const express = require('express');
const router = express.Router();
const path = require('path');
const public = path.join(__dirname, '../public');

const MELI_URL = process.env.MELI_MOBILE_LOGIN_REDIRECT_URL;

router.get('/',  (req, res, next) => {
  const redirectUrl = `${MELI_URL}?code=${req.query.code}`;
  res.redirect('app://com.mpasut.happyshipping/login?code=' + req.query.code);
  //console.log('Redirecting to ' + redirectUrl);
  //res.sendFile(path.join(public, 'login_redirect.html'));
});

module.exports = router;
