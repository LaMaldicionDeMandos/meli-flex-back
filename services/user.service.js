const axios = require('axios').default;
const _ = require('lodash');

const authService = require('./authentication.service');

const MELI_URL = 'https://api.mercadolibre.com';

const HEADERS = (headers = {}) => _.assign({
  Accept: "application/json",
}, headers);

class UserService {
  getUser(accessToken) {
    return axios
      .get(
        `${MELI_URL}/users/me`,
        { headers: HEADERS({Authorization: `Bearer ${accessToken}`}) }
      )
      .then(response => response.data);
  }

  getUserAddress(accessToken, userId) {
    return axios
      .get(
        `${MELI_URL}/users/${userId}/addresses`,
        { headers: HEADERS({Authorization: `Bearer ${accessToken}`}) }
      )
      .then(response => response.data);
  }
}

const service = new UserService();

module.exports = service;
