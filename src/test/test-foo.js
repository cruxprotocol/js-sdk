
var noise = require('noise-protocol')

var foo2 = () => {
    var sClient = noise.keygen()
    var sServer = noise.keygen()

    // Initialize a Noise_KK_25519_ChaChaPoly_BLAKE2b handshake
    var client = noise.initialize('NN', true, Buffer.alloc(0), null, null, null)
    //handshakePattern, initiator, prologue, s, e, rs, re
    // var server = noise.initialize('KK', false, Buffer.alloc(0), sServer, null, sClient.publicKey)


}

var foo = () => {
    var sUser1 = noise.keygen()
    var sUser2 = noise.keygen()


    var user1HandshakeState = noise.initialize('KK', true, Buffer.alloc(0), sUser1, null, sUser2.publicKey)
    //handshakePattern, initiator, prologue, s, e, rs, re
    var user2HandshakeState = noise.initialize('KK', false, Buffer.alloc(0), sUser2, null, sUser1.publicKey)

    // var user1HandshakeState = JSON.parse(JSON.stringify(user1HandshakeStatex))
    var user1Tx = Buffer.alloc(128)
    var user2Tx = Buffer.alloc(128)

    var user1Rx = Buffer.alloc(128)
    var user2Rx = Buffer.alloc(128)

    // STEP 1
    // -> e, es, ss
    // USER 1
    // noise.writeMessage(user1HandshakeState, Buffer.alloc(0), user1Tx)
    noise.writeMessage(user1HandshakeState, Buffer.from("ANKITASDASDASDASDASDASD"), user1Tx)
    console.log("noise.writeMessage.bytes = ", noise.writeMessage.bytes);
    // USER 2
    noise.readMessage(user2HandshakeState, user1Tx.subarray(0, noise.writeMessage.bytes), user2Rx)

    // STEP 2
    // <- e, ee, se
    // USER 1
    var user1Split = noise.writeMessage(user2HandshakeState, Buffer.alloc(0), user2Tx)
    // USER 2
    var user2Split = noise.readMessage(user1HandshakeState, user2Tx.subarray(0, noise.writeMessage.bytes), user1Rx)

    // Safely dispose of finished HandshakeStates
    noise.destroy(user1HandshakeState)
    noise.destroy(user2HandshakeState)

    // Can now do transport encryption with splits
    console.log(user1Split)
    console.log(user2Split)

}


foo();
