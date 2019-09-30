let requestResponseArray: { request: object, response: object }[] = [
  {
    request: {
      method: 'GET',
      baseUrl: 'https://bns.cruxpay.com',
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
    request: 
    { 
      method: 'GET',
      url: 'https://gaia.blockstack.org/hub/18izR7sjo7Nn3pb5LrnHWKdV7P42cqricA/asset-list.json',
      json: true 
    },
    response: [
      {
        "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NksifQ.eyJpc3N1ZXIiOnsicHVibGljS2V5IjoiMDJiMjQ5ODllMzI0ZmRjMDE5NWUxY2ZkOTAwNmJkYWRkNjE3NjQ2ZDQ5ODVmOTZjYjM0YmJlMjYxYmU2ZmZiZDE2In0sInN1YmplY3QiOnsicHVibGljS2V5IjoiMDJiMjQ5ODllMzI0ZmRjMDE5NWUxY2ZkOTAwNmJkYWRkNjE3NjQ2ZDQ5ODVmOTZjYjM0YmJlMjYxYmU2ZmZiZDE2In0sImNsYWltIjpbeyJhc3NldF9pZCI6IjhkZDkzOWVmLWI5ZDItNDZmMC04Nzk2LTRiZDhkYmFlZWYxYiIsIm5hbWUiOiJMaXRlY29pbiIsInN5bWJvbCI6Imx0YyIsImltYWdlX3NtX3VybCI6Imh0dHBzOi8vczMuYXAtc291dGgtMS5hbWF6b25hd3MuY29tL2NyeXB0by1leGNoYW5nZS9jb2lucy1zbS9saXRlY29pbi5wbmcifSx7ImFzc2V0X2lkIjoiNTA4YjhmNzMtNGIwNi00NTNlLTgxNTEtNzhjYjhjZmMzYmM5IiwibmFtZSI6IkV0aGVyZXVtIiwic3ltYm9sIjoiZXRoIiwiaW1hZ2Vfc21fdXJsIjoiaHR0cHM6Ly9maWxlcy5jb2luc3dpdGNoLmNvL3B1YmxpYy9jb2lucy9ldGgucG5nIn0seyJhc3NldF9pZCI6IjlhMjY3Y2MzLTBlNzItNGRiNS05MzBjLWM2MGE3NGQ2NGM1NSIsIm5hbWUiOiJCYXNpYyBBdHRlbnRpb24gVG9rZW4iLCJzeW1ib2wiOiJiYXQiLCJpbWFnZV9zbV91cmwiOiJodHRwczovL3MzLmFwLXNvdXRoLTEuYW1hem9uYXdzLmNvbS9jcnlwdG8tZXhjaGFuZ2UvY29pbnMtc20vYmF0LnBuZyJ9LHsiYXNzZXRfaWQiOiI0OTBmNzY0OC03ZmMxLTRmMGQtYWEyMy1lMDgxODVkYWY4YTUiLCJuYW1lIjoiRGlnaUJ5dGUiLCJzeW1ib2wiOiJkZ2IiLCJpbWFnZV9zbV91cmwiOiJodHRwczovL3MzLmFwLXNvdXRoLTEuYW1hem9uYXdzLmNvbS9jcnlwdG8tZXhjaGFuZ2UvY29pbnMtc20vZGlnaWJ5dGUucG5nIn0seyJhc3NldF9pZCI6Ijc3YTg4MGEwLTM0NDMtNGVlZi04NTAwLWJkYzhkY2RkMzM3MCIsIm5hbWUiOiJEYWkiLCJzeW1ib2wiOiJkYWkiLCJpbWFnZV9zbV91cmwiOiJodHRwczovL3MzLmFwLXNvdXRoLTEuYW1hem9uYXdzLmNvbS9jcnlwdG8tZXhjaGFuZ2UvY29pbnMtc20vZGFpLnBuZyJ9LHsiYXNzZXRfaWQiOiI5MDJkNGJkZS1mODc3LTQ4NmUtODEzZS0xMzU5MjBjYzdmMzMiLCJuYW1lIjoiMHgiLCJzeW1ib2wiOiJ6cngiLCJpbWFnZV9zbV91cmwiOiJodHRwczovL3MzLmFwLXNvdXRoLTEuYW1hem9uYXdzLmNvbS9jcnlwdG8tZXhjaGFuZ2UvY29pbnMvMHgucG5nIn0seyJhc3NldF9pZCI6IjA5OTljOTU5LWY2OTEtNDU1My1iNDYxLWI4OGVhNTAzMmUwYyIsIm5hbWUiOiJNb25hY28iLCJzeW1ib2wiOiJtY28iLCJpbWFnZV9zbV91cmwiOiJodHRwczovL3MzLmFwLXNvdXRoLTEuYW1hem9uYXdzLmNvbS9jcnlwdG8tZXhjaGFuZ2UvY29pbnMtc20vbW9uYWNvLnBuZyJ9LHsiYXNzZXRfaWQiOiJmZWNmZWIyNi1lNjEyLTRkZjQtYWVkNy1iZDRhZDAxOTQ5MzYiLCJuYW1lIjoiQ2l2aWMiLCJzeW1ib2wiOiJjdmMiLCJpbWFnZV9zbV91cmwiOiJodHRwczovL3MzLmFwLXNvdXRoLTEuYW1hem9uYXdzLmNvbS9jcnlwdG8tZXhjaGFuZ2UvY29pbnMtc20vY2l2aWMucG5nIn0seyJhc3NldF9pZCI6IjIwZDU3ZDdkLTNjYzEtNDI4YS1hZTkwLTA5ZmI5YzUxNjhmNSIsIm5hbWUiOiJEZWNyZWQiLCJzeW1ib2wiOiJkY3IiLCJpbWFnZV9zbV91cmwiOiJodHRwczovL3MzLmFwLXNvdXRoLTEuYW1hem9uYXdzLmNvbS9jcnlwdG8tZXhjaGFuZ2UvY29pbnMtc20vZGVjcmVkLnBuZyJ9LHsiYXNzZXRfaWQiOiI5ZDc5NjU2OS0wZmFmLTRlNGEtYjU4MS02NzZmYWIzNDMzZDkiLCJuYW1lIjoiRGlnaXhEQU8iLCJzeW1ib2wiOiJkZ2QiLCJpbWFnZV9zbV91cmwiOiJodHRwczovL3MzLmFwLXNvdXRoLTEuYW1hem9uYXdzLmNvbS9jcnlwdG8tZXhjaGFuZ2UvY29pbnMtc20vZGlnaXhkYW8ucG5nIn0seyJhc3NldF9pZCI6ImQxMzNkZDEzLWE3OTEtNGMyYi05YzE0LWI0Yzg1MzJmNmI5MSIsIm5hbWUiOiJkaXN0cmljdDB4Iiwic3ltYm9sIjoiZG50IiwiaW1hZ2Vfc21fdXJsIjoiaHR0cHM6Ly9zMy5hcC1zb3V0aC0xLmFtYXpvbmF3cy5jb20vY3J5cHRvLWV4Y2hhbmdlL2NvaW5zLXNtL2Rpc3RyaWN0MHgucG5nIn0seyJhc3NldF9pZCI6IjlkYmRjNzI3LWRlNjgtNGYyYS04OTU2LTA0YTM4ZWQ3MWNhNSIsIm5hbWUiOiJUcm9uIiwic3ltYm9sIjoidHJ4IiwiaW1hZ2Vfc21fdXJsIjoiaHR0cHM6Ly9maWxlcy5jb2luc3dpdGNoLmNvL3B1YmxpYy9jb2lucy90cngucG5nIn0seyJhc3NldF9pZCI6IjlkYmRjNzI3LWRlNjgtNGYyYS04OTU2LTA0YTM4ZWQ3MWNhNiIsIm5hbWUiOiJFT1MiLCJzeW1ib2wiOiJlb3MiLCJpbWFnZV9zbV91cmwiOiJodHRwczovL2ZpbGVzLmNvaW5zd2l0Y2guY28vcHVibGljL2NvaW5zL2Vvcy5wbmcifSx7ImFzc2V0X2lkIjoiMWQ2ZTFhOTktMWU3Ny00MWUxLTllYmItMGUyMTZmYWExNjZhIiwibmFtZSI6IkJpdGNvaW4iLCJzeW1ib2wiOiJidGMiLCJpbWFnZV9zbV91cmwiOiJodHRwczovL2ZpbGVzLmNvaW5zd2l0Y2guY28vcHVibGljL2NvaW5zL2J0Yy5wbmcifSx7ImFzc2V0X2lkIjoiYjMzYWRjN2EtYmViOS00MjFmLTk1ZDYtZDQ5NWRjNTQ5Zjc5IiwibmFtZSI6Ikxpc2siLCJzeW1ib2wiOiJsc2siLCJpbWFnZV9zbV91cmwiOiJodHRwczovL3MzLmFwLXNvdXRoLTEuYW1hem9uYXdzLmNvbS9jcnlwdG8tZXhjaGFuZ2UvY29pbnMtc20vbGlza192Mi5wbmcifSx7ImFzc2V0X2lkIjoiM2U5MmYxYjYtNjkzYy00NjU0LTliOWItOTM4NTgyZDY0ZTRmIiwibmFtZSI6IldhdmVzIiwic3ltYm9sIjoid2F2ZXMiLCJpbWFnZV9zbV91cmwiOiJodHRwczovL3MzLmFwLXNvdXRoLTEuYW1hem9uYXdzLmNvbS9jcnlwdG8tZXhjaGFuZ2UvY29pbnMtc20vd2F2ZXMucG5nIn0seyJhc3NldF9pZCI6IjI3OTRlNGM2LTZiZWMtNDVkYS1iNGE2LTc0OTk2Y2RhZDc5YSIsIm5hbWUiOiJHb2xlbSIsInN5bWJvbCI6ImdudCIsImltYWdlX3NtX3VybCI6Imh0dHBzOi8vczMuYXAtc291dGgtMS5hbWF6b25hd3MuY29tL2NyeXB0by1leGNoYW5nZS9jb2lucy1zbS9nb2xlbS5wbmcifSx7ImFzc2V0X2lkIjoiODZhM2YzZmEtZDYxNi00ZjQwLWI0NmMtMDljNDljMDE4N2UxIiwibmFtZSI6Ik9taXNlR08iLCJzeW1ib2wiOiJvbWciLCJpbWFnZV9zbV91cmwiOiJodHRwczovL3MzLmFwLXNvdXRoLTEuYW1hem9uYXdzLmNvbS9jcnlwdG8tZXhjaGFuZ2UvY29pbnMtc20vb21pc2Vnby5wbmcifSx7ImFzc2V0X2lkIjoiODk2MGMzZTctYzk1My00ZGIxLTg0OTctMzRiODJkOWNlMzIyIiwibmFtZSI6IkF1Z3VyIiwic3ltYm9sIjoicmVwIiwiaW1hZ2Vfc21fdXJsIjoiaHR0cHM6Ly9zMy5hcC1zb3V0aC0xLmFtYXpvbmF3cy5jb20vY3J5cHRvLWV4Y2hhbmdlL2NvaW5zLXNtL2F1Z3VyLnBuZyJ9XX0.tn0JZZPF6lIERN6zLYHOelD5wU_dm6CuIS4FIURld_WR2CXacJ3cdvRsS5ZQ7ywVlBjPlt1fNBUk8EiRTWLzDA",
        "decodedToken": {
          "header": {
            "typ": "JWT",
            "alg": "ES256K"
          },
          "payload": {
            "issuer": {
              "publicKey": "02b24989e324fdc0195e1cfd9006bdadd617646d4985f96cb34bbe261be6ffbd16"
            },
            "subject": {
              "publicKey": "02b24989e324fdc0195e1cfd9006bdadd617646d4985f96cb34bbe261be6ffbd16"
            },
            "claim": [
              {
                "asset_id": "8dd939ef-b9d2-46f0-8796-4bd8dbaeef1b",
                "name": "Litecoin",
                "symbol": "ltc",
                "image_sm_url": "https://s3.ap-south-1.amazonaws.com/crypto-exchange/coins-sm/litecoin.png"
              }
            ]
          },
          "signature": "tn0JZZPF6lIERN6zLYHOelD5wU_dm6CuIS4FIURld_WR2CXacJ3cdvRsS5ZQ7ywVlBjPlt1fNBUk8EiRTWLzDA"
        }
      }
    ]
  },  
  {
    request: {
      method: 'GET',
      baseUrl: 'https://bns.cruxpay.com',
      url: '/v1/names/mocked_domain.id',
      json: true
    },
    response: {
      status: "available",
    }
  },
  {
    request: {
      method: 'GET',
      baseUrl: 'https://core.blockstack.org',
      url: '/v1/names/mocked_domain.id',
      json: true
    },
    response: {
      status: "available"
    }
  },

  {
    request: {
      method: 'GET',
      baseUrl: 'https://bns.cruxpay.com',
      url: '/v1/names/mocked_subdomain.mocked_domain.id',
      json: true
    },
    response: {
      status: "available",
    }
  },
  {
    request: {
      method: 'GET',
      baseUrl: 'https://core.blockstack.org',
      url: '/v1/names/mocked_subdomain.mocked_domain.id',
      json: true
    },
    response: {
      status: "available"
    }
  }
]
  
export default requestResponseArray