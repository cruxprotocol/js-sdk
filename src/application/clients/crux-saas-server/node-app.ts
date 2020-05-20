import express from "express";
import { IKeyManager } from "../../../core/interfaces/key-manager";
import { patchMissingDependencies } from "../../../packages/utils";
import { CruxWalletClient, ICruxWalletClientOptions } from "../crux-wallet-client";
import { InmemoryKeyStore } from "./infrastructure/implementation/inmemory-keystore";
import { IKeyStore } from "./interfaces/key-store";

patchMissingDependencies();

// KeyStore seeder
const seedKeyStore = (keyStore: IKeyStore): void => {
    keyStore.addToKeyStore("testapikey1", "cdf2d276caf0c9c34258ed6ebd0e60e0e8b3d9a7b8a9a717f2e19ed9b37f7c6f");
};

// Inmemory Keystore Init
const inmemoryKeyStore: IKeyStore = new InmemoryKeyStore();
seedKeyStore(inmemoryKeyStore);

const executeFunction = async (fnName: string, params: string[], keyManager: IKeyManager) => {
    const walletOptions: ICruxWalletClientOptions = {
        privateKey: keyManager,
        walletClientName: "cruxdev",
    };
    const cruxWalletClient = new CruxWalletClient(walletOptions);
    const whitelistedFunctions = ["getCruxIDState", "isCruxIDAvailable"];
    let response: any = {};
    if (whitelistedFunctions.includes(fnName)) {
        // @ts-ignore
        const fn = cruxWalletClient[fnName];
        if (typeof fn === "function") { response = await fn.apply(null, params); }
    }
    return response;
};

const handleAuth = (apiKey?: string) => {
    if (!apiKey) {
        throw new Error("Missing API Key.");
    } else {
        return inmemoryKeyStore.getKeyManager(apiKey);
    }
};

const app = express();
app.use(express.json());
const port = 3000;
app.post("/v1/execute", async (req, res) => {
    const apiKey = req.get("api_key");
    const fnName: string = req.body.function_name;
    const params: string[] = req.body.params;

    try {
        const keyManager: IKeyManager = await handleAuth(apiKey);
        // Function call
        const response = await executeFunction(fnName, params, keyManager);
        res.json({success: true, data: response});
    } catch (error) {
        return res.status(400).send({
            error: error.message,
            success: false,
        });
    }
});
app.listen(port, (err) => {
  if (err) {
    return console.error(err);
  }
  return console.log(`server is listening on ${port}`);
});
