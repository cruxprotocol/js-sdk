import {StrongPubSubClient} from "../../../infrastructure/implementations/crux-messenger";
import 'mocha';
import chaiAsPromised from "chai-as-promised";
import * as chai from "chai";
import {patchMissingDependencies} from "../../test-utils";
// var exec = require('child_process').exec;

patchMissingDependencies()

chai.use(chaiAsPromised);
chai.should();
const expect = require('chai').expect;
const BROKER_HOST = "127.0.0.1";
const BROKER_PORT = 4005;

// Subscriber config
const subscriberUserName = "release020@cruxdev.crux";
const subscriberConfig = {
    clientOptions: {
        host: BROKER_HOST,
        port: BROKER_PORT,
        mqtt: {
            clean: false,
            clientId: subscriberUserName,
        },
    },
    subscribeOptions: {
        qos: 0,
    }
};

// Publisher config
const publisherUserName = "mascot6699@cruxdev.crux";
const publisherConfig = {
    clientOptions: {
        host: BROKER_HOST,
        port: BROKER_PORT,
        mqtt: {
            clean: false,
            clientId: publisherUserName,
        },
    },
    subscribeOptions: {
        qos: 0,
    }
};

const subscriber = new StrongPubSubClient(subscriberConfig);
const publisher = new StrongPubSubClient(publisherConfig);


describe('Basic Auth PubSub Client Tests', function() {
    beforeEach(async function() {
        // var cmd1 = "./node_modules/.bin/parcel build ./src/application/clients/crux-gateway-bridge-without-auth.ts -d dist --out-file crux-gateway-bridge-without-auth.js --no-minify --no-cache --detailed-report --target node --bundle-node-modules";
        // var cmd2 = "node dist/crux-gateway-bridge-without-auth.js";
        // exec(cmd1, function(error: any, stdout: any, stderr: any) {});
        // exec(cmd2, function(error: any, stdout: any, stderr: any) {});
    });
    it('Direct PubSub Client Test', async function() {

        const testMsg = "Hello Brother!!!"

        // Initiate clients

        subscriber.subscribe("release020@cruxdev.crux", function(topic: string, msg: { toString: () => string; }) {
            expect(topic).to.equals(subscriberUserName);
            expect(msg.toString()).to.equals(testMsg);
            console.log("subscriber3: " + topic + " " +  msg.toString());
        });

        publisher.publish("release020@cruxdev.crux", testMsg);
    });
});


