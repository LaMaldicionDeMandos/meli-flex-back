const express = require('express');
const router = express.Router();
const path = require('path');
const public = path.join(__dirname, '../public');
const deeplink = require('node-deeplink');

const MELI_URL = process.env.MELI_MOBILE_LOGIN_REDIRECT_URL;

router.get('/',
  (req, res, next) => {
    const redirectUrl = `/login?code=${req.query.code}`;
    req.query['url'] = redirectUrl;
    next();
  },
  deeplink({
    fallback: MELI_URL,
    android_package_name: 'com.mpasut.happyshipping'
  }));

module.exports = router;
