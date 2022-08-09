const axios = require('axios').default;
const _ = require('lodash');

const authService = require('./authentication.service');

const MELI_URL = 'https://api.mercadolibre.com';
const IDS_SIZE_LIMIT = 20;

const HEADERS = (headers = {}) => _.assign({
  Accept: "application/json",
}, headers);

const READY_TO_SHIP_STATUS = 'ready_to_ship';
const SELF_SERVICE_DELIVERY_TYPE = 'self_service';

class OrdersService {

  /*
    Estados de los envios flex
    Todavia no imprimi la etiqueta  => 'ready_to_ship'
    Imprimi la etiqueta             => 'ready_to_ship'
    Escaneo el QR y acepto el viaje => 'shipped'
    Avisó que está en viaje         => 'shipped'
    Entregado                       => 'delivered'

   */

  async getOrders(userId, accessToken) {
    return axios
      .get(
        `${MELI_URL}/orders/search?seller=${userId}&sort=date_desc`,
        { headers: HEADERS({Authorization: `Bearer ${accessToken}`}) }
      )
      .then(response => response.data.results)
      .then(orders => _.filter(orders, (order) => order.shipping.id))
      .then(async orders => {
        const ordersWithShipping = _.map(orders, async (order) => {
          const shipping = await this.#getShipping(accessToken,order.shipping.id);
          order.shipping = shipping;
          return order;
        });

        const allOrders = await Promise.all(ordersWithShipping);
        const filteredOrders = _.filter(allOrders, this.#isOrderReadyToShip);

        const allItemsMap = await this.#getItemsMap(accessToken, filteredOrders);
        _.each(filteredOrders, (order) => {
          _.each(order.order_items, (it) => {
            it.item.thumbnail = allItemsMap[it.item.id].thumbnail;
            it.item.permalink = allItemsMap[it.item.id].permalink;
          });
        });
        return filteredOrders;
      });
  }

  orderPopulated(orderId, accessToken) {
    return axios
      .get(
        `${MELI_URL}/orders/${orderId}`,
        { headers: HEADERS({Authorization: `Bearer ${accessToken}`}) }
      )
      .then(response => response.data)
      .then(async order => {
        const shipping = await this.#getShipping(accessToken,order.shipping.id);
        order.shipping = shipping;
        const allItemsMap = await this.#getItemsMap(accessToken, [order]);
        _.each(order.order_items, (it) => {
          it.item.thumbnail = allItemsMap[it.item.id].thumbnail;
          it.item.permalink = allItemsMap[it.item.id].permalink;
        });
        return order;
      });
  }

  #isOrderReadyToShip(order) {
    return order.shipping.logistic_type === SELF_SERVICE_DELIVERY_TYPE && order.shipping.status === READY_TO_SHIP_STATUS;
  }

  #getShipping(accessToken, shippingId) {
    return axios
      .get(
        `${MELI_URL}/shipments/${shippingId}`,
        { headers: HEADERS({Authorization: `Bearer ${accessToken}`}) }
      )
      .then(response => response.data);
  }

  #getItemsMap(accessToken, orders) {
    const itemIdsList = _.chain(this.#getItemIds(orders))
      .uniq(this.#getItemIds(orders))
      .chunk(IDS_SIZE_LIMIT)
      .value();
    return Promise.all(_.map(itemIdsList, (itemIds) => this.#getItemsMapLimited(accessToken, itemIds)))
      .then(itemsMaps => {
        return _.reduce(itemsMaps, (map, nMap) => _.assign(map, nMap), {});
      });
  }

  #getItemsMapLimited(accessToken, itemIds) {
    return axios
      .get(
        `${MELI_URL}/items?ids=${_.join(itemIds)}`,
        { headers: HEADERS({Authorization: `Bearer ${accessToken}`}) }
      )
      .then(response => response.data)
      .then(items => _.reduce(items, (map, item) => {
        map[item.body.id] = item.body;
        return map;
      }, {}));
  }

  #getItemIds(orders) {
    return _.chain(orders)
      .map( (order) => _.map(order.order_items, item => item.item.id))
      .flatten().value();
  }
}

const service = new OrdersService();

module.exports = service;
