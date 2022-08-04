const db = require('./DB');
const _ = require('lodash');

class PaymentInfoRepository {
    constructor() {}

    newPaymentInfo(payment) {
        const paymentDTO = new db.PaymentInfo();
        paymentDTO._id = new db.ObjectId();
        paymentDTO.transaction_id = payment.id;
        paymentDTO.card = payment.card;
        paymentDTO.currency_id = payment.currency_id;
        paymentDTO.date_approved = payment.date_approved;
        paymentDTO.description = payment.description;
        paymentDTO.fee_details = payment.fee_details;
        paymentDTO.installments = payment.installments;
        paymentDTO.operation_type = payment.operation_type;
        paymentDTO.payer = payment.payer;
        paymentDTO.payment_method_id = payment.payment_method_id;
        paymentDTO.payment_type_id = payment.payment_type_id;
        paymentDTO.platform_id = payment.platform_id;
        paymentDTO.point_of_interaction = payment.point_of_interaction;
        paymentDTO.processing_mode = payment.processing_mode;
        paymentDTO.taxes_amount = payment.taxes_amount;
        paymentDTO.transaction_amount_refunded = payment.transaction_amount_refunded;
        paymentDTO.transaction_details = payment.transaction_details;

        return paymentDTO.save();
    }

    exist(id) {
        return db.PaymentInfo.exists({_id: id});
    }

    existByTransactionId(id) {
        return db.PaymentInfo.exists({transaction_id: id});
    }
}

const repo = new PaymentInfoRepository();

module.exports = repo;
