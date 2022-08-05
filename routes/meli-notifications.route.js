const express = require('express');
const router = express.Router();

const paymentsService = require('../services/payments.service');
const deliveryOrdersService = require('../services/deliveryOrders.service');

router.post('/',  (req, res, next) => {
  const noti = req.body;
  console.log(`New notification -> ${JSON.stringify(noti)}`);
  if (req.body.type === 'payment') {
    console.log(`Hago el checkout: ${JSON.stringify(req.body)}`);
    paymentsService.newPayment(req.body.data.id)
      .then(payInfo => {
        return deliveryOrdersService.paid(payInfo.deliveryInfo.id, payInfo.transactionId.toString());
      })
      .catch(e => console.log(JSON.stringify(e)));
    //Hago el checkout
    //paymentService.mercadopagoCheckout(req.body.data.id, req.body.api_version);
  }
  // El collector_id de la creacion de la preferencias es el user_id del payment
  res.status(201).send({ok: 'ok'});
});

module.exports = router;
