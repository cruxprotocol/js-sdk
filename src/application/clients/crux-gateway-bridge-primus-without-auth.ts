process.title = "crux-gateway-bridge-primus-without-auth";
// @ts-ignore
import express from "express";
// @ts-ignore
import x from "binarypack";
// @ts-ignore
import Primus from "primus";
// @ts-ignore
import Client from "strong-pubsub";
// @ts-ignore
import Proxy from "strong-pubsub-bridge";
// @ts-ignore
import MqttConnection from "strong-pubsub-connection-mqtt";
// @ts-ignore
import Adapter from "strong-pubsub-mqtt";
// @ts-ignore
import PrimusTransport from "strong-pubsub-primus";

import { createServer } from "http";

import * as config from "./crux-gateway-bridge-config.json";

x.pack();
const app = express();

const PRIMUS_PORT = 4006; // PRIMUS and TCP PORT ARE SAME as of now
const httpServer = createServer(app);
const primusServer = new Primus(httpServer, {
    parser: "binary",
    transformer: "websockets",
});

primusServer.on("connection", (spark: any) => {
    const bridge = new Proxy(
      new MqttConnection(spark),
      new Client({host: config.HOST_URL.BROKER_HOST, port: config.PORTS.BROKER_PORT}, Adapter),
    );
    bridge.before("connect", async (ctx: any, next: () => void) => {
        try {
            console.log("Connected: ", ctx);
            next();
        } catch (err) {
            console.log(err);
            return "err";
        }
    });
    bridge.before("publish", async (ctx: { clientId: any; message: { toString: () => any; }; topic: any; }, next: () => void) => {
        try {
            console.log("Valid Publisher");
            console.log(ctx.clientId, " published a message: ", ctx.message.toString(), " || on topic: ", ctx.topic);
            next();
        } catch (err) {
            console.log(err);
            return "err";
        }
    });
    bridge.before("subscribe", (ctx: { mqttPacket: { subscriptions: Array<{ topic: any; }>; }; reject: boolean; clientId: any; }, next: () => void) => {
        try {
            console.log("Valid Subscriber");
            console.log(ctx.clientId, " subscribed to: ", ctx.mqttPacket.subscriptions[0].topic);
            next();
        } catch (err) {
            console.log(err);
            return "err";
        }
    });
    bridge.before("unsubscribe", (ctx: { mqttPacket: { unsubscriptions: any[]; }; }, next: () => void) => {
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

httpServer.listen(PRIMUS_PORT, (err?: any) => {
  console.log(err || "Primus server listening at port " + PRIMUS_PORT);
});
