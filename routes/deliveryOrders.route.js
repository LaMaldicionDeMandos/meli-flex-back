const express = require('express');
const deliveryOrdersService = require('../services/deliveryOrders.service');

const router = express.Router();

router.post('/cost/calculation',
  (req, res, next) => {
  const accessToken = req.get('Authorization');
  const deliveryOrder = req.body;
  deliveryOrdersService.calculateCost(accessToken, deliveryOrder)
    .then(cost => {
      console.log('Costo de envío: ' + cost);
      res.status(201).send({cost: cost});
    })
    .catch(e => {
      res.sendStatus(500);
    });
});

module.exports = router;
