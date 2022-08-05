const express = require('express');
const keepPropertiesAfter = require('./keepPropertiesAfter');

const deliveryOrdersService = require('../services/deliveryOrders.service');

const router = express.Router();

router.post('/cost/calculation',
  (req, res, next) => {
  const deliveryOrder = req.body;
  deliveryOrdersService.calculateCost(deliveryOrder)
    .then(cost => {
      console.log('Costo de envío: ' + cost);
      res.status(201).send({cost: cost});
    })
    .catch(e => {
      res.sendStatus(500);
    });
});

router.post('/',
  [keepPropertiesAfter('id')],
  (req, res, next) => {
    const accessToken = req.get('Authorization');
    const deliveryOrder = req.body;
    deliveryOrdersService.newDeliveryOrder(accessToken, deliveryOrder)
      .then(order => {
        console.log('Nueva Ordern de reparto: ' + JSON.stringify(order));
        res.status(201).send(order);
      })
      .catch(e => {
        res.sendStatus(500);
      });
  });

//FORTEST
router.get('/ttl/:id',
  (req, res, next) => {
    deliveryOrdersService.deliveryOrderTTL(req.params.id)
      .then(ttl => res.send({ttl: ttl}))
      .catch(e => res.send({message: `Error: ${e}`}));
  });

module.exports = router;
