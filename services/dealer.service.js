const _ = require('lodash');
const dealerRepo = require('../repository/dealer_profile.repository');

const GREEN_REPUTATION = '5_green';
const LIGHT_GREEN_REPUTATION = '4_light_green';
const YELLOW_REPUTATION = '3_yellow';
const ORANGE_REPUTATION = '2_orange';
const RED_REPUTATION = '1_red';
const NO_REPUTATION = '0_no';

class DealerService {
  setProfile(dealerId, profile) {
    return dealerRepo.newProfile(_.assign(profile, {dealerId: dealerId}));
  }

  getProfileByDealer(dealerId) {
    return dealerRepo.getByDealerId(dealerId)
      .then(dealerDto => dealerDto.toObject())
      .then(dealer => {
        return _.assign(dealer, {reputation: {level_id: this.#calculateReputation(dealer)}});
      });
  }

  #calculateReputation = (dealer) => {
    let rep = 5;
    if (dealer.shippings === 0) return NO_REPUTATION;
    if (dealer.vanned) return RED_REPUTATION;
    rep=- this.#calculateClaimsReputation(dealer);
    rep=- this.#calculateCancelReputation(dealer);
    rep=- this.#calculateDelayReputation(dealer);

    if (rep > 4) return GREEN_REPUTATION;
    if (rep > 3) return LIGHT_GREEN_REPUTATION;
    if (rep > 2) return YELLOW_REPUTATION;
    if (rep > 1) return ORANGE_REPUTATION;

    return RED_REPUTATION;
  };

  #calculateClaimsReputation = (dealer) => {
    return Math.floor(dealer.claims*100/dealer.shippings);
  }

  #calculateCancelReputation = (dealer) => {
    return Math.floor(dealer.cancel*60/dealer.shippings);
  }

  #calculateDelayReputation = (dealer) => {
    return Math.floor(dealer.cancel*40/dealer.shippings);
  }
}

const service = new DealerService();

module.exports = service;
