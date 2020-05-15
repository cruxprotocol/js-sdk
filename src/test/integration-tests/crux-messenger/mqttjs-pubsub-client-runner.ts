import { MqttJsClient, PahoClient} from "../../../infrastructure/implementations/crux-messenger";
import 'mocha';
import chaiAsPromised from "chai-as-promised";
import * as chai from "chai";
// @ts-ignore
import * as paho from "paho-mqtt"
import {patchMissingDependencies} from "../../test-utils";
import { resolveZoneFileToPerson } from "blockstack";
// var exec = require('child_process').exec;
patchMissingDependencies()
chai.use(chaiAsPromised);
chai.should();
const expect = require('chai').expect;
const BROKER_HOST = "broker.hivemq.com";
const BROKER_PORT = 8000;

// Subscriber config
const subscriberUserName = "release020@cruxdev.crux";
const subscriberConfig = {
        host: BROKER_HOST,
        port: BROKER_PORT,
        clientId: subscriberUserName
};

// Publisher config
const publisherUserName = "mascot6699@cruxdev.crux";
const publisherConfig = {
    host: BROKER_HOST,
    port: BROKER_PORT,
    clientId: publisherUserName
};



describe('Basic Auth PubSub Client Tests- Paho', function() {
    beforeEach(async function() {
        this.subscriber = new PahoClient(subscriberConfig);
        this.publisher = new PahoClient(publisherConfig);
    });
    it('Direct PubSub Client Test', async function() {

        const testMsg = "Hello Brother!!!"

        // Initiate clients
        return new Promise(async (res,rej)=>{
            await this.subscriber.subscribe("release020@cruxdev.crux", function(topic: string, msg: { toString: () => string; }) {
                expect(topic).to.equals(subscriberUserName);
                expect(msg.toString()).to.equals(testMsg);
                console.log("subscriber3: " + topic + " " +  msg.toString());
                res(msg);
            });

            this.publisher.publish("release020@cruxdev.crux", testMsg);
        });
    });
});