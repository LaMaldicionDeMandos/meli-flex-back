const express = require('express');
const router = express.Router();

router.get('/',  (req, res, next) => {
  const accessToken = req.get('Authorization');
  console.log('Access Token ' + accessToken);
  res.send([]);
});

module.exports = router;
