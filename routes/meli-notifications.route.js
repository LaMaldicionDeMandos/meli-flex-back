const express = require('express');
const router = express.Router();

router.post('/',  (req, res, next) => {
  const noti = req.body;
  console.log(`New notification -> ${JSON.stringify(noti)}`);
  res.status(201).send({ok: 'ok'});
});

module.exports = router;
