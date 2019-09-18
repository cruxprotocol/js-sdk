import { OpenPayWallet, IAddressMapping, BlockstackService, OpenPayWalletExperimental } from "../index";


window.blockstackservice = new BlockstackService();

window.wallet = new OpenPayWallet({getEncryptionKey: () => { return encryptionKey }});

const putClientCurrencyMapping = async () => {
    console.log("putClientCurrencyMapping called...")
    let identityClaim = {"secrets":{"mnemonic":"burger option suggest dilemma crazy fish squeeze filter example bottom normal security","identityKeyPair":{"address":"158XgSx6WcWwfjaGUovB4oHahYAAVg7DdE","privKey":"e7195c958a7d1025b30085e3c465df0ba54f29e29719cbfb93a2e2594e226af301","pubKey":"0378a4013ff52963500f6a3a31b522d48c36b0bebb56981a870fe52fe85564d55a"}}}
    let content = { "EOS": "9dbdc727-de68-4f2a-8956-04a38ed71ca6","ETH": "508b8f73-4b06-453e-8151-78cb8cfc3bc9","TRX": "9dbdc727-de68-4f2a-8956-04a38ed71ca5","BTC": "1d6e1a99-1e77-41e1-9ebb-0e216faa166a"}
    let response = await window.blockstackservice.uploadContentToGaiaHub('client-mapping.json', identityClaim.secrets.identityKeyPair.privKey, content);
    console.log(`content upload response is:- ${response}`)
}


const getContentFromGaiaHub = async () => {
    console.log("getContentFromGaiaHub called...")
    let name = 'ankit2.devcoinswitch.id'
    let filename = 'client-mapping.json'
    let response = await window.blockstackservice.getContentFromGaiaHub(name, filename);
    console.log(`content upload response is:- ${response}`)
}


const uploadGlobalAssetList = async () => {
    console.log("putClientCurrencyMapping called...")
    let identityClaim = {"secrets":{"mnemonic":"burger option suggest dilemma crazy fish squeeze filter example bottom normal security","identityKeyPair":{"address":"158XgSx6WcWwfjaGUovB4oHahYAAVg7DdE","privKey":"e7195c958a7d1025b30085e3c465df0ba54f29e29719cbfb93a2e2594e226af301","pubKey":"0378a4013ff52963500f6a3a31b522d48c36b0bebb56981a870fe52fe85564d55a"}}}
    let content = [
        {
          "asset_id": "8dd939ef-b9d2-46f0-8796-4bd8dbaeef1b",
          "name": "Litecoin",
          "symbol": "ltc",
          "image_sm_url": "https://s3.ap-south-1.amazonaws.com/crypto-exchange/coins-sm/litecoin.png"
        },
        {
          "asset_id": "508b8f73-4b06-453e-8151-78cb8cfc3bc9",
          "name": "Ethereum",
          "symbol": "eth",
          "image_sm_url": "https://files.coinswitch.co/public/coins/eth.png"
        },
        {
          "asset_id": "9a267cc3-0e72-4db5-930c-c60a74d64c55",
          "name": "Basic Attention Token",
          "symbol": "bat",
          "image_sm_url": "https://s3.ap-south-1.amazonaws.com/crypto-exchange/coins-sm/bat.png"
        },
        {
          "asset_id": "490f7648-7fc1-4f0d-aa23-e08185daf8a5",
          "name": "DigiByte",
          "symbol": "dgb",
          "image_sm_url": "https://s3.ap-south-1.amazonaws.com/crypto-exchange/coins-sm/digibyte.png"
        },
        {
          "asset_id": "77a880a0-3443-4eef-8500-bdc8dcdd3370",
          "name": "Dai",
          "symbol": "dai",
          "image_sm_url": "https://s3.ap-south-1.amazonaws.com/crypto-exchange/coins-sm/dai.png"
        },
        {
          "asset_id": "902d4bde-f877-486e-813e-135920cc7f33",
          "name": "0x",
          "symbol": "zrx",
          "image_sm_url": "https://s3.ap-south-1.amazonaws.com/crypto-exchange/coins/0x.png"
        },
        {
          "asset_id": "0999c959-f691-4553-b461-b88ea5032e0c",
          "name": "Monaco",
          "symbol": "mco",
          "image_sm_url": "https://s3.ap-south-1.amazonaws.com/crypto-exchange/coins-sm/monaco.png"
        },
        {
          "asset_id": "fecfeb26-e612-4df4-aed7-bd4ad0194936",
          "name": "Civic",
          "symbol": "cvc",
          "image_sm_url": "https://s3.ap-south-1.amazonaws.com/crypto-exchange/coins-sm/civic.png"
        },
        {
          "asset_id": "20d57d7d-3cc1-428a-ae90-09fb9c5168f5",
          "name": "Decred",
          "symbol": "dcr",
          "image_sm_url": "https://s3.ap-south-1.amazonaws.com/crypto-exchange/coins-sm/decred.png"
        },
        {
          "asset_id": "9d796569-0faf-4e4a-b581-676fab3433d9",
          "name": "DigixDAO",
          "symbol": "dgd",
          "image_sm_url": "https://s3.ap-south-1.amazonaws.com/crypto-exchange/coins-sm/digixdao.png"
        },
        {
          "asset_id": "d133dd13-a791-4c2b-9c14-b4c8532f6b91",
          "name": "district0x",
          "symbol": "dnt",
          "image_sm_url": "https://s3.ap-south-1.amazonaws.com/crypto-exchange/coins-sm/district0x.png"
        },
        {
          "asset_id": "9dbdc727-de68-4f2a-8956-04a38ed71ca5",
          "name": "Tron",
          "symbol": "trx",
          "image_sm_url": "https://files.coinswitch.co/public/coins/trx.png"
        },
        {
          "asset_id": "9dbdc727-de68-4f2a-8956-04a38ed71ca6",
          "name": "EOS",
          "symbol": "eos",
          "image_sm_url": "https://files.coinswitch.co/public/coins/eos.png"
        },
        {
          "asset_id": "1d6e1a99-1e77-41e1-9ebb-0e216faa166a",
          "name": "Bitcoin",
          "symbol": "btc",
          "image_sm_url": "https://files.coinswitch.co/public/coins/btc.png"
        },
        {
          "asset_id": "b33adc7a-beb9-421f-95d6-d495dc549f79",
          "name": "Lisk",
          "symbol": "lsk",
          "image_sm_url": "https://s3.ap-south-1.amazonaws.com/crypto-exchange/coins-sm/lisk_v2.png"
        },
        {
          "asset_id": "3e92f1b6-693c-4654-9b9b-938582d64e4f",
          "name": "Waves",
          "symbol": "waves",
          "image_sm_url": "https://s3.ap-south-1.amazonaws.com/crypto-exchange/coins-sm/waves.png"
        },
        {
          "asset_id": "2794e4c6-6bec-45da-b4a6-74996cdad79a",
          "name": "Golem",
          "symbol": "gnt",
          "image_sm_url": "https://s3.ap-south-1.amazonaws.com/crypto-exchange/coins-sm/golem.png"
        },
        {
          "asset_id": "86a3f3fa-d616-4f40-b46c-09c49c0187e1",
          "name": "OmiseGO",
          "symbol": "omg",
          "image_sm_url": "https://s3.ap-south-1.amazonaws.com/crypto-exchange/coins-sm/omisego.png"
        },
        {
          "asset_id": "8960c3e7-c953-4db1-8497-34b82d9ce322",
          "name": "Augur",
          "symbol": "rep",
          "image_sm_url": "https://s3.ap-south-1.amazonaws.com/crypto-exchange/coins-sm/augur.png"
        }
      ]
    let response = await window.blockstackservice.uploadContentToGaiaHub('asset-list.json', identityClaim.secrets.identityKeyPair.privKey, content);
    console.log(`content upload response is:- ${response}`)
}

const getAssetListEssentials = async () => {
    let assetList = await window.blockstackservice.getGlobalAssetList()
    let clientMapping = await window.blockstackservice.getClientAssetMapping('ankit2.devcoinswitch.id', '0378a4013ff52963500f6a3a31b522d48c36b0bebb56981a870fe52fe85564d55a')
    console.log(`global asset list is:- `, assetList);
    console.log(`client mapping is:- `, clientMapping);

}


const addPayIDClaim = async () => {
    await window.wallet.addPayIDClaim("hassan_ashraf.devcoinswitch.id", "12345", null)
}

window.addPayIDClaim = addPayIDClaim


window.putClientCurrencyMapping = putClientCurrencyMapping
window.getContentFromGaiaHub = getContentFromGaiaHub
window.uploadGlobalAssetList = uploadGlobalAssetList
window.getAssetListEssentials = getAssetListEssentials