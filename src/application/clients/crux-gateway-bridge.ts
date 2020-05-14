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

import { checkPublisherAccess, generateHash, topicVerification, verifySignature } from "../../packages/utils";
import { CruxExplorerClient } from "./crux-explorer-client";
import * as config from "./crux-gateway-bridge-config.json";

const TCP_PORT = config.PORTS.TCP_PORT;
const tcpServer = net.createServer();
tcpServer.on("connection", (socket) => {
    // upgrade the tcp socket into a strong-pubsub-connection
    const bridge = new Proxy(
      new MqttConnection(socket),
      new Client({host: process.env.BROKER_HOST, port: config.PORTS.BROKER_PORT}, Adapter),
    );
    bridge.before("connect", async (ctx: { auth: { username: any; password: { toString: () => string; }; }; reject: boolean; }, next: () => void) => {
        try {
            const cruxUserById = await new CruxExplorerClient().getCruxUserById(ctx.auth.username);
            const msgHash = generateHash("Hello World");
            const isVerified = verifySignature(msgHash, cruxUserById!.publicKey, JSON.parse(ctx.auth.password.toString()).derSign);
            if (!isVerified) {
              ctx.reject = true;
              throw new Error("error");
            } else {
              // @ts-ignore
              socket.auth = ctx.auth;
              console.log("Connect Verified: ", isVerified);
            }
            next();
          } catch (err) {
            console.log(err);
            return "err";
          }
    });
    bridge.before("publish", async (ctx: { topic: string; reject: boolean; clientId: any; message: { toString: () => any; }; }, next: () => void) => {
        try {
            // @ts-ignore
            const cruxUserById = await new CruxExplorerClient().getCruxUserById(socket.auth.username);
            const cruxId = ctx.topic.split("|").pop();
            // const isValidPublisher = checkPublisherAccess(cruxUserById!.blacklist, "yadu007@cruxdev.crux");
            const isValidPublisher = checkPublisherAccess(cruxUserById!.blacklist, cruxId);
            console.log(cruxUserById!.blacklist);
            console.log(cruxId);
            console.log(isValidPublisher);
            if (!isValidPublisher) {
              ctx.reject = true;
              throw new Error("Publisher validation failed.");
            } else {
              console.log("Valid Publisher: ", isValidPublisher);
              console.log(ctx.clientId, " published a message: ", ctx.message.toString(), " || on topic: ", ctx.topic);
            }
            next();
          } catch (err) {
            console.log(err);
            return "err";
          }
    });
    bridge.before("subscribe", (ctx: { mqttPacket: { subscriptions: Array<{ topic: any; }>; }; reject: boolean; clientId: any; }, next: () => void) => {
        try {
            const cruxId = ctx.mqttPacket.subscriptions[0].topic.split("|").pop();
            // @ts-ignore
            const isValidSubscriber = topicVerification(socket.auth, cruxId);
            if (!isValidSubscriber) {
              ctx.reject = true;
              throw new Error("error");
            } else {
              console.log("Valid Subscriber: ", isValidSubscriber);
              console.log(ctx.clientId, " subscribed to: ", ctx.mqttPacket.subscriptions[0].topic);
            }
            next();
          } catch (err) {
            console.log(err);
            return "err";
          }
    });
    bridge.before("unsubscribe", (ctx: { mqttPacket: { unsubscriptions: any[]; }; reject: boolean; }, next: () => void) => {
        const cruxId = ctx.mqttPacket.unsubscriptions[0].split("|").pop();
        // @ts-ignore
        const isValidUnsubscription = topicVerification(socket.auth, cruxId);
        if (!isValidUnsubscription) {
          ctx.reject = true;
          throw new Error("error");
        } else {
          console.log("Valid Unsubscription: ", isValidUnsubscription);
          console.log("unsubscribed from: ", ctx.mqttPacket.unsubscriptions[0]);
        }
        next();
    });

    bridge.connect();
});

tcpServer.listen(TCP_PORT, (err?: any) => {
  console.log(err || "TCP server listening at port " + TCP_PORT);
});
