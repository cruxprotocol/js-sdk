window = undefined;
import signal from 'libsignal-protocol-nodejs';

import SessionRecord from 'libsignal-protocol-nodejs/src/SessionRecord.js';
import EventEmitter from "events"
import TypedEmitter from "typed-emitter"
import {CruxDomain} from "../core/entities";
import {IKeyManager} from "../core/interfaces";
import {CruxDomainId} from "../packages";
import {util} from './signalutil';
import {SignalProtocolStore} from './signalutil';
import {addDomainToRepo, addUserToRepo, InMemoryCruxDomainRepository, InMemoryCruxUserRepository} from "./test-utils";

// const expect = require('chai').expect;



interface GenericEncryptor {
    encryptFor: (foo: string, forId: SecureMessengerId) => string;
    decryptFrom: (foo: string, fromId: SecureMessengerId) => string;
}

interface GenericTransport {
    on(newMessage: string, handleNewMessage: (encryptedMessage: string) => void): void;

    send(to: SecureMessengerId, encryptedSerializedMessage: string): void;
}

class NullEncryptor implements GenericEncryptor{

    public encryptFor(serializedMessage: string, forId: SecureMessengerId) {
        return serializedMessage
    }

    public decryptFrom(encryptedMessage: any, fromId: SecureMessengerId) {
        return encryptedMessage
    }
}


class ECDHEncryptor implements GenericEncryptor{
    private selfId: SecureMessengerId;
    constructor(selfId: SecureMessengerId, ecdhParamsStore, selfKeyManager){
        this.selfId = selfId

    }

    public encryptFor(serializedMessage: string, forId: SecureMessengerId) {
        encryptEcdh(serializedMessage, ecdhParamsStore.getPublicKey(forId))
        return serializedMessage
    }

    public decryptFrom(encryptedMessage: any, fromId: SecureMessengerId) {
        return encryptedMessage
    }
}

// class Transport extends EventEmitter{
//
//     send(from: SecureMessengerId, to: SecureMessengerId, message: string) {
//
//     }
// }


class SharedEventBuses {
    private eventBusById: {};
    constructor(){
        this.eventBusById = {}
    }

    getEventBusFor(messengerId: SecureMessengerId) {
        // @ts-ignore
        const eventBus = this.eventBusById[messengerId.toString()]
        if (eventBus !== undefined) {
            return eventBus
        } else {
            const newEmitter = new EventEmitter();
            // @ts-ignore
            this.eventBusById[messengerId.toString()] = newEmitter
            return newEmitter;
        }
    }
}

class InMemTransport implements GenericTransport{
    public sharedEventBuses: SharedEventBuses;
    public eventBusForSelf: any;
    constructor(sharedEventBuses: any, selfId: SecureMessengerId) {
        this.sharedEventBuses = sharedEventBuses;
        this.eventBusForSelf = this.sharedEventBuses.getEventBusFor(selfId)
        // this.on = this.eventBusForSelf.on;
        // this.on.bind(this.eventBusForSelf)
        // this.on.bind(this)
    }

    send(to: SecureMessengerId, message: string) {
        this.sharedEventBuses.getEventBusFor(to).emit('newMessage', message)
    }

    on(eventName: string, handler: any){
       this.eventBusForSelf.on(eventName, handler)
    }

}


class SecureMessengerId {
    private someId: string;
    constructor(someId: string) {
        this.someId = someId;
    }
    toString(){
        return this.someId
    }
}


interface GenericSerde {
    serialize: (foo: any) => string;
    deserialize: (foo: string) => any;
}

class JSONSerde implements GenericSerde {
    serialize(foo: any){
        return JSON.stringify(foo);
    }
    deserialize(foo: string){
        return JSON.parse(foo);
    }
}



class SecureMessenger extends EventEmitter{
    private encryptor: GenericEncryptor;
    private transport: GenericTransport;
    private serde: JSONSerde;
    constructor(encryptor: GenericEncryptor, transport: GenericTransport, serde?: GenericSerde){
        super();
        this.encryptor = encryptor;
        this.transport = transport;
        if (serde){
            this.serde = serde;
        } else {
            this.serde = new JSONSerde();
        }
        this.transport.on('newMessage', this.handleNewMessage)

    }
    public send({to: SecureMessengerId, message: any}) {
        // need to refactor with cipher abstraction not encryptor
        const serializedMessage = this.serde.serialize(message)
        const encryptedSerializedMessage = this.encryptor.encrypt(serializedMessage)
        this.transport.send(to, encryptedSerializedMessage)

    }
    public handleNewMessage = (encryptedMessage: string) => {
        const decryptedSerializedMessage = this.encryptor.decrypt(encryptedMessage)
        this.emit('newMessage', this.serde.deserialize(decryptedSerializedMessage))
    }

}


function getSecureMessenger() {
    const encryptor = new NullEncryptor()
    const transport = new Transport()
}






describe('test basic secure messaging design', async function() {
    this.timeout(1000000)
    beforeEach(async function() {

    });

    it('try just event emitters', async function(done) {
        const em = new EventEmitter()
        em.on('newMessage', function(msg) {
            console.log("New Message on Emitter")
            console.log(msg);
            done()
        })
        em.emit('newMessage', 'YOYO')
    });


    it('try just event emitters on shared event bus', async function(done) {
        const seb = new SharedEventBuses()



        const userAId = new SecureMessengerId('ankit')
        const userBId = new SecureMessengerId('yadu')

        const em = seb.getEventBusFor(userAId)
        em.on('newMessage', function(msg: any) {
            console.log("New Message on Emitter")
            console.log(msg);
            done()
        })
        em.emit('newMessage', 'YOYO')
    });


    it('try just event emitters on shared event bus 2', async function(done) {
        const sharedEventBus = new SharedEventBuses()



        const userAId = new SecureMessengerId('ankit')
        const userBId = new SecureMessengerId('yadu')

        const userATransport = new InMemTransport(sharedEventBus, userAId)
        const userBTransport = new InMemTransport(sharedEventBus, userBId)


        userATransport.eventBusForSelf.on('newMessage', function(msg){
            console.log("New Message on userBTransport.eventBusForSelf")
            console.log(msg);
            done()

        })
        userATransport.eventBusForSelf.emit('newMessage', "YOYO2");
    });


    it('try just event emitters on shared event bus 3', async function(done) {
        const sharedEventBus = new SharedEventBuses()



        const userAId = new SecureMessengerId('ankit')
        const userBId = new SecureMessengerId('yadu')

        const userATransport = new InMemTransport(sharedEventBus, userAId)
        const userBTransport = new InMemTransport(sharedEventBus, userBId)



        userATransport.on('newMessage', function(msg) {
            console.log("userATransport.on")
            console.log(msg);
            done()
        })
        userBTransport.send(userAId, 'HelloHello');
    });


    it('try secure messenger', async function(done) {
        const sharedEventBus = new SharedEventBuses()


        // person A
        const userAId = new SecureMessengerId('ankit')
        const userAEncryptor = new NullEncryptor()
        const userATransport = new InMemTransport(sharedEventBus, userAId)
        const userASecureMessenger = new SecureMessenger(userAEncryptor, userATransport)

        // person B
        const userBId = new SecureMessengerId('yadu')
        const userBEncryptor = new NullEncryptor()
        const userBTransport = new InMemTransport(sharedEventBus, userBId)
        const userBSecureMessenger = new SecureMessenger(userBEncryptor, userBTransport)

        // person A wants to send person B some data -
        console.log('prep done. adding listener')

        userBSecureMessenger.on('newMessage', function(msg){
            console.log('User B received newMessage')
            console.log(msg);
            done()
        });

        console.log('added listener. sending msg')
        userASecureMessenger.send(userBId, 'TESTYOLO')

        console.log('msg sent')


    });



});








async function generateIdentity(store: any) {
    const identityKey = await signal.KeyHelper.generateIdentityKeyPair();
    const registrationId = await signal.KeyHelper.generateRegistrationId();
    await store.put('identityKey', identityKey)
    await store.put('registrationId', registrationId);

}

async function generatePreKeyBundle(store, preKeyId, signedPreKeyId) {
    const identity = await store.getIdentityKeyPair();
    const registrationId = await store.getLocalRegistrationId()

    const preKey = await signal.KeyHelper.generatePreKey(preKeyId);
    const signedPreKey = await signal.KeyHelper.generateSignedPreKey(identity, signedPreKeyId)
    await store.storePreKey(preKeyId, preKey.keyPair);
    await store.storeSignedPreKey(signedPreKeyId, signedPreKey.keyPair);

    return {
        identityKey: identity.pubKey,
        registrationId: registrationId,
        preKey: {
            keyId: preKeyId,
            publicKey: preKey.keyPair.pubKey
        },
        signedPreKey: {
            keyId: signedPreKeyId,
            publicKey: signedPreKey.keyPair.pubKey,
            signature: signedPreKey.signature
        }
    };
}


// session - when from and to both
// when we get to, we need

describe('test it', async function() {
    this.timeout(1000000)
    beforeEach(async function() {
        // universe
        this.ALICE_ADDRESS = new signal.SignalProtocolAddress("+14151111111", 1);
        this.BOB_ADDRESS = new signal.SignalProtocolAddress("+14152222222", 1);
        this.aliceStore = new SignalProtocolStore();
        this.bobStore = new SignalProtocolStore();
        await generateIdentity(this.aliceStore);
        await generateIdentity(this.bobStore);

        // bob's phone setup phase
        var bobPreKeyId = 1337;
        var bobSignedKeyId = 1;
        const preKeyBundle = await generatePreKeyBundle(this.bobStore, bobPreKeyId, bobSignedKeyId);

        // alice's phone when alice requests to send to bob
        const builder = new signal.SessionBuilder(this.aliceStore, this.BOB_ADDRESS);
        await builder.processPreKey(preKeyBundle);


    });




    it('creates a session', async function(done) {
        const record = await this.aliceStore.loadSession(this.BOB_ADDRESS.toString())
        var sessionRecord = SessionRecord.deserialize(record);
        console.log("session created")

    });

    it('session can encrypt', async function(done) {
        var originalMessage = util.toArrayBuffer("L'homme est condamné à être libre");
        var aliceSessionCipher = new signal.SessionCipher(this.aliceStore, this.BOB_ADDRESS);
        const cipherText = await aliceSessionCipher.encrypt(originalMessage);

        var bobSessionCipher = new signal.SessionCipher(this.bobStore, this.ALICE_ADDRESS);
        const decryptedMessage = await bobSessionCipher.decryptPreKeyWhisperMessage(cipherText.body, 'binary');
        console.log(util.toString(decryptedMessage))

    });

    it('session can encrydasdasdpt', async function(done) {
        var originalMessage = util.toArrayBuffer("L'homme est condamné à être libre");
        var aliceSessionCipher = new signal.SessionCipher(this.aliceStore, new signal.SignalProtocolAddress("+123123123", 1));
        const cipherText = await aliceSessionCipher.encrypt(originalMessage);

        var bobSessionCipher = new signal.SessionCipher(this.bobStore, this.ALICE_ADDRESS);
        // const decryptedMessage = await bobSessionCipher.decryptPreKeyWhisperMessage(cipherText.body, 'binary');
        // console.log(util.toString(decryptedMessage))

    });

});
