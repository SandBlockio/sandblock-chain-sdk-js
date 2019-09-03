import axios, {AxiosInstance} from 'axios';
import * as utils from '../utils';

const prefixes = {
    "testnet": "tsand",
    "mainnet": "sand"
};


export default class SandblockChainClient {
    private _prefix: string;
    protected _chainId: string;
    private _apiClient: AxiosInstance;
    private _cosmosClient: AxiosInstance;
    private _tendermintClient: AxiosInstance;
    private readonly axiosConfig: { headers: { "Access-Control-Allow-Origin": string; "Content-Type": string } };
    protected _keypair: utils.KeyPair;
    protected _address: Buffer;
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
        });
        this._tendermintClient = axios.create({
            baseURL: 'https://shore.sandblock.io/tendermint/',
            timeout: 1000,
        });
        this.axiosConfig = {
            headers: {
                'Content-Type': 'application/json;charset=UTF-8',
                "Access-Control-Allow-Origin": "*",
            }
        };
    }

    setPrivateKey: Function = (pk: Buffer): boolean => {
        try {
            this._keypair = utils.getKeypairFromPrivateKey(pk);
            this._address = utils.getAccAddress(this._keypair.publicKey);
            return true;
        } catch(error){
            return false;
        }
    }

    setChainID: Function = (id: string): string => {
        this._chainId = id;
        return this._chainId;
    }

    setPublicKey: Function = (pk: Buffer): utils.KeyPair => {
        if(!this._keypair){
            this._keypair = {publicKey: Buffer.from(''), privateKey: Buffer.from('')};
        }
        this._keypair.publicKey = pk;
        return this._keypair;
    }

    setAddress: Function = (address: Buffer): Buffer => {
        this._address = address;
        return this._address;
    }

    createAccount: Function = (): {} => {
        const pk = utils.generatePrivateKey();
        const keypair = utils.getKeypairFromPrivateKey(pk);
        return {
            privateKey: keypair.privateKey.toString('hex'),
            publicKey: keypair.publicKey.toString('hex'),
            address: utils.getAddressFromPrivateKey(keypair.privateKey, this._prefix).toString()
        }
    }

    getAccount: Function = async (address = this._address) => {
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

    getAccountLive: Function = async (address = this._address) => {
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

    getBlocksBetween: Function = async (minheight:number, maxheight: number) => {
        try {
            const data = await this._tendermintClient.get(`blockchain?minHeight=${minheight}&maxHeight=${maxheight}`);
            return data.data;
        } catch(error) {
            return null;
        }
    }

    getBlockAtHeight: Function = async (height) => {
        try {
            const data = await this._apiClient.get(`blocks/${height}`);
            return data.data;
        } catch(error) {
            return null;
        }
    }

    getBlockAtHeightLive: Function = async (height) => {
        try {
            const data = await this._cosmosClient.get(`blocks/${height}`);
            return data.data;
        } catch(error) {
            return null;
        }
    }

    getLastFiftyBlocks: Function = async () =>{
        try {
            const data = await this._apiClient.get(`blocks`);
            return data.data;
        } catch(error){
            return null;
        }
    }

    getLatestBlock: Function = async () => {
        try {
            const data = await this._apiClient.get(`blocks/latest`);
            return data.data;
        } catch(error){
            return null;
        }
    }

    getLastFiftyTransactions: Function = async () => {
        try {
            const data = await this._apiClient.get(`transactions`);
            return data.data;
        } catch(error){
            return null;
        }
    }

    getTransaction: Function = async (hash:string) => {
        try {
            const data = await this._apiClient.get(`transactions/${hash}`);
            return data.data;
        } catch(error){
            return null;
        }
    }

    getTransactionLive: Function = async (hash: string) => {
        try {
            const data = await this._cosmosClient.get(`txs/${hash}`);
            return data.data;
        } catch(error){
            return null;
        }
    }

    getValidatorsSet: Function = async () => {
        try {
            const data = await this._cosmosClient.get(`validatorsets/latest`);
            return data.data;
        } catch(error){
            return null;
        }
    }

    getValidators: Function = async () => {
        try {
            const data = await this._cosmosClient.get(`staking/validators`);
            return data.data;
        } catch(error){
            return null;
        }
    }

    getValidator: Function = async (address:string) => {
        try {
            const data = await this._cosmosClient.get(`staking/validators/${address}`);
            return data.data;
        } catch(error){
            return null;
        }
    }

    getValidatorDelegations: Function = async (address:string) => {
        try {
            const data = await this._cosmosClient.get(`staking/validators/${address}/delegations`);
            return data.data;
        } catch(error){
            return null;
        }
    }

    getStatus: Function = async () => {
        try {
            const data = await this._tendermintClient.get(`status`);
            return data.data;
        } catch(error){
            return null;
        }
    }

    search: Function = async (query) => {
        try {
            const data = await this._apiClient.post(`search`, JSON.stringify({data: query}), this.axiosConfig);
            return data.data;
        } catch(error) {
            return null;
        }
    }

    broadcastRawTransaction: Function = async (signed) => {
        try {
            const data = await this._cosmosClient.post(`txs`, signed);
            return data.data;
        } catch(error){
            return null;
        }
    }

    transfer: Function = async (fromAddress: string, toAddress: string, asset: string, amount: string, memo = "JS Library") => {
        try {
            const account = (await this.getAccountLive(fromAddress)).result;
            const stdTx = utils.buildStdTx([utils.buildSend([
                {
                    "amount": amount.toString(),
                    "denom": asset
                }
            ], fromAddress, toAddress)], {
                "gas": "200000",
                "amount": [
                    {
                        "amount": "1",//TODO: dynamize
                        "denom": "sbc"//TODO: dynamize
                    }
                ]
            }, memo);

            const txSignature = utils.sign(stdTx.value, this._keypair, {
                sequence: account.value.sequence,
                account_number: account.value.account_number,
                chain_id: this._chainId
            });

            const signedTx = utils.createSignedTx(stdTx.value, txSignature);
            const broadcastBody = utils.createBroadcastBody(signedTx, "sync");
            return (await this.broadcastRawTransaction(broadcastBody));
        } catch(error){
            console.error(error);
            return null;
        }
    }
}
