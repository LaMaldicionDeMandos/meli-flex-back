const _ = require('lodash');
const axios = require('axios').default;
const { v4: uuidv4 } = require('uuid');
const mercadopago = require ('mercadopago');

const redisService = require('./redis.service');

const paymentInfoRepo = require('../repository/payment_info.repository');

mercadopago.configure({
    access_token: process.env.MELI_PAGO_ACCESS_TOKEN
});

const MERCADOPAGO_API_URL = 'https://api.mercadopago.com/v1';
const HEADERS = {
    'Authorization': `Bearer ${process.env.MELI_PAGO_ACCESS_TOKEN}`
};
const MELI_OWNER_ID = Number.parseInt(process.env.MELI_OWNER_ID);
const APPROVED_STATUS = 'approved';
const ONE_HOUR_IN_SECONDS = 60*60;

class PaymentsService {
    pay(user, order) {
        const payer = {
            name: user.first_name,
            surname: user.last_name,
            email: user.email,
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

    async newPayment(paymentId) {
        if (await paymentInfoRepo.existByTransactionId(paymentId)) return Promise.reject({message: 'payment_already_exist'});
        const data = (await axios.get(`${MERCADOPAGO_API_URL}/payments/${paymentId}`, { headers: HEADERS }))
          .data;
        console.log("Payment -> " + JSON.stringify(data));
        if (data.status === APPROVED_STATUS) {
            //this.#generateTransaction(data);
        } else {
            //this.#transactionIsNotApproved(data);
        }
    }
}

const service = new PaymentsService();

module.exports = service;
