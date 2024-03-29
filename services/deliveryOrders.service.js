const _ = require('lodash');

const deliveryOrderRepo = require('../repository/delivery_order.repository');

const userService = require('./user.service');
const paymentsService = require('./payments.service');
const ordersService = require('./orders.service');
const redisService = require('./redis.service');

const MIN_SHIPPING_COST = Number.parseFloat(process.env.MIN_SHIPPING_COST);
const DELIVERY_DISCOUNT_FACTOR = Number.parseFloat(process.env.DELIVERY_DISCOUNT_FACTOR);
const DELIVERY_FEE_FACTOR = Number.parseFloat(process.env.DELIVERY_FEE_FACTOR);
const CABA_STATE_ID = 'AR-C';
const ONE_MINUTES_IN_SECONDS = 60;
const ONE_SECOND_IN_MILLIS = 1000;

const READY_DELIVERY_ORDER_KEY = 'ready_delivery_order';

const DEFAULT_REFUND_REASON = 'Tiempo limite de espera expirado';

class DeliveryOrdersService {

  constructor() {
    console.log('Init service, verifing expired orders');
    this.#verifyAllDeliveryOrderExpirations();
  }
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
      //deliveryPrice: await this.#calculateDeliveryPrice(deliveryOrder), // Se calcula con lo que me paga meli
      status: deliveryOrderRepo.PENDING,
      expiration_minutes: deliveryOrder.expiration_minutes,
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
    const order = await deliveryOrderRepo.newDeliveryOrder(deliveryOrderDTO);
    return paymentsService.pay(user, order);
  }

  async activeDeliveryOrder(accessToken, deliveryOrderId, delta) {
    const query = _.pick(delta, ['expiration_minutes']);
    const user = await userService.getUser(accessToken);
    await deliveryOrderRepo.updateById(deliveryOrderId, query);
    const order = await deliveryOrderRepo.getById(deliveryOrderId);
    return paymentsService.pay(user, order);
  }

  async paid(deliveryOrderId, payInfo) {
    const transactionId = payInfo.transactionId.toString();
    const deliveryPrice = this.#calculateDeliveryPrice(payInfo);
    console.log(`Marco delivery ${deliveryOrderId} como pagada, transaccion: ${transactionId}`);
    await deliveryOrderRepo.changeStatusToPaid(deliveryOrderId, transactionId);
    const deliveryOrder = await deliveryOrderRepo.getById(deliveryOrderId);
    await deliveryOrderRepo.updateById(deliveryOrderId, {deliveryPrice: deliveryPrice});
    console.log(`Delivery Order: ${JSON.stringify(deliveryOrder)}`);
    this.#pushReadyDeliveryOrder(deliveryOrder);
    return deliveryOrder;
  }

  findAllByOwner(ownerId, accessToken, filter = {}) {
    filter = this.#createFilterByClient(filter);
    return deliveryOrderRepo.findAllByOwner(ownerId, filter)
      .then(orders => Promise.all(_.map(orders, order => this.#populateDeliveryOrder(order, accessToken))));
  }

  async findAllByDealer(dealerId, accessToken, filter = {}) {
    filter = this.#createFilterByClient(filter);
    const orders = await deliveryOrderRepo.findAllByDealer(dealerId, filter);
    const promises = _.map(orders, async (order) => {
      const userInfo = await userService.getUserInfo(accessToken, order.ownerId);
      return _.assign(order, {owner: userInfo});
    });
    return Promise.all(promises);
  }

  findAll(filter = {}) {
    filter = _.pick(filter, ['status']);
    return deliveryOrderRepo.findAll(filter);
  }

  getDeliveryOrderStatus(ownerId, orderId) {
    return deliveryOrderRepo.getStatus(ownerId, orderId);
  }

  async assignDealer(dealerId, orderId) {
    const order = await deliveryOrderRepo.getById(orderId);
    if (order.status === deliveryOrderRepo.PAID && !order.dealerId)
      return deliveryOrderRepo.updateById(orderId, {dealerId: dealerId, status: deliveryOrderRepo.ACCEPTED});
    else return Promise.reject({message: 'unavailable_order'});
  }

  async getPopulatedDeliveryOrder(id, accessToken) {
    const order = await deliveryOrderRepo.getById(id);
    const userInfo = await userService.getUserInfo(accessToken, order.ownerId);
    return _.assign(order, {owner: userInfo});
  }

  async deleteDeliveryOrder(ownerId, orderId) {
    const status = await this.getDeliveryOrderStatus(ownerId, orderId);
    if (status.status === deliveryOrderRepo.PENDING) {
      await deliveryOrderRepo.deleteDeliveryOrder(orderId);
      return {ok: 'ok'};
    } else return {ok: 'error'};
  }

  async #populateDeliveryOrder(deliveryOrder, accessToken) {
    const promises = _.chain(deliveryOrder.orders)
      .map((order) => order.id)
      .map((id) => ordersService.orderPopulated(id, accessToken))
      .value();
    const populatedOrder = await Promise.all(promises).then(orders => {
      deliveryOrder.orders = orders;
      return deliveryOrder;
    });
    const ttl = await this.#deliveryOrderTTL(populatedOrder.id);
    populatedOrder.ttl = ttl;
    return populatedOrder;
  }

  #createFilterByClient(filter) {
    if (filter?.status) {
      filter = this.#addStatusToFilter(filter);
    }
    return filter;
  }

  #addStatusToFilter(filter) {
    if (filter.status === 'searching') {
      filter = _.assign(filter, {'$or': [{status: deliveryOrderRepo.PENDING}, {status: deliveryOrderRepo.PAID}]});
      _.unset(filter, 'status');
      return filter;
    }
    return filter;
  }

  async #pushReadyDeliveryOrder(deliveryOrder) {
    console.log(`order ${deliveryOrder._id} expire in ${deliveryOrder.expiration_minutes * ONE_MINUTES_IN_SECONDS} seconds`);
    const key = this.#createReadyDeliveryOrderKey(deliveryOrder._id);
    const r = await redisService.put(key, JSON.stringify(deliveryOrder), deliveryOrder.expiration_minutes * ONE_MINUTES_IN_SECONDS);
    this.#verifyDeliveryOrderExpiration(deliveryOrder._id);
    return r;
  }

  #createReadyDeliveryOrderKey(deliveryOrderId) {
    return READY_DELIVERY_ORDER_KEY + deliveryOrderId;
  }

  async #verifyAllDeliveryOrderExpirations() {
    const ids = await deliveryOrderRepo.findAllIdsOfStatus(deliveryOrderRepo.PAID);
    _.each(ids, this.#verifyDeliveryOrderExpiration);
  }

  #verifyDeliveryOrderExpiration = async (deliveryOderId) => {
    const key = this.#createReadyDeliveryOrderKey(deliveryOderId);
    const ttl = await redisService.ttl(key);
    console.log(`Order expire in ${ttl} seconds setting timeout`);
    if (ttl === redisService.EXPIRED) {
      console.log('Order expired ' + deliveryOderId);
      this.#expireDeliveryOrder(deliveryOderId);
    } else if (ttl !== redisService.NOT_EXPIRE){
      setTimeout(() => {
        console.log(`Timeout of delivery order ${deliveryOderId}`);
        this.#expireDeliveryOrder(deliveryOderId);
      }, ttl * ONE_SECOND_IN_MILLIS);
    }
  }

  async #expireDeliveryOrder(deliveryOrderId) {
    const deliveryOrder = await deliveryOrderRepo.getById(deliveryOrderId);
    if (deliveryOrder.status === deliveryOrderRepo.PAID) {
      deliveryOrderRepo.changeStatusToExpired(deliveryOrderId);
      const transactionId = deliveryOrder.transactionId;
      const response = await paymentsService.refund(transactionId, DEFAULT_REFUND_REASON);
      if (response.status === paymentsService.APPROVED_STATUS) {
        //TODO refund ok se puede avisar al vendedor
      }
      console.log('Refund ' + response.status);
    }
  }

  #calculateDeliveryPrice(payInfo) {
    console.log('Pay transaction details ' + JSON.stringify(payInfo.transaction_details));
    const cost = payInfo.transaction_details.net_received_amount;
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

  //TEST FUNCTIONS
  #deliveryOrderTTL(id) {
    return redisService.ttl(READY_DELIVERY_ORDER_KEY + id);
  }
}

const service = new DeliveryOrdersService();

module.exports = service;
