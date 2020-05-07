# CRUX Gateway Design

### Overview

**Main Entity**
```
core
    entities
        CruxGateway
    interfaces
        ICruxGatewayRepository
```

**Interfaces**
```
core
    interfaces
        IGatewayPacket
        IGatewayPacketMetadata
        IGatewayIdentityCertificate
        IGatewayIdentityClaim
        IPubSubProvider
```

##### Explanation
* `ICruxGatewayRepository` helps us to open a `CruxGateway`
* `IPubSubProvider` powers `ICruxGatewayRepository`
* Any 2 `CruxGateways` created from the same `ICruxGatewayRepository` can talk to each other
* `CruxGateway`s talk to each other with `IGatewayPacket`s
* `IGatewayPacket` contains `message: any` and `metadata: IGatewayPacketMetadata`
* `IGatewayPacketMetadata` may contain `IGatewayIdentityCertificate` to prove identity of sender


##### `CruxGateway` Entity Dive Deep

* `constructor` needs `IPubSubProvider`, `IGatewayProtocolHandler`, `IGatewayIdentityClaim`
* `IPubSubProvider` helps send & receive messages 
* `IGatewayProtocolHandler` helps enforce rules on message content for validation
* `IGatewayIdentityClaim` helps the sender prove her identity. A valid `IGatewayIdentityClaim` will produce a valid `IGatewayIdentityCertificate`


### Infrastructure Implementations
```
infrastructure
    implementations
        CruxLinkGatewayRepository
        StrongPubSubProvider
test
    crux-gateway/inmemory-infrastructrure
        InMemoryCruxGatewayRepository
        InMemoryPubSubProvider
```




