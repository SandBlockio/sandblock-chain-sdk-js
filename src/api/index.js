import * as crypto from '../crypto';
import axios from 'axios';

const prefixes = {
    "testnet": "tsand",
    "mainnet": "sand"
};


export class SandblockChainClient {
    constructor(testnet = false){
        this._prefix = (testnet) ? prefixes.testnet : prefixes.mainnet;
        this._chainId = "sandblockchain";
        this._httpClient = axios.create({
            baseURL: 'https://api.explorer.sandblock.io/api/v1/',
            timeout: 1000
        });
    }

    setPrivateKey(pk){
        try {
            this._privateKey = pk;
            this._address = crypto.getAddressFromPrivateKey(pk);

            return true;
        } catch(error){
            return false;
        }
    }

    createAccount(){
        const pk = crypto.generatePrivateKey();
        return {
            privateKey: pk,
            publicKey: crypto.getPublicKeyFromPrivateKey(pk),
            address: crypto.getAddressFromPrivateKey(pk, this._prefix)
        };
    }

    async getAccount(address = this._address){
        if(!address){
            throw new Error('Address is required');
        }

        try {
            const data = await this._httpClient.get(`accounts/${address}`);
            return data.data;
        } catch(error){
            return null;
        }
    }
}
