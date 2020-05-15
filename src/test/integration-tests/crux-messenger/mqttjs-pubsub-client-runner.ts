import {MqttJsClient} from "../../../infrastructure/implementations/crux-messenger";
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
const BROKER_PORT = 1883;

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


describe('Basic Auth PubSub Client Tests - MQTT', function() {
    beforeEach(async function() {
        this.subscriber = new MqttJsClient(subscriberConfig);
        this.publisher = new MqttJsClient(publisherConfig);
    });
    
    it('Direct PubSub Client Test', async function() {

        const testMsg = "Hello Brother!!!"

        // Initiate clients
        return new Promise(async (resolve, reject) => {
            this.subscriber.subscribe("release020@cruxdev.crux", function(topic: string, msg: { toString: () => string; }) {
                expect(topic).to.equals(subscriberUserName);
                expect(msg.toString()).to.equals(testMsg);
                resolve(msg);
                console.log("subscriber3: " + topic + " " +  msg.toString());
            });

            this.publisher.publish("release020@cruxdev.crux", testMsg);
        });
    });
});


