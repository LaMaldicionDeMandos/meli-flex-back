const express = require('express');
const { check, validationResult } = require('express-validator');
const keepPropertiesAfter = require('./keepPropertiesAfter');

const deliveryOrdersService = require('../services/deliveryOrders.service');
const userService = require('../services/user.service');
const dealerService = require('../services/dealer.service');

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

router.get('/orders/my',
  [keepPropertiesAfter('_id,orders,location,origin,deliveryPrice,owner(nickname,permalink,seller_reputation),ttl')],
  async (req, res, next) => {
    const accessToken = req.get('Authorization');
    const user = await userService.getUser(accessToken);

    deliveryOrdersService.findAllByDealer(user.id, accessToken,{status: 'accepted'})
      .then(deliveryOrders => {
        res.status(200).send(deliveryOrders);
      })
      .catch(e => {
        res.sendStatus(500);
      });
  });

router.get('/orders/:id',
  [keepPropertiesAfter('_id,orders,location,origin,deliveryPrice,owner(nickname,permalink,seller_reputation),ttl')],
  async (req, res, next) => {
    const accessToken = req.get('Authorization');

    deliveryOrdersService.getPopulatedDeliveryOrder(req.params.id, accessToken)
      .then(deliveryOrder => {
        res.status(200).send(deliveryOrder);
      })
      .catch(e => {
        res.sendStatus(500);
      });
  });

router.post('/orders/:id/dealer',
  async (req, res, next) => {
    const accessToken = req.get('Authorization');
    const user = await userService.getUser(accessToken);
    deliveryOrdersService.assignDealer(user.id, req.params.id)
      .then(result => {
        res.status(201).send(result);
      })
      .catch(e => {
        res.sendStatus(500);
      });
  });

router.post('/profile',
  async (req, res, next) => {
    const accessToken = req.get('Authorization');
    const user = await userService.getUser(accessToken);
    console.log('Profile: ' + JSON.stringify(req.body));
    dealerService.setProfile(user.id, req.body)
      .then(profile => res.status(201).send(profile))
      .catch(e => {
        res.sendStatus(500);
      });
  });

router.get('/profile/me',
  [keepPropertiesAfter('_id,dealerId,firstName,lastName,profileImageUri,dni,phone,cbu,shippings,reputation,cancels,claims,delays')],
  (req, res, next) => {
    const accessToken = req.get('Authorization');
    userService.getUser(accessToken)
      .then(user => dealerService.getProfileByDealer(user.id))
      .then(profile => res.send(profile))
      .catch(e => {
        res.sendStatus(500);
      });
  });

module.exports = router;
