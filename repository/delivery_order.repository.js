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
        deliveryOrder.origin = deliveryOrderDTO.origin;
        deliveryOrder.expiration_minutes = deliveryOrderDTO.expiration_minutes;
        return deliveryOrder.save();
    }

    changeStatusToPaid(id, transactionId) {
        console.log(`Change status of ${id} to ${status} transaction id: ${transactionId}`);
        return db.DeliveryOrder.updateOne({_id: id}, {status: this.PAID, transactionId: transactionId})
          .catch(e => {
              console.error(JSON.stringify(e));
              return Promise.reject(e);
          });
    }

    getById(id) {
        return db.DeliveryOrder.findById(id);
    }

    get PAID() { return 'paid'; }
    get PENDING() { return 'pending'; }
}

const repo = new DeliveryOrderRepository();

module.exports = repo;
