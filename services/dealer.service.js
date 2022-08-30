const _ = require('lodash');
const dealerRepo = require('../repository/dealer_profile.repository');

class DealerService {
  setProfile(dealerId, profile) {
    return dealerRepo.newProfile(_.assign(profile, {dealerId: dealerId}));
  }

  getProfileByDealer(dealerId) {
    return dealerRepo.getByDealerId(dealerId);
  }
}

const service = new DealerService();

module.exports = service;
