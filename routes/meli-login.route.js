const express = require('express');
const router = express.Router();

const MELI_URL = process.env.MELI_MOBILE_LOGIN_REDIRECT_URL;

router.get('/',  (req, res, next) => {
  res.redirect(`${MELI_URL}?code=${req.query.code}`);
});

module.exports = router;
