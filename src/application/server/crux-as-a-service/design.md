```
POST /jsonrpc
{
    method: CruxWalletClient.putAddressMap
    params: [{...}]
}
```
```
HEADERS
    x-api-key: A1412312321231K23
    
```


1. Get Private key from API Key
2. Instantiate cruxwalletclient
3. Call specified method with parameters
4. Return output to caller 


API Key access should be configurable for clients and their functions.

Some endpoints can be public and require no API key
