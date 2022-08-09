const express = require('express');
const { check, validationResult } = require('express-validator');
const keepPropertiesAfter = require('./keepPropertiesAfter');

const deliveryOrdersService = require('../services/deliveryOrders.service');
const userService = require('../services/user.service');

const router = express.Router();

errorMiddleware = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }
  next();
};

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

router.get('/',
  [
    check('status').optional(),
    errorMiddleware
  ],
  [keepPropertiesAfter('_id,name,orders,ownerId,cost,status,ttl')],
  async (req, res, next) => {
    const accessToken = req.get('Authorization');
    const filter = req.query.status ? {status: req.query.status} : {};
    const user = await userService.getUser(accessToken);
    deliveryOrdersService.findAll(user.id, accessToken, filter)
      .then(deliveryOrders => {
        res.status(200).send(deliveryOrders);
      })
      .catch(e => {
        res.sendStatus(500);
      });
  });

module.exports = router;
