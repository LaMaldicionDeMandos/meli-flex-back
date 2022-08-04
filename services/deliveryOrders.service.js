const _ = require('lodash');

const deliveryOrderRepo = require('../repository/delivery_order.repository');

const userService = require('./user.service');
const paymentsService = require('./payments.service');

const MIN_SHIPPING_COST = Number.parseFloat(process.env.MIN_SHIPPING_COST);
const DELIVERY_DISCOUNT_FACTOR = Number.parseFloat(process.env.DELIVERY_DISCOUNT_FACTOR);
const DELIVERY_FEE_FACTOR = Number.parseFloat(process.env.DELIVERY_FEE_FACTOR);
const CABA_STATE_ID = 'AR-C';

class DeliveryOrdersService {
  async calculateCost(deliveryOrder) {
    const zoneGroups = _.chain(deliveryOrder.orders)
      .map((order) => order.shipping)
      .reduce(this.#addToGroup, {}).value();

    const cost = _.chain(zoneGroups)
      .keys()
      .map((groupName) => {
        const shippings = zoneGroups[groupName];
        const firstShipping = _.first(shippings);
        return firstShipping.base_cost + MIN_SHIPPING_COST*(shippings.length - 1);
      })
      .reduce((sum, cost) => sum + cost, 0).value();
    return this.#applyDiscount(cost);
  }

  async newDeliveryOrder(accessToken, deliveryOrder) {
    const user = await userService.getUser(accessToken);
    const userAddress = _.find(await userService.getUserAddress(accessToken, user.id), (address) => {
      return address.status === 'active' && _.some(address.types, (type) => type === 'default_selling_address');
    });
    const deliveryOrderDTO = {
      name: deliveryOrder.name,
      ownerId: user.id.toString(),
      cost: await this.calculateCost(deliveryOrder),
      deliveryPrice: await this.#calculateDeliveryPrice(deliveryOrder),
      status: deliveryOrderRepo.PENDING,
      origin: {
        address_line: userAddress.address_line,
        floor: userAddress.floor,
        apartment: userAddress.apartment,
        zip_code: userAddress.zip_code,
        city: userAddress.city,
        state: userAddress.state,
        country: userAddress.country,
        latitude: userAddress.latitude,
        longitude: userAddress.longitude
      },
      orders: _.map(deliveryOrder.orders, (order) => {
        return {
          id: order.id,
          shippingId: order.shipping.id,
          shippingStatus: order.shipping.status,
          shippingAddress: order.shipping.receiver_address
        };
      })
    };
    const order = this.#populateDeliveryOrder(await deliveryOrderRepo.newDeliveryOrder(deliveryOrderDTO));
    return paymentsService.pay(user, order);
  }

  paid(deliveryOrderId) {
    return deliveryOrderRepo.changeStatusTo(deliveryOrderRepo.PAID, deliveryOrderId);
  }

  //TODO Tengo que pasarle las orders y el shipping creo
  #populateDeliveryOrder(deliveryOrder) {
    return deliveryOrder;
  }

  async #calculateDeliveryPrice(deliveryOrder) {
    const cost = await this.calculateCost(deliveryOrder);
    return cost * DELIVERY_FEE_FACTOR;
  }

  #getCity = (shipping) => {
    return shipping.receiver_address.state.id === CABA_STATE_ID
      ? shipping.receiver_address.state.name
      : shipping.receiver_address.city.name;
  }

  #addToGroup = (group, shipping) => {
    const groupName = this.#getCity(shipping);
    if (!group[groupName]) group[groupName] = [];
    group[groupName].push(shipping);
    return group;
  }

  #applyDiscount(cost) {
    return cost * DELIVERY_DISCOUNT_FACTOR;
  }
}

const service = new DeliveryOrdersService();

module.exports = service;