require('dotenv').config();
var express = require('express');
const cors = require("cors");
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

const sessionRouter = require('./routes/session.route');
const meliNotificationsRouter = require('./routes/meli-notifications.route');
const meliLoginRouter = require('./routes/meli-login.route');
const ordersRouter = require('./routes/orders.route');
const deliveryOrdersRouter = require('./routes/deliveryOrders.route');
const dealersRouter = require('./routes/dealers.route');

const app = express();

const USE_WHITE_LIST = process.env.USE_CORS_ORIGIN_WHITE_LIST === 'true';

const whitelist = ["https://localhost:3000", "https://localhost/", "https://localhost"];
const corsOptions = {
    origin: function (origin, callback) {
        if (!USE_WHITE_LIST || !origin || whitelist.indexOf(origin) !== -1) {
            callback(null, true)
        } else {
            callback(new Error("Not allowed by CORS"))
        }
    }
};
app.use(cors(corsOptions));
app.use(express.static( 'public'));
app.set('view engine', 'html');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/session', sessionRouter);
app.use('/meli/notifications', meliNotificationsRouter);
app.use('/meli/login', meliLoginRouter);
app.use('/orders', ordersRouter);
app.use('/delivery', deliveryOrdersRouter);
app.use('/dealers', dealersRouter);

module.exports = app;
