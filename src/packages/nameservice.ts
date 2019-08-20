import * as blockstack from "blockstack";
import { bip32 } from "bitcoinjs-lib";

// NameService abstraction

export abstract class NameService {
    // generate a newKeyPair
    // generate publicKey from privKey
    // registering namespace
    // resolving a namespace -> publicKey/address
    // abstract resolve = async (id: string): Promise<any> => {}
    // check for the status of the namespace registration
}



// Blockstack Nameservice implementation

export class BlockstackService extends NameService {
    public blockstack = blockstack
    public bip32 = bip32

    // public resolve = async (id: string): Promise<string> => {
    //     let profile = await lookupProfile(id)
    //     console.log(profile)
    //     console.log(profile.address)
    //     return profile.address
    // }

    // lookup = () => {
    //     console.log(lookupProfile('coinswitch.id'))
    // }
    // zone = (zonefile, address) => {
    //     console.log(resolveZoneFileToPerson(zonefile, address, console.log))
    // }
}