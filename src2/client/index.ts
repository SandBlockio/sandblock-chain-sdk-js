import axios, {AxiosInstance} from 'axios';
import * as utils from '../utils';

const prefixes = {
    "testnet": "tsand",
    "mainnet": "sand"
};


export default class SandblockChainClient {
    private _prefix: string;
    private _chainId: string;
    private _apiClient: AxiosInstance;
    private _cosmosClient: AxiosInstance;
    private axiosConfig: { headers: { "Access-Control-Allow-Origin": string; "Content-Type": string } };
    private _keypair: utils.KeyPair;
    public _address: any;
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

    setPrivateKey(pk: Buffer): boolean{
        try {
            this._keypair = utils.getKeypairFromPrivateKey(pk);
            this._address = utils.getAccAddress(this._keypair.publicKey);
            return true;
        } catch(error){
            console.error(error);
            return false;
        }
    }

    createAccount(){
        /*const pk = crypto.generatePrivateKey();
        return {
            privateKey: pk,
            publicKey: crypto.getPublicKeyFromPrivateKey(pk),
            address: crypto.getAddressFromPrivateKey(pk, this._prefix)
        };*/
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

    async broadcastRawTransaction(signed){
        const opts = {
            data: signed,
            headers: {
                "content-type": "text/plain"
            }
        };
        return await this._cosmosClient.post(`txs`, null, opts);
    }

    async transfer(fromAddress, toAddress, asset, amount, memo = "", sequence = null){
        try {
            const account = await this.getAccountLive(fromAddress);
            const msgSend = utils.buildSend([
                {
                    "amount": "1",
                    "denom": "surprisecoin"
                }
            ], fromAddress, toAddress);

            const stdTx = utils.buildStdTx([msgSend], {
                "gas": "200000",
                "amount": [
                    {
                        "amount": "1",
                        "denom": "surprisecoin"
                    }
                ]
            }, memo);

            const txSignature = utils.sign(stdTx.value, this._keypair, {
                sequence: account.value.sequence,
                account_number: account.value.account_number,
                chain_id: this._chainId
            });

            const signedTx = utils.createSignedTx(stdTx.value, txSignature);
            const broadcastBody = utils.createBroadcastBody(signedTx, "block");
            console.log(broadcastBody);
            return await this.broadcastRawTransaction(broadcastBody);
        } catch(error){
            console.error(error.response.data);
            return null;
        }
    }
}
