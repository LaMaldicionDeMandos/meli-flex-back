const express = require('express');
const router = express.Router();

router.get('/',  (req, res, next) => {
  res.redirect(`http://localhost:3000/login?code=${req.query.code}`);
});

module.exports = router;
