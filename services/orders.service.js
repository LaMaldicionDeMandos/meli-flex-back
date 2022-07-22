const axios = require('axios').default;
const _ = require('lodash');

const authService = require('./authentication.service');

const MELI_URL = 'https://api.mercadolibre.com';
const IDS_SIZE_LIMIT = 20;

const HEADERS = (headers = {}) => _.assign({
  Accept: "application/json",
}, headers);

class OrdersService {

  async getOrders(accessToken) {
    const userId = await authService.getUser(accessToken);
    return axios
      .get(
        `${MELI_URL}/orders/search?seller=${userId}&sort=date_desc`,
        { headers: HEADERS({Authorization: `Bearer ${accessToken}`}) }
      )
      .then(response => response.data.results)
      .then(async orders => {
        const allItemsMap = await this.#getItemsMap(accessToken, orders);
        const populatedOrders = _.map(orders, async (order) => {
          const shippingId = order.shipping.id;
          if (shippingId) {
            const shipping = await this.#getShipping(accessToken,shippingId);
            order.shipping = shipping;
          }
          _.each(order.order_items, (it) => {
            it.item.thumbnail = allItemsMap[it.item.id].thumbnail;
            it.item.permalink = allItemsMap[it.item.id].permalink;
          })
          return order;
        });
        return Promise.all(populatedOrders);
      });
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
