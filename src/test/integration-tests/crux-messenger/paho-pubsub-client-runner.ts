import {PahoClient} from "../../../infrastructure/implementations/crux-messenger";
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
const path = '/mqtt'

// Subscriber config
const subscriberUserName = "release020@cruxdev.crux";
const subscriberConfig = {
    clientOptions: {
        host: BROKER_HOST,
        port: BROKER_PORT,
        path: path,
        clientId: subscriberUserName
    },
    subscribeOptions: {
        qos: 2
    }
};

// Publisher config
const publisherUserName = "mascot6699@cruxdev.crux";
const publisherConfig = {
    clientOptions: {
        host: BROKER_HOST,
        port: BROKER_PORT,
        path: path,
        clientId: publisherUserName
    },
    subscribeOptions: {
        qos: 2
    }
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
            await this.subscriber.subscribe("release020@cruxdev.crux", function(topic, msg: any) {
                expect(msg).to.equals(testMsg);
                console.log("subscriber3: " + topic + "----" +  msg.toString());
                res(msg);
            });

            await this.publisher.publish("release020@cruxdev.crux", testMsg);
        });
    });
});
