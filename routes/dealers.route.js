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

router.get('/orders/available',
  [keepPropertiesAfter('_id,orders,location,origin,deliveryPrice,ttl')],
  async (req, res, next) => {
    const accessToken = req.get('Authorization');
    await userService.getUser(accessToken);

    deliveryOrdersService.findAll({status: 'paid'})
      .then(deliveryOrders => {
        res.status(200).send(deliveryOrders);
      })
      .catch(e => {
        res.sendStatus(500);
      });
  });

module.exports = router;
