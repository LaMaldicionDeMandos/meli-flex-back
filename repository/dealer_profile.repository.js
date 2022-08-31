const db = require('./DB');
const _ = require('lodash');

class DealerProfileRepository {
    newProfile(profileDTO) {
        const profile = new db.DealerProfile();
        profile._id = new db.ObjectId();
        profile.dealerId =  profileDTO.dealerId;
        profile.firstName =  profileDTO.firstName;
        profile.lastName =  profileDTO.lastName;
        profile.dni =  profileDTO.dni;
        profile.dniFrontUri =  profileDTO.dniFrontUri;
        profile.dniBackUri =  profileDTO.dniBackUri;
        profile.profileImageUri =  profileDTO.profileImageUri;
        profile.cbu =  profileDTO.cbu;
        profile.shippings = 0;
        profile.claims = 0;
        profile.cancels = 0;
        profile.delays = 0;
        profile.vanned = false;

        return profile.save();
    }

    getByDealerId(dealerId) {
        return db.DealerProfile.findOne({dealerId: dealerId});
    }
}

const repo = new DealerProfileRepository();

module.exports = repo;
