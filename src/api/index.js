import * as crypto from '../crypto';
import axios from 'axios';
import Transaction, {txType} from "./models/Transaction";

const prefixes = {
    "testnet": "tsand",
    "mainnet": "sand"
};


export class SandblockChainClient {
    constructor(testnet = false){
        this._prefix = (testnet) ? prefixes.testnet : prefixes.mainnet;
        this._chainId = "sandblockchain";
        this._apiClient = axios.create({
            baseURL: 'https://api.explorer.sandblock.io/api/v1/',
            timeout: 1000
        });
        this._cosmosClient = axios.create({
            baseURL: 'https://shore.sandblock.io/cosmos/',
            timeout: 1000,
        })
        this.axiosConfig = {
            headers: {
                'Content-Type': 'application/json;charset=UTF-8',
                "Access-Control-Allow-Origin": "*",
            }
        };
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
            const data = await this._apiClient.get(`accounts/${address}`);
            return data.data;
        } catch(error){
            return null;
        }
    }

    async getAccountLive(address = this._address){
        if(!address){
            throw new Error('Address is required');
        }

        try {
            const data = await this._cosmosClient.get(`auth/accounts/${address}`);
            return data.data;
        } catch(error){
            return null;
        }
    }

    async getBlockAtHeight(height){
        try {
            const data = await this._apiClient.get(`blocks/${height}`);
            return data.data;
        } catch(error) {
            return null;
        }
    }

    async getLastFiftyBlocks(){
        try {
            const data = await this._apiClient.get(`blocks`);
            return data.data;
        } catch(error){
            return null;
        }
    }

    async getLatestBlock(){
        try {
            const data = await this._apiClient.get(`blocks/latest`);
            return data.data;
        } catch(error){
            return null;
        }
    }

    async getLastFiftyTransactions(){
        try {
            const data = await this._apiClient.get(`transactions`);
            return data.data;
        } catch(error){
            return null;
        }
    }

    async getTransaction(hash){
        try {
            const data = await this._apiClient.get(`transactions/${hash}`);
            return data.data;
        } catch(error){
            return null;
        }
    }

    async search(query){
        try {
            const data = await this._apiClient.post(`search`, JSON.stringify({data: query}), this.axiosConfig);
            return data.data;
        } catch(error) {
            return null;
        }
    }

    async signTransaction(msg, address, sequence = null, memo = ""){
        // Start by getting the associated account
        const data = await this.getAccountLive(address);
        sequence = data.value.sequence;
        const account_number = data.value.account_number;

        const options = {
            account_number: parseInt(account_number),
            chain_id: this._chainId,
            memo,
            msg,
            sequence: parseInt(sequence),
            type: msg.type
        };

        const tx = new Transaction(options);
        return tx.sign(this._privateKey, msg);
    }

    async broadcastRawTransaction(signed){
        const opts = {
            data: signed,
            headers: {
                "content-type": "text/plain"
            }
        };

        return this._cosmosClient.post(`txs`, null, opts);
    }

    async broadcastTransaction(signedTx){
        const signed = signedTx.serialize();
        return this.broadcastRawTransaction(signed);
    }

    async transfer(fromAddress, toAddress, asset, amount, memo = "", sequence = null){
        try {
            const msg = {
                type: "cosmos-sdk/MsgSend",
                value: {
                    from_address: fromAddress,
                    to_address: toAddress,
                    amount: [{
                        denom: asset,
                        amount: amount.toString()
                    }]
                }
            }
            const signedTx = await this.signTransaction(msg, fromAddress, sequence, memo);
            return await this.broadcastTransaction(signedTx);
        } catch(error){
            console.error(error.response.data);
            return null;
        }
    }
}
