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
    'Authorization': `Bearer ${process.env.MELI_PAGO_ACCESS_TOKEN}`,
    'Content-Type': 'application/json'
};
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
        console.log("Payment -> ");
        if (data.status === APPROVED_STATUS) {
            return this.#generateTransaction(data);
        } else {
            return this.#transactionIsNotApproved(data);
        }
    }

    async #generateTransaction(transactionData) {
        const payment = JSON.parse(await redisService.get(transactionData.external_reference));
        await paymentInfoRepo.newPaymentInfo(transactionData);
        const deliveryOrderData = _.first(payment.items);
        console.log(`Delivery Order recuperada de redis ${JSON.stringify(payment)}`);
        return {deliveryInfo: deliveryOrderData, transactionId: transactionData.id};
    }

    #transactionIsNotApproved(transactionData) {
        console.log(`Transaction ${transactionData.id} is in status ${transactionData.status}`);
        return Promise.reject({message: `Pay status ${transactionData.status}`});
    }

    refund(transactionId) {
        return axios
          .post(
            `${MERCADOPAGO_API_URL}/payments/${transactionId}/refunds`,
            {},
            { headers: HEADERS }
          )
          .then(response => response.data)
          .then((data) => console.log('Refund response ' + JSON.stringify(data)));
    }
}

const service = new PaymentsService();

module.exports = service;
