# CRUX Gateway Design

### Core

##### Overview
```
core
    entities
        CruxGateway
    interfaces
        IPubSubProvider
        ICruxGatewayRepository
```


##### Data Objects
```
core
    interfaces
        IGatewayPacket
        IGatewayPacketMetadata
        IGatewayIdentityCertificate
        IGatewayIdentityClaim
```

##### Explanation

* `ICruxGatewayRepository` helps us to open a `CruxGateway`
* Any 2 `CruxGateways` created from the same `ICruxGatewayRepository` can talk to each other
* `CruxGateway`s talk to each other with `IGatewayPacket`s
* `IGatewayPacket` contains `message: any` and `metadata: IGatewayPacketMetadata`
* `IGatewayPacketMetadata` may contain `senderCertificate` to prove identity of sender





### Infrastructure
```
infrastructure
    implementations
        CruxGatewayRepository
        StrongPubSubProvider
test
    crux-gateway/inmemory-infrastructrure
        InMemoryCruxGatewayRepository
        InMemoryPubSubProvider
```




