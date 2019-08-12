Run sample file:
```
npm i && npm run sample
```

#Interfaces:

##Common:
* isActive() -> Boolean (is the peer connected to the signalling server)
* isListening() -> Boolean (any open channels)
* hasPayIDClaim() -> Boolean (does the client identify locally stored PayIDClaim)
* getPayIDClaim() -> PayIDClaim currently in use
* addPayIDClaim() -> Set the new/modified PayIDClaim (name && passcode)


##Wallet specific:

* activateListener() -> Open the peer connection with Signalling Server
* request -> Event emitted on new Payment Request as defined

##Service specific:

* sendPaymentRequest() -> Push a new payment Request to the Virtual address specified with their receiving passcode.
