const express = require('express');
const router = express.Router();

router.post('/',  (req, res, next) => {
  res.redirect(`http://localhost:3000/login?code=${req.query.code}`);
});

module.exports = router;
