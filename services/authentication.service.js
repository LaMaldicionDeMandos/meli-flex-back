const axios = require('axios').default;

const MELI_SECRET = process.env.MELI_SECRET;
const MELI_APP_ID = process.env.MELI_APP_ID;
const MELI_REDIRECT_URL = process.env.MELI_REDIRECT_URL;
const MELI_ACCESS_TOKEN_URL = 'https://api.mercadolibre.com/oauth/token';
const GRANT_TYPE = 'authorization_code';

const HEADERS = {
  accept: "application/json",
  "content-type": "application/x-www-form-urlencoded"
};

class AuthenticationService {
  requestMeliAccessToken(code) {
    return axios
      .post(
        `${MELI_ACCESS_TOKEN_URL}?grant_type=${GRANT_TYPE}&client_id=${MELI_APP_ID}&client_secret=${MELI_SECRET}&code=${code}&redirect_uri=${MELI_REDIRECT_URL}`,
        {},
        { headers: HEADERS }
      )
      .then(response => response.data);
  }

  refreshMeliToken(token) {
    console.log('Refreshing token -> ' + token);
    return Promise.resolve({});
  }
}

const service = new AuthenticationService();

module.exports = service;
