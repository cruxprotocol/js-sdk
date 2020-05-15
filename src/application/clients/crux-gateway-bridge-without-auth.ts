process.title = "crux-gateway-bridge-server-without-auth";
import * as net from "net";

// @ts-ignore
import Client from "strong-pubsub";
console.log(Client);
// @ts-ignore
import Proxy from "strong-pubsub-bridge";
// @ts-ignore
import MqttConnection from "strong-pubsub-connection-mqtt";
// @ts-ignore
import Adapter from "strong-pubsub-mqtt";

import { CruxExplorerClient } from "./crux-explorer-client";
import * as config from "./crux-gateway-bridge-config.json";

const TCP_PORT = config.PORTS.TCP_PORT;
let count = 1;
const tcpServer = net.createServer();
tcpServer.on("connection", (socket) => {
    // upgrade the tcp socket into a strong-pubsub-connection
    const bridge = new Proxy(
      new MqttConnection(socket),
      new Client({host: process.env.BROKER_HOST || config.HOST_URL.BROKER_HOST, port: process.env.BROKER_PORT || config.PORTS.BROKER_PORT}, Adapter),
    );
    bridge.before("connect", async (ctx: { auth: { username: any; password: { toString: () => string; }; }; reject: boolean; }, next: () => void) => {
        try {
            console.log(count);
            count++;
            console.log("Connected: ", ctx);
            next();
        } catch (err) {
            console.log(err);
            return "err";
        }
    });
    bridge.before("publish", async (ctx: { topic: string; reject: boolean; clientId: any; message: { toString: () => any; }; }, next: () => void) => {
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
    bridge.before("unsubscribe", (ctx: { mqttPacket: { unsubscriptions: any[]; }; reject: boolean; }, next: () => void) => {
        console.log("Valid Unsubscription");
        console.log("unsubscribed from: ", ctx.mqttPacket.unsubscriptions[0]);
        next();
    });

    bridge.connect();
});

tcpServer.listen(TCP_PORT, (err?: any) => {
  console.log(err || "TCP server listening at port " + TCP_PORT);
});
