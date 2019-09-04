import axios, {AxiosInstance} from 'axios';
import * as utils from '../utils';
import {StdTx} from '../utils';

import SandblockApp from "../utils/ledger";
import {signatureImport} from 'secp256k1';

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

    getAccount: Function = async (address: Buffer = this._address) => {
        if(!address){
            throw new Error('Address is required');
        }

        try {
            const data = await this._apiClient.get(`accounts/${address.toString()}`);
            return data.data;
        } catch(error){
            return null;
        }
    }

    getAccountLive: Function = async (address: Buffer = this._address) => {
        if(!address){
            throw new Error('Address is required');
        }

        try {
            const data = await this._cosmosClient.get(`auth/accounts/${address.toString()}`);
            return data.data;
        } catch(error){
            return null;
        }
    }

    getAccountDelegations: Function = async (address: Buffer = this._address) => {
        try {
            const data = await this._cosmosClient.get(`staking/delegators/${address.toString()}/delegations`);
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

    dispatchTX: Function = async (signedTx) => {
        const broadcastBody = utils.createBroadcastBody(signedTx, "sync");
        return (await this.broadcastRawTransaction(broadcastBody));
    }

    dispatch: Function = async (stdTx: StdTx) => {
        try {
            const account = (await this.getAccountLive(this._address.toString())).result;

            const txSignature = utils.sign(stdTx.value, this._keypair, {
                sequence: account.value.sequence,
                account_number: account.value.account_number,
                chain_id: this._chainId
            });

            const signedTx = utils.createSignedTx(stdTx.value, txSignature);
            return (await this.dispatchTX(signedTx));
        }catch(error){
            return null;
        }
    }

    initLedgerMetas: Function = async(transport: any, path = [44, 118, 0, 0, 0]) => {
        try {
            /* Init Sandblock Ledger App with transport */
            const app = new SandblockApp(transport);

            /* Ensure app is open */
            if(!(await app.isAppOpen())){
                throw new Error(`Please open Sandblock App `);
            }

            /* Get public key */
            const address = await app.publicKey(path);

            /* Generate payload */
            this.setAddress(utils.getAddressFromPublicKey(address.compressed_pk));
            this.setPublicKey(address.compressed_pk);

            return {address: this._address, keypair: this._keypair};

        } catch(error){
            return null;
        }
    }

    dispatchWithLedger: Function = async(stdTx: StdTx, transport: any, path = [44, 118, 0, 0, 0]) => {
        try {
            /* Init Sandblock Ledger App with transport */
            const app = new SandblockApp(transport);

            /* Ensure app is open */
            if(!(await app.isAppOpen())){
                throw new Error(`Please open Sandblock App `);
            }

            if(!this._address || !this._keypair){
                throw new Error(`Please init ledger metas using initLedgerMetas method`);
            }

            const fromAddress = this._address.toString();
            const account = (await this.getAccountLive(fromAddress)).result;
            if(!account){
                throw new Error(`Can't fetch the account`);
            }

            /* Prepare the payload */
            const messageToSign = utils.createSignMessage(stdTx.value, {
                sequence: account.value.sequence,
                account_number: account.value.account_number,
                chain_id: this._chainId
            });

            /* Sign the message using ledger */
            const response: any = await app.sign(path, messageToSign);
            if(response.return_code !== 0x9000){
                throw new Error(`Can't sign payload`);
            }

            /* Add the signature on payload */
            const signature = utils.createSignature(signatureImport(response.signature), this._keypair.publicKey);
            const signedTx = utils.createSignedTx(stdTx.value, signature);
            return (await this.dispatchTX(signedTx));
        } catch(error){
            return null;
        }
    }

    delegate: Function = async (validatorAddress: string, asset: string, amount: number, memo: string = "JS Library"): Promise<StdTx> => {
        return utils.buildStdTx([utils.buildDelegate(this._address.toString(), validatorAddress, {
            denom: asset,
            amount: amount.toString()
        })], {
            gas: "200000",
            amount: [{
                amount: "1",
                denom: "sbc"
            }]
        }, memo);
    }

    redelegate: Function = async (validatorSrcAddress: string, validatorDstAddress: string, asset: string, amount: number, memo:string = "JS Library"): Promise<StdTx> => {
        return utils.buildStdTx([utils.buildRedelegate(this._address.toString(), validatorSrcAddress, validatorDstAddress, {
            denom: asset,
            amount: amount.toString()
        })], {
            gas: "200000",
            amount: [{
                amount: "1",
                denom: "sbc"
            }]
        }, memo);
    }

    undelegate: Function = async (validatorAddress: string, asset: string, amount: number, memo: string = "JS Library"): Promise<StdTx> => {
        return utils.buildStdTx([utils.buildUndelegate(this._address.toString(), validatorAddress, {
            denom: asset,
            amount: amount.toString()
        })], {
            gas: "200000",
            amount: [{
                amount: "1",
                denom: "sbc"
            }]
        }, memo);
    }

    transfer: Function = async (toAddress: string, asset: string, amount: number, memo = "JS Library"): Promise<StdTx> => {
        return utils.buildStdTx([utils.buildSend([
            {
                "amount": amount.toString(),
                "denom": asset
            }
        ], this._address.toString(), toAddress)], {
            "gas": "200000",
            "amount": [
                {
                    "amount": "1",//TODO: dynamize
                    "denom": "sbc"//TODO: dynamize
                }
            ]
        }, memo);
    }

    setWithdrawAddress: Function = async (withdrawAddress: string, memo: string = "JS Library"): Promise<StdTx> => {
        return utils.buildStdTx([utils.buildSetWithdrawAddress(this._address.toString(), withdrawAddress)], {
            gas: "200000",
            amount: [{
                amount: "1",
                denom: "sbc"
            }]
        }, memo);
    }

    withdrawReward: Function = async (validatorAddress: string, memo: string = "JS Library"): Promise<StdTx> => {
        return utils.buildStdTx([utils.buildWithdrawDelegatorReward(this._address.toString(), validatorAddress)], {
            gas: "200000",
            amount: [{
                amount: "1",
                denom: "sbc"
            }]
        }, memo);
    }
}
