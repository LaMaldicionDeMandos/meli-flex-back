const _ = require('lodash');
const axios = require('axios').default;
const { v4: uuidv4 } = require('uuid');
const redisService = require('./redis.service');
const mercadopago = require ('mercadopago');

mercadopago.configure({
    access_token: process.env.MELI_PAGO_ACCESS_TOKEN
});

const MERCADOPAGO_API_URL = 'https://api.mercadopago.com/v1';
const HEADERS = {
    'Authorization': `Bearer ${process.env.MELI_PAGO_ACCESS_TOKEN}`
};
const APPROVED_STATUS = 'approved';
const ONE_HOUR_IN_SECONDS = 60*60;

class PaymentsService {
    pay(user, order) {
        const payer = {
            name: user.first_name,
            surname: user.last_name,
            email: user.email,
            phone: user.phone,
            identification: user.identification
        };
        const item = {
            id: order._id,
            title: order.name,
            quantity: 1,
            currency_id: 'ARS',
            unit_price: order.cost
        }
        const paymentId = uuidv4();
        const payment = {payer: payer, items: [item], purpose: 'wallet_purchase', external_reference: paymentId};
        redisService.put(paymentId, JSON.stringify(payment), ONE_HOUR_IN_SECONDS)
        return mercadopago.preferences.create(payment)
          .then(function(response){
              return response.body;
          });
    }
}

const service = new PaymentsService();

module.exports = service;
