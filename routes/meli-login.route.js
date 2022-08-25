const express = require('express');
const router = express.Router();

const MELI_URL = process.env.MELI_MOBILE_LOGIN_REDIRECT_URL;

router.get('/',  (req, res, next) => {
  const redirectUrl = `${MELI_URL}?code=${req.query.code}`;
  console.log('Redirecting to ' + redirectUrl);
  res.render("login_redirect.html");
});

module.exports = router;
