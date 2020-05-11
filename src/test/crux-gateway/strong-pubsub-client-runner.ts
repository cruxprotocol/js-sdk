import {StrongPubSubClient} from "../../infrastructure/implementations/crux-messenger";


const BROKER_HOST = "127.0.0.1";
const BROKER_PORT = 4005;

// Subscriber config
const subcriberUserName = "release020@cruxdev.crux";
const subscriberConfig = {
    clientOptions: {
        host: BROKER_HOST,
        port: BROKER_PORT,
        mqtt: {
            clean: false,
            clientId: subcriberUserName,
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

// Initiate clients
const subscriber = new StrongPubSubClient(subscriberConfig);
const publisher = new StrongPubSubClient(publisherConfig);

subscriber.subscribe("release020@cruxdev.crux", function(topic: string, msg: { toString: () => string; }) {
    console.log("subscriber3: " + topic + " " +  msg.toString());
});


publisher.publish("release020@cruxdev.crux", "Hello Brother!!!");


