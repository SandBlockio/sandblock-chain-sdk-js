"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = require("axios");
const utils = require("../utils");
const prefixes = {
    "testnet": "tsand",
    "mainnet": "sand"
};
class SandblockChainClient {
    constructor(testnet = false) {
        this.setPrivateKey = (pk) => {
            try {
                this._keypair = utils.getKeypairFromPrivateKey(pk);
                this._address = utils.getAccAddress(this._keypair.publicKey);
                return true;
            }
            catch (error) {
                console.error(error);
                return false;
            }
        };
        this.createAccount = () => {
            const pk = utils.generatePrivateKey();
            const keypair = utils.getKeypairFromPrivateKey(pk);
            return {
                privateKey: keypair.privateKey.toString('hex'),
                publicKey: keypair.publicKey.toString('hex'),
                address: utils.getAddressFromPrivateKey(keypair.privateKey, this._prefix).toString()
            };
        };
        this.getAccount = async (address = this._address) => {
            if (!address) {
                throw new Error('Address is required');
            }
            try {
                const data = await this._apiClient.get(`accounts/${address}`);
                return data.data;
            }
            catch (error) {
                return null;
            }
        };
        this.getAccountLive = async (address = this._address) => {
            if (!address) {
                throw new Error('Address is required');
            }
            try {
                const data = await this._cosmosClient.get(`auth/accounts/${address}`);
                return data.data.result;
            }
            catch (error) {
                return null;
            }
        };
        this.getBlockAtHeight = async (height) => {
            try {
                const data = await this._apiClient.get(`blocks/${height}`);
                return data.data;
            }
            catch (error) {
                return null;
            }
        };
        this.getLastFiftyBlocks = async () => {
            try {
                const data = await this._apiClient.get(`blocks`);
                return data.data;
            }
            catch (error) {
                return null;
            }
        };
        this.getLatestBlock = async () => {
            try {
                const data = await this._apiClient.get(`blocks/latest`);
                return data.data;
            }
            catch (error) {
                return null;
            }
        };
        this.getLastFiftyTransactions = async () => {
            try {
                const data = await this._apiClient.get(`transactions`);
                return data.data;
            }
            catch (error) {
                return null;
            }
        };
        this.getTransaction = async (hash) => {
            try {
                const data = await this._apiClient.get(`transactions/${hash}`);
                return data.data;
            }
            catch (error) {
                return null;
            }
        };
        this.search = async (query) => {
            try {
                const data = await this._apiClient.post(`search`, JSON.stringify({ data: query }), this.axiosConfig);
                return data.data;
            }
            catch (error) {
                return null;
            }
        };
        this.broadcastRawTransaction = async (signed) => {
            return await this._cosmosClient.post(`txs`, signed);
        };
        this.transfer = async (fromAddress, toAddress, asset, amount, memo = "JS Library") => {
            try {
                const account = await this.getAccountLive(fromAddress);
                const msgSend = utils.buildSend([
                    {
                        "amount": amount.toString(),
                        "denom": asset
                    }
                ], fromAddress, toAddress);
                const stdTx = utils.buildStdTx([msgSend], {
                    "gas": "200000",
                    "amount": [
                        {
                            "amount": "1",
                            "denom": "sbc" //TODO: dynamize
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
                return await this.broadcastRawTransaction(broadcastBody);
            }
            catch (error) {
                console.error(error);
                return null;
            }
        };
        this._prefix = (testnet) ? prefixes.testnet : prefixes.mainnet;
        this._chainId = "sandblockchain";
        this._apiClient = axios_1.default.create({
            baseURL: 'https://api.explorer.sandblock.io/api/v1/',
            timeout: 1000
        });
        this._cosmosClient = axios_1.default.create({
            baseURL: 'https://shore.sandblock.io/cosmos/',
            timeout: 1000,
        });
        this.axiosConfig = {
            headers: {
                'Content-Type': 'application/json;charset=UTF-8',
                "Access-Control-Allow-Origin": "*",
            }
        };
    }
}
exports.default = SandblockChainClient;
//# sourceMappingURL=index.js.map