const axios = require('axios').default;
const redisService = require('./redis.service');


const MELI_SECRET = process.env.MELI_SECRET;
const MELI_MOBILE_SECRET = process.env.MELI_MOBILE_SECRET;
const MELI_APP_ID = process.env.MELI_APP_ID;
const MELI_MOBILE_APP_ID = process.env.MELI_MOBILE_APP_ID;
const MELI_REDIRECT_URL = process.env.MELI_REDIRECT_URL;
const MELI_MOBILE_REDIRECT_URL = process.env.MELI_MOBILE_REDIRECT_URL;
const MELI_ACCESS_TOKEN_URL = 'https://api.mercadolibre.com/oauth/token';
const GRANT_TYPE_CODE = 'authorization_code';
const GRANT_TYPE_REFRESH = 'refresh_token';

const HEADERS = {
  accept: "application/json",
  "content-type": "application/x-www-form-urlencoded"
};

function userIdKey(accessToken) {
  return 'USER_ID|' + accessToken;
}

function saveUser(userData) {
  const userId = userData.user_id.toString();
  const accessToken = userData.access_token;
  redisService.put(userIdKey(accessToken), userId);
  return userData;
}

class AuthenticationService {
  requestMeliAccessToken(code) {
    return axios
      .post(
        `${MELI_ACCESS_TOKEN_URL}?grant_type=${GRANT_TYPE_CODE}&client_id=${MELI_APP_ID}&client_secret=${MELI_SECRET}&code=${code}&redirect_uri=${MELI_REDIRECT_URL}`,
        {},
        { headers: HEADERS }
      )
      .then(response => response.data)
      .then(saveUser);
  }

  refreshMeliToken(refreshToken) {
    return axios
      .post(
        `${MELI_ACCESS_TOKEN_URL}?grant_type=${GRANT_TYPE_REFRESH}&client_id=${MELI_APP_ID}&client_secret=${MELI_SECRET}&refresh_token=${refreshToken}`,
        {},
        { headers: HEADERS }
      )
      .then(response => response.data)
      .then(saveUser);
  }

  requestMeliMobileAccessToken(code) {
    return axios
      .post(
        `${MELI_ACCESS_TOKEN_URL}?grant_type=${GRANT_TYPE_CODE}&client_id=${MELI_MOBILE_APP_ID}&client_secret=${MELI_MOBILE_SECRET}&code=${code}&redirect_uri=${MELI_MOBILE_REDIRECT_URL}`,
        {},
        { headers: HEADERS }
      )
      .then(response => response.data)
      .then(saveUser);
  }

  refreshMeliMobileToken(refreshToken) {
    return axios
      .post(
        `${MELI_ACCESS_TOKEN_URL}?grant_type=${GRANT_TYPE_REFRESH}&client_id=${MELI_MOBILE_APP_ID}&client_secret=${MELI_MOBILE_SECRET}&refresh_token=${refreshToken}`,
        {},
        { headers: HEADERS }
      )
      .then(response => response.data)
      .then(saveUser);
  }

  getUser(token) {
    return redisService.get(userIdKey(token));
  }
}

const service = new AuthenticationService();

module.exports = service;
