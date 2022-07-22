const partialResponse = require('express-partial-response');

const keepPropertiesAfter = (props) => {
    return (req, res, next) => {
        req.query['fields'] = props;
        partialResponse()(req, res, next);
    };
};

module.exports = keepPropertiesAfter;
