const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const pointSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['Point'],
        required: true
    },
    coordinates: {
        type: [Number],
        required: true
    }
});

const DeliveryOrderSchema = new Schema({
    _id: String,
    name: String,
    ownerId: {type: String, index: true},
    dealerId: {type: String, index: true},
    transactionId: {type: String, index: true},
    cost: Number,
    deliveryPrice: Number,
    status: {type: String, enum: ['paid', 'pending'], index: true},
    orders: [{}],
    origin: {},
    location: {type: pointSchema, index: {type: '2dsphere', sparse: true}},
    expiration_minutes: Number,
}, {timestamps: true});

const PaymentInfoSchema = new Schema( {
    _id: String,
    transaction_id: {type: String, index: true},
    card: {},
    currency_id: String,
    date_approved: String,
    description: String,
    fee_details: [{}],
    installments: Number,
    operation_type: String,
    payer: {},
    payment_method_id: String,
    payment_type_id: String,
    platform_id: String,
    point_of_interaction: {},
    processing_mode: String,
    taxes_amount: Number,
    transaction_amount_refunded: Number,
    transaction_details: {}
}, {timestamps: true});

const DeliveryOrder = mongoose.model('DeliveryOrder', DeliveryOrderSchema);
const PaymentInfo = mongoose.model('PaymentInfo', PaymentInfoSchema);

const db = new function() {
    mongoose.connect(process.env.MONGODB_URI);
    this.mongoose = mongoose;
    this.Schema = Schema;
    this.ObjectId = mongoose.Types.ObjectId;
    this.DeliveryOrder = DeliveryOrder;
    this.PaymentInfo = PaymentInfo;
};

process.on('exit', function() {
    console.log('Desconnecting db');
    mongoose.disconnect();
});

module.exports = db;
