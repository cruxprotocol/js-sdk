let requestResponseArray: { request: object, response: any }[] = [
  {
    request: {
      method: 'GET',
      baseUrl: 'https://core.blockstack.org',
      url: '/v1/names/devcoinswitch.id',
      json: true
    },
    response: {
      status: "registered",
      expire_block: 694987,
      resolver: null,
      address: "18izR7sjo7Nn3pb5LrnHWKdV7P42cqricA",
      zonefile_hash: "a9094d07226c7b9263928f07d03681a9f90db560",
      renewal_deadline: 699987,
      grace_period: false,
      zonefile: "$ORIGIN devcoinswitch.id\n$TTL 3600\nbob\tIN\tTXT\t\"owner=1HtFkbXFWHFW5Kd4GLfiRqkffS5KLZ91eJ\" \"seqn=0\" \"parts=1\" \"zf0=JE9SSUdJTiBib2IKJFRUTCAzNjAwCl9odHRwcy5fdGNwIFVSSSAxMCAxICJodHRwczovL2dhaWEuYmxvY2tzdGFjay5vcmcvaHViLzFIdEZrYlhGV0hGVzVLZDRHTGZpUnFrZmZTNUtMWjkxZUovcHJvZmlsZS5qc29uIgo=\"\n_http._tcp\tIN\tURI\t10\t1\t\"https://gaia.blockstack.org/hub/18izR7sjo7Nn3pb5LrnHWKdV7P42cqricA/profile.json\"\n",
      blockchain: "bitcoin",
      last_txid: "7e4ae9eb23d90eb45c8c258ff462e0e25cce257695f822e44818b047008ccb7f",
      did: "did:stack:v0:1Ce8JHUyodWwi6kQxg3c1wXoiYmLibZe8y-0"
    }
  },
  {
    request: {
      method: 'GET',
      baseUrl: 'https://bns.coinswitch.co',
      url: '/v1/names/devcoinswitch.id',
      json: true
    },
    response: {
      status: "registered",
      expire_block: 694987,
      resolver: null,
      address: "18izR7sjo7Nn3pb5LrnHWKdV7P42cqricA",
      zonefile_hash: "a9094d07226c7b9263928f07d03681a9f90db560",
      renewal_deadline: 699987,
      grace_period: false,
      zonefile: "$ORIGIN devcoinswitch.id\n$TTL 3600\nbob\tIN\tTXT\t\"owner=1HtFkbXFWHFW5Kd4GLfiRqkffS5KLZ91eJ\" \"seqn=0\" \"parts=1\" \"zf0=JE9SSUdJTiBib2IKJFRUTCAzNjAwCl9odHRwcy5fdGNwIFVSSSAxMCAxICJodHRwczovL2dhaWEuYmxvY2tzdGFjay5vcmcvaHViLzFIdEZrYlhGV0hGVzVLZDRHTGZpUnFrZmZTNUtMWjkxZUovcHJvZmlsZS5qc29uIgo=\"\n_http._tcp\tIN\tURI\t10\t1\t\"https://gaia.blockstack.org/hub/18izR7sjo7Nn3pb5LrnHWKdV7P42cqricA/profile.json\"\n",
      blockchain: "bitcoin",
      last_txid: "7e4ae9eb23d90eb45c8c258ff462e0e25cce257695f822e44818b047008ccb7f",
      did: "did:stack:v0:1Ce8JHUyodWwi6kQxg3c1wXoiYmLibZe8y-0"
    }
  },
  {
    request: {
      method: 'GET',
      baseUrl: 'https://core.blockstack.org',
      url: '/v1/names/cs1.devcoinswitch.id',
      json: true
    },
    response: {
      address: '1HtFkbXFWHFW5Kd4GLfiRqkffS5KLZ91eJ',
      blockchain: 'bitcoin',
      did: 'did:stack:v0:SeBFnSJQEeShbdQWomenyjuEKDJkC2mEuh-0',
      last_txid:
        'ee3bb9fd8cf3d804128447241d5aef3ac9e329f6af4ae1dd4346141a8e144e8f',
      status: 'registered_subdomain',
      zonefile:
        '$ORIGIN cs1\n$TTL 3600\n_https._tcp URI 10 1 "https://gaia.cruxpay.com/1HtFkbXFWHFW5Kd4GLfiRqkffS5KLZ91eJ/profile.json"\n',
      zonefile_hash: '43c015df4f9566d8d7e69be351530d63c771d3b4'
    }
  },
  {
    request: {
      method: 'GET',
      baseUrl: 'https://bns.cruxpay.com',
      url: '/v1/names/cs1.devcoinswitch.id',
      json: true
    },
    response: {
      address: '1HtFkbXFWHFW5Kd4GLfiRqkffS5KLZ91eJ',
      blockchain: 'bitcoin',
      did: 'did:stack:v0:SeBFnSJQEeShbdQWomenyjuEKDJkC2mEuh-0',
      last_txid:
        'ee3bb9fd8cf3d804128447241d5aef3ac9e329f6af4ae1dd4346141a8e144e8f',
      status: 'registered_subdomain',
      zonefile:
        '$ORIGIN cs1\n$TTL 3600\n_https._tcp URI 10 1 "https://gaia.cruxpay.com/1HtFkbXFWHFW5Kd4GLfiRqkffS5KLZ91eJ/profile.json"\n',
      zonefile_hash: '43c015df4f9566d8d7e69be351530d63c771d3b4'
    }
  },
  {
    request:
    {
      method: 'GET',
      baseUrl: 'https://core.blockstack.org',
      url: '/v1/names/example.devcoinswitch.id',
      json: true
    },
    response:
    {
      more: 'failed to find parent domain\'s resolver',
      status: 'available'
    }
  },
  {
    request:
    {
      method: 'GET',
      baseUrl: 'https://bns.cruxpay.com',
      url: '/v1/names/example.devcoinswitch.id',
      json: true
    },
    response:
    {
      status: 'available',
      more: 'failed to find parent domain\'s resolver'
    }
  },
  {
    request: {
      method: 'GET',
      baseUrl: 'https://registrar.coinswitch.co:3000',
      url: '/status/cs1',
      json: true
    },
    response: {
      "status": "Subdomain propagated"
    }
  },
  {
    request: {
      method: 'POST',
      baseUrl: 'https://registrar.coinswitch.co:3000',
      url: '/register',
      headers: { 'Content-Type': 'application/json' },
      body:
      {
        zonefile:
          '$ORIGIN bob\n$TTL 3600\n_https._tcp URI 10 1 https://hub.cruxpay.com',
        name: 'bob',
        owner_address: '1HtFkbXFWHFW5Kd4GLfiRqkffS5KLZ91eJ'
      },
      json: true,
      strictSSL: false
    },
    response:
    {
      status: true,
      message:
        'Your subdomain registration was received, and will be included in the blockchain soon.'
    }
  },
  {
    request: {
      method: 'POST',
      baseUrl: 'https://registrar.coinswitch.co:3000',
      url: '/register',
      headers: { 'Content-Type': 'application/json' },
      body:
      {
        zonefile:
          '$ORIGIN mark\n$TTL 3600\n_https._tcp URI 10 1 https://hub.cruxpay.com',
        name: 'mark',
        owner_address: '1HtFkbXFWHFW5Kd4GLfiRqkffS5KLZ91eJ'
      },
      json: true,
      strictSSL: false
    },
    response:
    {
      status: false
    }
  },
  {
    request: { method: "GET", url: "https://gaia.cruxpay.com/1HtFkbXFWHFW5Kd4GLfiRqkffS5KLZ91eJ/cruxpay.json", json: true },
    response: [{ "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NksifQ.eyJpc3N1ZXIiOnsicHVibGljS2V5IjoiMDJiYzljM2Y4ZTkyNGI3ZGU5MjEyY2ViZDAxMjlmMWJlMmU2YzNmMjkwNGU5MTFiMzA2OThiZGU3N2JlNDg3OGI4In0sInN1YmplY3QiOnsicHVibGljS2V5IjoiMDJiYzljM2Y4ZTkyNGI3ZGU5MjEyY2ViZDAxMjlmMWJlMmU2YzNmMjkwNGU5MTFiMzA2OThiZGU3N2JlNDg3OGI4In0sImNsYWltIjp7IkJUQyI6eyJhZGRyZXNzSGFzaCI6IjFIdEZrYlhGV0hGVzVLZDRHTGZpUnFrZmZTNUtMWjkxZUoifX19.U9Uxw8fNDZn-6Fe9tkzIeB3Tl97pSe8SJIwTmcJyUlOKFxzq1Sqy2KIwNQAhTrzIh9Ue9AGNWTlSh-w8zUOnWA", "decodedToken": { "header": { "typ": "JWT", "alg": "ES256K" }, "payload": { "issuer": { "publicKey": "02bc9c3f8e924b7de9212cebd0129f1be2e6c3f2904e911b30698bde77be4878b8" }, "subject": { "publicKey": "02bc9c3f8e924b7de9212cebd0129f1be2e6c3f2904e911b30698bde77be4878b8" }, "claim": { "BTC": { "addressHash": "1HtFkbXFWHFW5Kd4GLfiRqkffS5KLZ91eJ" } } }, "signature": "U9Uxw8fNDZn-6Fe9tkzIeB3Tl97pSe8SJIwTmcJyUlOKFxzq1Sqy2KIwNQAhTrzIh9Ue9AGNWTlSh-w8zUOnWA" } }]
  },
  {
    request: {
      method: 'GET',
      baseUrl: 'https://registrar.coinswitch.co:3000',
      url: '/status/example',
      json: true
    },
    response: {
      "status": "Subdomain not registered with this registrar",
      "statusCode": 404
    }
  },
  {
    request: {
      method: 'GET',
      url: "https://hub.cruxpay.com/hub_info",
      json: true
    },
    response: {
      "challenge_text": "[\"gaiahub\",\"0\",\"hub.cruxpay.com\",\"blockstack_storage_please_sign\"]",
      "latest_auth_version": "v1",
      "read_url_prefix": "https://gaia.cruxpay.com/"
    }
  },
  {
    request: {
      method: 'GET',
      baseUrl: 'https://core.blockstack.org',
      url: '/v1/names/carol.devcoinswitch.id',
      json: true
    },
    response: {
      more: 'failed to find parent domain\'s resolver',
      status: 'available'
    }
  },
  {
    request: {
      method: 'GET',
      baseUrl: 'https://bns.cruxpay.com',
      url: '/v1/names/carol.devcoinswitch.id',
      json: true
    },
    response: {
      status: 'available',
      more: 'failed to find parent domain\'s resolver'
    }
  },
  {
    request: {
      method: 'GET',
      baseUrl: 'https://registrar.coinswitch.co:3000',
      url: '/status/carol',
      json: true
    },
    response: {
      status: "Subdomain is queued for update and should be announced within the next few blocks."
    }
  },
  {
    request: {
      method: 'GET',
      baseUrl: 'https://core.blockstack.org',
      url: '/v1/names/carol1.devcoinswitch.id',
      json: true
    },
    response: {
      more: 'failed to find parent domain\'s resolver',
      status: 'available'
    }
  },
  {
    request: {
      method: 'GET',
      baseUrl: 'https://bns.cruxpay.com',
      url: '/v1/names/carol1.devcoinswitch.id',
      json: true
    },
    response: {
      status: 'available',
      more: 'failed to find parent domain\'s resolver'
    }
  },
  {
    request: {
      method: 'GET',
      baseUrl: 'https://registrar.coinswitch.co:3000',
      url: '/status/carol1',
      json: true
    },
    response: {
      status: "error subdomain was registered in transaction"
    }
  },
  {
    request: {
      method: 'GET',
      baseUrl: 'https://core.blockstack.org',
      url: '/v1/names/carol2.devcoinswitch.id',
      json: true
    },
    response: {
      more: 'failed to find parent domain\'s resolver',
      status: 'available'
    }
  },
  {
    request: {
      method: 'GET',
      baseUrl: 'https://bns.cruxpay.com',
      url: '/v1/names/carol2.devcoinswitch.id',
      json: true
    },
    response: {
      status: 'available',
      more: 'failed to find parent domain\'s resolver'
    }
  },
  {
    request: {
      method: 'GET',
      baseUrl: 'https://registrar.coinswitch.co:3000',
      url: '/status/carol2',
      json: true
    },
    response: {
      status: "Subdomain not registered with this registrar"
    }
  },
  {
    request: {
      method: 'GET',
      baseUrl: 'https://core.blockstack.org',
      url: '/v1/names/carol3.devcoinswitch.id',
      json: true
    },
    response: {
      more: 'failed to find parent domain\'s resolver',
      status: 'available'
    }
  },
  {
    request: {
      method: 'GET',
      baseUrl: 'https://bns.cruxpay.com',
      url: '/v1/names/carol3.devcoinswitch.id',
      json: true
    },
    response: {
      status: 'available',
      more: 'failed to find parent domain\'s resolver'
    }
  },
  {
    request: {
      method: 'GET',
      baseUrl: 'https://registrar.coinswitch.co:3000',
      url: '/status/carol3',
      json: true
    },
    response: {
      status: "Your subdomain was registered in transaction"
    }
  }
]

export default requestResponseArray