const db = require('./DB');
const _ = require('lodash');

class DeliveryOrderRepository {
    newDeliveryOrder(deliveryOrderDTO) {
        const deliveryOrder = new db.DeliveryOrder();
        deliveryOrder._id = new db.ObjectId();
        deliveryOrder.name =  deliveryOrderDTO.name;
        deliveryOrder.ownerId =  deliveryOrderDTO.ownerId;
        deliveryOrder.cost = deliveryOrderDTO.cost;
        deliveryOrder.deliveryPrice = deliveryOrderDTO.deliveryPrice;
        deliveryOrder.status = deliveryOrderDTO.status;
        deliveryOrder.orders = deliveryOrderDTO.orders;
        deliveryOrder.location = {type: 'Point', coordinates: [deliveryOrderDTO.origin.longitude, deliveryOrderDTO.origin.latitude]};
        deliveryOrder.origin = deliveryOrder.origin;

        return deliveryOrder.save();
    }

    changeStatusTo(status, id) {
        console.log(`Change status of ${id} to ${status}`);
        return db.DeliveryOrder.updateOne({_id: id}, {status: status});
    }

    get PAID() { return 'paid'; }
    get PENDING() { return 'pending'; }
}

const repo = new DeliveryOrderRepository();

module.exports = repo;
