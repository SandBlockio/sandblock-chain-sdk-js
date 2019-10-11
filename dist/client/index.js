"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = require("axios");
const utils = require("../utils");
const ledger_1 = require("../utils/ledger");
const secp256k1_1 = require("secp256k1");
const prefixes = {
    testnet: 'tsand',
    mainnet: 'sand'
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
                return false;
            }
        };
        this.setChainID = (id) => {
            this._chainId = id;
            return this._chainId;
        };
        this.setPublicKey = (pk) => {
            if (!this._keypair) {
                this._keypair = { publicKey: Buffer.from(''), privateKey: Buffer.from('') };
            }
            this._keypair.publicKey = pk;
            return this._keypair;
        };
        this.setAddress = (address) => {
            this._address = address;
            return this._address;
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
                const data = await this._apiClient.get(`accounts/${address.toString()}`);
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
                const data = await this._cosmosClient.get(`auth/accounts/${address.toString()}`);
                return data.data;
            }
            catch (error) {
                return null;
            }
        };
        this.getAccountDelegations = async (address = this._address) => {
            try {
                const data = await this._cosmosClient.get(`staking/delegators/${address.toString()}/delegations`);
                return data.data;
            }
            catch (error) {
                return null;
            }
        };
        this.getBlocksBetween = async (minheight, maxheight) => {
            try {
                const data = await this._tendermintClient.get(`blockchain?minHeight=${minheight}&maxHeight=${maxheight}`);
                return data.data;
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
        this.getBlockAtHeightLive = async (height) => {
            try {
                const data = await this._cosmosClient.get(`blocks/${height}`);
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
        this.getTransactionLive = async (hash) => {
            try {
                const data = await this._cosmosClient.get(`txs/${hash}`);
                return data.data;
            }
            catch (error) {
                return null;
            }
        };
        this.getValidatorsSet = async () => {
            try {
                const data = await this._cosmosClient.get(`validatorsets/latest`);
                return data.data;
            }
            catch (error) {
                return null;
            }
        };
        this.getValidators = async (status = 'bonded') => {
            try {
                const data = await this._cosmosClient.get(`staking/validators?limit=100000&status=${status}`);
                return data.data;
            }
            catch (error) {
                return null;
            }
        };
        this.getValidator = async (address) => {
            try {
                const data = await this._cosmosClient.get(`staking/validators/${address}`);
                return data.data;
            }
            catch (error) {
                return null;
            }
        };
        this.getValidatorDelegations = async (address) => {
            try {
                const data = await this._cosmosClient.get(`staking/validators/${address}/delegations`);
                return data.data;
            }
            catch (error) {
                return null;
            }
        };
        this.getStatus = async () => {
            try {
                const data = await this._tendermintClient.get(`status`);
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
            try {
                const data = await this._cosmosClient.post(`txs`, signed);
                return data.data;
            }
            catch (error) {
                return null;
            }
        };
        this.dispatchTX = async (signedTx) => {
            const broadcastBody = utils.createBroadcastBody(signedTx, 'sync');
            return await this.broadcastRawTransaction(broadcastBody);
        };
        this.dispatch = async (stdTx) => {
            try {
                const account = (await this.getAccountLive(this._address.toString())).result;
                const txSignature = utils.sign(stdTx.value, this._keypair, {
                    sequence: account.value.sequence,
                    account_number: account.value.account_number,
                    chain_id: this._chainId
                });
                const signedTx = utils.createSignedTx(stdTx.value, txSignature);
                return await this.dispatchTX(signedTx);
            }
            catch (error) {
                return null;
            }
        };
        this.initLedgerMetas = async (transport, path = [44, 118, 0, 0, 0]) => {
            try {
                /* Init Sandblock Ledger App with transport */
                const app = new ledger_1.default(transport);
                /* Ensure app is open */
                if (!(await app.isAppOpen())) {
                    throw new Error(`Please open Sandblock App `);
                }
                /* Get public key */
                const address = await app.publicKey(path);
                /* Generate payload */
                this.setAddress(utils.getAddressFromPublicKey(address.compressed_pk));
                this.setPublicKey(address.compressed_pk);
                return { address: this._address, keypair: this._keypair };
            }
            catch (error) {
                return null;
            }
        };
        this.dispatchWithLedger = async (stdTx, transport, path = [44, 118, 0, 0, 0]) => {
            try {
                /* Init Sandblock Ledger App with transport */
                const app = new ledger_1.default(transport);
                /* Ensure app is open */
                if (!(await app.isAppOpen())) {
                    throw new Error(`Please open Sandblock App `);
                }
                if (!this._address || !this._keypair) {
                    throw new Error(`Please init ledger metas using initLedgerMetas method`);
                }
                const fromAddress = this._address.toString();
                const account = (await this.getAccountLive(fromAddress)).result;
                if (!account) {
                    throw new Error(`Can't fetch the account`);
                }
                /* Prepare the payload */
                const messageToSign = utils.createSignMessage(stdTx.value, {
                    sequence: account.value.sequence,
                    account_number: account.value.account_number,
                    chain_id: this._chainId
                });
                /* Sign the message using ledger */
                const response = await app.sign(path, messageToSign);
                if (response.return_code !== 0x9000) {
                    throw new Error(`Can't sign payload`);
                }
                /* Add the signature on payload */
                const signature = utils.createSignature(secp256k1_1.signatureImport(response.signature), this._keypair.publicKey);
                const signedTx = utils.createSignedTx(stdTx.value, signature);
                return await this.dispatchTX(signedTx);
            }
            catch (error) {
                return null;
            }
        };
        this.delegate = async (validatorAddress, asset, amount, fee, memo = 'JS Library') => {
            return utils.buildStdTx([
                utils.buildDelegate(this._address.toString(), validatorAddress, {
                    denom: asset,
                    amount: amount.toString()
                })
            ], fee, memo);
        };
        this.redelegate = async (validatorSrcAddress, validatorDstAddress, asset, amount, fee, memo = 'JS Library') => {
            return utils.buildStdTx([
                utils.buildRedelegate(this._address.toString(), validatorSrcAddress, validatorDstAddress, {
                    denom: asset,
                    amount: amount.toString()
                })
            ], fee, memo);
        };
        this.undelegate = async (validatorAddress, asset, amount, fee, memo = 'JS Library') => {
            return utils.buildStdTx([
                utils.buildUndelegate(this._address.toString(), validatorAddress, {
                    denom: asset,
                    amount: amount.toString()
                })
            ], fee, memo);
        };
        this.transfer = async (toAddress, asset, amount, fee, memo = 'JS Library') => {
            return utils.buildStdTx([
                utils.buildSend([
                    {
                        amount: amount.toString(),
                        denom: asset
                    }
                ], this._address.toString(), toAddress)
            ], fee, memo);
        };
        this.setWithdrawAddress = async (withdrawAddress, fee, memo = 'JS Library') => {
            return utils.buildStdTx([utils.buildSetWithdrawAddress(this._address.toString(), withdrawAddress)], fee, memo);
        };
        this.withdrawReward = async (validatorAddress, fee, memo = 'JS Library') => {
            return utils.buildStdTx([utils.buildWithdrawDelegatorReward(this._address.toString(), validatorAddress)], fee, memo);
        };
        this._prefix = testnet ? prefixes.testnet : prefixes.mainnet;
        this._chainId = 'sandblockchain';
        this._apiClient = axios_1.default.create({
            baseURL: 'https://api.explorer.sandblock.io/api/v1/',
            timeout: 1000
        });
        this._cosmosClient = axios_1.default.create({
            baseURL: 'https://shore.sandblock.io/cosmos/',
            timeout: 1000
        });
        this._tendermintClient = axios_1.default.create({
            baseURL: 'https://shore.sandblock.io/tendermint/',
            timeout: 1000
        });
        this.axiosConfig = {
            headers: {
                'Content-Type': 'application/json;charset=UTF-8',
                'Access-Control-Allow-Origin': '*'
            }
        };
    }
}
exports.default = SandblockChainClient;
//# sourceMappingURL=index.js.map