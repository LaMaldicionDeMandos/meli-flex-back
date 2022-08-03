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
    cost: Number,
    deliveryPrice: Number,
    status: {type: String, enum: ['paid', 'pending'], index: true},
    orders: [{}],
    origin: {},
    location: {type: pointSchema, index: {type: '2dsphere', sparse: true}}
}, {timestamps: true});

const DeliveryOrder = mongoose.model('DeliveryOrder', DeliveryOrderSchema);

const db = new function() {
    mongoose.connect(process.env.MONGODB_URI);
    this.mongoose = mongoose;
    this.Schema = Schema;
    this.ObjectId = mongoose.Types.ObjectId;
    this.DeliveryOrder = DeliveryOrder;
};

process.on('exit', function() {
    console.log('Desconnecting db');
    mongoose.disconnect();
});

module.exports = db;
