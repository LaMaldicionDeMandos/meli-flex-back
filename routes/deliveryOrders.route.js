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

router.post('/:id/activation',
  [keepPropertiesAfter('id')],
  (req, res, next) => {
    const accessToken = req.get('Authorization');
    const delta = req.body;
    deliveryOrdersService.activeDeliveryOrder(accessToken, req.params.id, delta)
      .then(order => {
        console.log('Orden de reparto reactivada: ' + JSON.stringify(order));
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
    deliveryOrdersService.findAllByOwner(user.id, accessToken, filter)
      .then(deliveryOrders => {
        res.status(200).send(deliveryOrders);
      })
      .catch(e => {
        res.sendStatus(500);
      });
  });

router.get('/:id/status',
  async (req, res, next) => {
    const accessToken = req.get('Authorization');
    const user = await userService.getUser(accessToken);
    deliveryOrdersService.getDeliveryOrderStatus(user.id, req.params.id)
      .then(status => {
        res.status(200).send(status);
      })
      .catch(e => {
        res.sendStatus(500);
      });
  });

router.delete('/:id',
  async (req, res, next) => {
    const accessToken = req.get('Authorization');
    const user = await userService.getUser(accessToken);
    deliveryOrdersService.deleteDeliveryOrder(user.id, req.params.id)
      .then(status => {
        res.status(200).send(status);
      })
      .catch(e => {
        res.sendStatus(500);
      });
  });

module.exports = router;
