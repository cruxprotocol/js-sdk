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
    request: {
      method: 'GET',
      baseUrl: 'https://core.blockstack.org',
      url: '/v1/names/scatter_dev.devcoinswitch.id',
      json: true
    },
    response: {
      address: "14WfvwxX5G9Nb1C4pq2RHn2bUophFLzrgf",
      blockchain: "bitcoin",
      did: "did:stack:v0:SQofxnjfodLa7JyXNG1VqgBA8b481i9DVr-0",
      last_txid: "e210ff5b8c10b01588c137dda3710de69eacaf08815ce3d262f3ab6a53ae1f15",
      status: "registered_subdomain",
      zonefile: "$ORIGIN dev $TTL 3600 _https._tcp URI 10 1 'https://gaia.blockstack.org/hub/14WfvwxX5G9Nb1C4pq2RHn2bUophFLzrgf/profile.json' ",
      zonefile_hash: "be7bcf0c0eda71b7abd6aac23804967969474eee"
    }
  },
  {
    request: {
      method: 'GET',
      baseUrl: 'https://bns.cruxpay.com',
      url: '/v1/names/scatter_dev.devcoinswitch.id',
      json: true
    },
    response: {
      address: "14WfvwxX5G9Nb1C4pq2RHn2bUophFLzrgf",
      blockchain: "bitcoin",
      did: "did:stack:v0:SQofxnjfodLa7JyXNG1VqgBA8b481i9DVr-0",
      last_txid: "e210ff5b8c10b01588c137dda3710de69eacaf08815ce3d262f3ab6a53ae1f15",
      status: "registered_subdomain",
      zonefile: "$ORIGIN dev $TTL 3600 _https._tcp URI 10 1 'https://gaia.blockstack.org/hub/14WfvwxX5G9Nb1C4pq2RHn2bUophFLzrgf/profile.json' ",
      zonefile_hash: "be7bcf0c0eda71b7abd6aac23804967969474eee"
    }
  },
  {
    request: {
      method: 'GET',
      url: 'https://gaia.blockstack.org/hub/14WfvwxX5G9Nb1C4pq2RHn2bUophFLzrgf/client-config.json',
      json: true
    },
    response: [
      {
        "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NksifQ.eyJjbGFpbSI6eyJhc3NldE1hcHBpbmciOnsiRU9TIjoiOWRiZGM3MjctZGU2OC00ZjJhLTg5NTYtMDRhMzhlZDcxY2E2IiwiRVRIIjoiNTA4YjhmNzMtNGIwNi00NTNlLTgxNTEtNzhjYjhjZmMzYmM5IiwiVFJYIjoiOWRiZGM3MjctZGU2OC00ZjJhLTg5NTYtMDRhMzhlZDcxY2E1IiwiQlRDIjoiMWQ2ZTFhOTktMWU3Ny00MWUxLTllYmItMGUyMTZmYWExNjZhIn0sIm5hbWVzZXJ2aWNlQ29uZmlndXJhdGlvbiI6eyJkb21haW4iOiJzY2F0dGVyX2RldiIsInN1YmRvbWFpblJlZ2lzdHJhciI6Imh0dHBzOi8vcmVnaXN0cmFyLmNvaW5zd2l0Y2guY286NDAwMCJ9LCJhc3NldExpc3QiOlt7ImFzc2V0X2lkIjoiOGRkOTM5ZWYtYjlkMi00NmYwLTg3OTYtNGJkOGRiYWVlZjFiIiwibmFtZSI6IkxpdGVjb2luIiwic3ltYm9sIjoibHRjIiwiaW1hZ2Vfc21fdXJsIjoiaHR0cHM6Ly9zMy5hcC1zb3V0aC0xLmFtYXpvbmF3cy5jb20vY3J5cHRvLWV4Y2hhbmdlL2NvaW5zLXNtL2xpdGVjb2luLnBuZyJ9LHsiYXNzZXRfaWQiOiI1MDhiOGY3My00YjA2LTQ1M2UtODE1MS03OGNiOGNmYzNiYzkiLCJuYW1lIjoiRXRoZXJldW0iLCJzeW1ib2wiOiJldGgiLCJpbWFnZV9zbV91cmwiOiJodHRwczovL2ZpbGVzLmNvaW5zd2l0Y2guY28vcHVibGljL2NvaW5zL2V0aC5wbmcifSx7ImFzc2V0X2lkIjoiOWEyNjdjYzMtMGU3Mi00ZGI1LTkzMGMtYzYwYTc0ZDY0YzU1IiwibmFtZSI6IkJhc2ljIEF0dGVudGlvbiBUb2tlbiIsInN5bWJvbCI6ImJhdCIsImltYWdlX3NtX3VybCI6Imh0dHBzOi8vczMuYXAtc291dGgtMS5hbWF6b25hd3MuY29tL2NyeXB0by1leGNoYW5nZS9jb2lucy1zbS9iYXQucG5nIn0seyJhc3NldF9pZCI6IjQ5MGY3NjQ4LTdmYzEtNGYwZC1hYTIzLWUwODE4NWRhZjhhNSIsIm5hbWUiOiJEaWdpQnl0ZSIsInN5bWJvbCI6ImRnYiIsImltYWdlX3NtX3VybCI6Imh0dHBzOi8vczMuYXAtc291dGgtMS5hbWF6b25hd3MuY29tL2NyeXB0by1leGNoYW5nZS9jb2lucy1zbS9kaWdpYnl0ZS5wbmcifSx7ImFzc2V0X2lkIjoiNzdhODgwYTAtMzQ0My00ZWVmLTg1MDAtYmRjOGRjZGQzMzcwIiwibmFtZSI6IkRhaSIsInN5bWJvbCI6ImRhaSIsImltYWdlX3NtX3VybCI6Imh0dHBzOi8vczMuYXAtc291dGgtMS5hbWF6b25hd3MuY29tL2NyeXB0by1leGNoYW5nZS9jb2lucy1zbS9kYWkucG5nIn0seyJhc3NldF9pZCI6IjkwMmQ0YmRlLWY4NzctNDg2ZS04MTNlLTEzNTkyMGNjN2YzMyIsIm5hbWUiOiIweCIsInN5bWJvbCI6InpyeCIsImltYWdlX3NtX3VybCI6Imh0dHBzOi8vczMuYXAtc291dGgtMS5hbWF6b25hd3MuY29tL2NyeXB0by1leGNoYW5nZS9jb2lucy8weC5wbmcifSx7ImFzc2V0X2lkIjoiMDk5OWM5NTktZjY5MS00NTUzLWI0NjEtYjg4ZWE1MDMyZTBjIiwibmFtZSI6Ik1vbmFjbyIsInN5bWJvbCI6Im1jbyIsImltYWdlX3NtX3VybCI6Imh0dHBzOi8vczMuYXAtc291dGgtMS5hbWF6b25hd3MuY29tL2NyeXB0by1leGNoYW5nZS9jb2lucy1zbS9tb25hY28ucG5nIn0seyJhc3NldF9pZCI6ImZlY2ZlYjI2LWU2MTItNGRmNC1hZWQ3LWJkNGFkMDE5NDkzNiIsIm5hbWUiOiJDaXZpYyIsInN5bWJvbCI6ImN2YyIsImltYWdlX3NtX3VybCI6Imh0dHBzOi8vczMuYXAtc291dGgtMS5hbWF6b25hd3MuY29tL2NyeXB0by1leGNoYW5nZS9jb2lucy1zbS9jaXZpYy5wbmcifSx7ImFzc2V0X2lkIjoiMjBkNTdkN2QtM2NjMS00MjhhLWFlOTAtMDlmYjljNTE2OGY1IiwibmFtZSI6IkRlY3JlZCIsInN5bWJvbCI6ImRjciIsImltYWdlX3NtX3VybCI6Imh0dHBzOi8vczMuYXAtc291dGgtMS5hbWF6b25hd3MuY29tL2NyeXB0by1leGNoYW5nZS9jb2lucy1zbS9kZWNyZWQucG5nIn0seyJhc3NldF9pZCI6IjlkNzk2NTY5LTBmYWYtNGU0YS1iNTgxLTY3NmZhYjM0MzNkOSIsIm5hbWUiOiJEaWdpeERBTyIsInN5bWJvbCI6ImRnZCIsImltYWdlX3NtX3VybCI6Imh0dHBzOi8vczMuYXAtc291dGgtMS5hbWF6b25hd3MuY29tL2NyeXB0by1leGNoYW5nZS9jb2lucy1zbS9kaWdpeGRhby5wbmcifSx7ImFzc2V0X2lkIjoiZDEzM2RkMTMtYTc5MS00YzJiLTljMTQtYjRjODUzMmY2YjkxIiwibmFtZSI6ImRpc3RyaWN0MHgiLCJzeW1ib2wiOiJkbnQiLCJpbWFnZV9zbV91cmwiOiJodHRwczovL3MzLmFwLXNvdXRoLTEuYW1hem9uYXdzLmNvbS9jcnlwdG8tZXhjaGFuZ2UvY29pbnMtc20vZGlzdHJpY3QweC5wbmcifSx7ImFzc2V0X2lkIjoiOWRiZGM3MjctZGU2OC00ZjJhLTg5NTYtMDRhMzhlZDcxY2E1IiwibmFtZSI6IlRyb24iLCJzeW1ib2wiOiJ0cngiLCJpbWFnZV9zbV91cmwiOiJodHRwczovL2ZpbGVzLmNvaW5zd2l0Y2guY28vcHVibGljL2NvaW5zL3RyeC5wbmcifSx7ImFzc2V0X2lkIjoiOWRiZGM3MjctZGU2OC00ZjJhLTg5NTYtMDRhMzhlZDcxY2E2IiwibmFtZSI6IkVPUyIsInN5bWJvbCI6ImVvcyIsImltYWdlX3NtX3VybCI6Imh0dHBzOi8vZmlsZXMuY29pbnN3aXRjaC5jby9wdWJsaWMvY29pbnMvZW9zLnBuZyJ9LHsiYXNzZXRfaWQiOiIxZDZlMWE5OS0xZTc3LTQxZTEtOWViYi0wZTIxNmZhYTE2NmEiLCJuYW1lIjoiQml0Y29pbiIsInN5bWJvbCI6ImJ0YyIsImltYWdlX3NtX3VybCI6Imh0dHBzOi8vZmlsZXMuY29pbnN3aXRjaC5jby9wdWJsaWMvY29pbnMvYnRjLnBuZyJ9LHsiYXNzZXRfaWQiOiJiMzNhZGM3YS1iZWI5LTQyMWYtOTVkNi1kNDk1ZGM1NDlmNzkiLCJuYW1lIjoiTGlzayIsInN5bWJvbCI6ImxzayIsImltYWdlX3NtX3VybCI6Imh0dHBzOi8vczMuYXAtc291dGgtMS5hbWF6b25hd3MuY29tL2NyeXB0by1leGNoYW5nZS9jb2lucy1zbS9saXNrX3YyLnBuZyJ9LHsiYXNzZXRfaWQiOiIzZTkyZjFiNi02OTNjLTQ2NTQtOWI5Yi05Mzg1ODJkNjRlNGYiLCJuYW1lIjoiV2F2ZXMiLCJzeW1ib2wiOiJ3YXZlcyIsImltYWdlX3NtX3VybCI6Imh0dHBzOi8vczMuYXAtc291dGgtMS5hbWF6b25hd3MuY29tL2NyeXB0by1leGNoYW5nZS9jb2lucy1zbS93YXZlcy5wbmcifSx7ImFzc2V0X2lkIjoiMjc5NGU0YzYtNmJlYy00NWRhLWI0YTYtNzQ5OTZjZGFkNzlhIiwibmFtZSI6IkdvbGVtIiwic3ltYm9sIjoiZ250IiwiaW1hZ2Vfc21fdXJsIjoiaHR0cHM6Ly9zMy5hcC1zb3V0aC0xLmFtYXpvbmF3cy5jb20vY3J5cHRvLWV4Y2hhbmdlL2NvaW5zLXNtL2dvbGVtLnBuZyJ9LHsiYXNzZXRfaWQiOiI4NmEzZjNmYS1kNjE2LTRmNDAtYjQ2Yy0wOWM0OWMwMTg3ZTEiLCJuYW1lIjoiT21pc2VHTyIsInN5bWJvbCI6Im9tZyIsImltYWdlX3NtX3VybCI6Imh0dHBzOi8vczMuYXAtc291dGgtMS5hbWF6b25hd3MuY29tL2NyeXB0by1leGNoYW5nZS9jb2lucy1zbS9vbWlzZWdvLnBuZyJ9LHsiYXNzZXRfaWQiOiI4OTYwYzNlNy1jOTUzLTRkYjEtODQ5Ny0zNGI4MmQ5Y2UzMjIiLCJuYW1lIjoiQXVndXIiLCJzeW1ib2wiOiJyZXAiLCJpbWFnZV9zbV91cmwiOiJodHRwczovL3MzLmFwLXNvdXRoLTEuYW1hem9uYXdzLmNvbS9jcnlwdG8tZXhjaGFuZ2UvY29pbnMtc20vYXVndXIucG5nIn1dfSwiaXNzdWVyIjp7InB1YmxpY0tleSI6IjAyNjBjYWM2OWYzY2NlZmZhOTA2OGY0Y2EyOTMzMjljYTY0OGUzMTgxY2VlN2YyOTViMDM0ZTFjZjU3YmRjYjFmOCJ9LCJzdWJqZWN0Ijp7InB1YmxpY0tleSI6IjAyNjBjYWM2OWYzY2NlZmZhOTA2OGY0Y2EyOTMzMjljYTY0OGUzMTgxY2VlN2YyOTViMDM0ZTFjZjU3YmRjYjFmOCJ9fQ.LhpMEDHdAjiiXTGP8VBVTfDn5JEYor4cLWAWGC1y3kEdyWkfnQ3jx0nC_b9vDiz-IBQfAUekK9QueW3jzyE0wQ",
        "decodedToken": {
          "header": {
            "typ": "JWT",
            "alg": "ES256K"
          },
          "payload": {
            "claim": {
              "assetMapping": {
                "EOS": "9dbdc727-de68-4f2a-8956-04a38ed71ca6",
                "ETH": "508b8f73-4b06-453e-8151-78cb8cfc3bc9",
                "TRX": "9dbdc727-de68-4f2a-8956-04a38ed71ca5",
                "BTC": "1d6e1a99-1e77-41e1-9ebb-0e216faa166a"
              },
              "nameserviceConfiguration": {
                "domain": "scatter_dev",
                "subdomainRegistrar": "https://registrar.coinswitch.co:4000"
              },
              "assetList": [
                {
                  "asset_id": "8dd939ef-b9d2-46f0-8796-4bd8dbaeef1b",
                  "name": "Litecoin",
                  "symbol": "ltc",
                  "image_sm_url": "https://s3.ap-south-1.amazonaws.com/crypto-exchange/coins-sm/litecoin.png"
                }
              ]
            },
            "issuer": {
              "publicKey": "0260cac69f3cceffa9068f4ca293329ca648e3181cee7f295b034e1cf57bdcb1f8"
            },
            "subject": {
              "publicKey": "0260cac69f3cceffa9068f4ca293329ca648e3181cee7f295b034e1cf57bdcb1f8"
            }
          },
          "signature": "LhpMEDHdAjiiXTGP8VBVTfDn5JEYor4cLWAWGC1y3kEdyWkfnQ3jx0nC_b9vDiz-IBQfAUekK9QueW3jzyE0wQ"
        }
      }
      ]
  },
  {
    request: {
      method: 'GET',
      url: 'https://hub.cruxpay.com/hub_info',
      json: true
    },
    response: {
      challenge_text: "['gaiahub','0','hub.cruxpay.com','blockstack_storage_please_sign']",
      latest_auth_version: "v1",
      read_url_prefix: "https://gaia.cruxpay.com/"
    }
  },

]
  
export default requestResponseArray