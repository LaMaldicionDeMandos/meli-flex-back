const express = require('express');
const ordersService = require('../services/orders.service');
const keepPropertiesAfter = require('./keepPropertiesAfter');

const router = express.Router();

router.get('/',  [keepPropertiesAfter('id,date_created,buyer,order_items(item(id,title,variation_attributes,thumbnail,permalink),quantity),shipping(id,base_cost,date_created,date_first_printed,last_updated,logistic_type,order_id,receiver_address,receiver_id,shipping_items,status,status_history,tracking_number),status,tags')],
  (req, res, next) => {
  const accessToken = req.get('Authorization');
  console.log('Access Token ' + accessToken);
  ordersService.getOrders(accessToken)
    .then(data => {
      res.send(data);
    })
    .catch(e => {
      res.sendStatus(500);
    });
});

module.exports = router;
