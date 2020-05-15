var Client = require('strong-pubsub');
var Adapter = require('strong-pubsub-mqtt');
var MqttConnection = require('strong-pubsub-connection-mqtt');
var Proxy = require('strong-pubsub-bridge');
var Primus = require('primus');
var express = require('express');
var config = require("./crux-gateway-bridge-config.json");
var http = require('http');

var app = express();
const PRIMUS_PORT = config.PORTS.PRIMUS_PORT || 4005;
const httpServer = http.createServer(app)
var primusServer = new Primus(httpServer, {
    transformer: 'websockets',
    parser: 'binary'
});

primusServer.on('connection', function(spark) {
    var bridge = new Proxy(
        new MqttConnection(spark),
        new Client({host: config.HOST_URL.BROKER_HOST, port: config.PORTS.BROKER_PORT}, Adapter)
    );
    bridge.before("connect", async (ctx, next) => {
        try {
            console.log("Connected: ", ctx);
            next();
        } catch (err) {
            console.log(err);
            return "err";
        }
    });
    bridge.before("publish", async (ctx, next) => {
        try {
            console.log("Valid Publisher");
            console.log(ctx.clientId, " published a message: ", ctx.message.toString(), " || on topic: ", ctx.topic);
            next();
        } catch (err) {
            console.log(err);
            return "err";
        }
    });
    bridge.before("subscribe", (ctx, next) => {
        try {
            console.log("Valid Subscriber");
            console.log(ctx.clientId, " subscribed to: ", ctx.mqttPacket.subscriptions[0].topic);
            next();
        } catch (err) {
            console.log(err);
            return "err";
        }
    });
    bridge.before("unsubscribe", (ctx, next) => {
        try {
            console.log("Valid Unsubscription");
            console.log("unsubscribed from: ", ctx.mqttPacket.unsubscriptions[0]);
            next();
        } catch (err) {
            console.log(err);
            return "err";
        }
    });

    bridge.connect();
});

httpServer.listen(PRIMUS_PORT, function(err) {
  console.log(err || 'Primus server listening at port ' + PRIMUS_PORT);
});