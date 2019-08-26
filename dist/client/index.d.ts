/// <reference types="node" />
export default class SandblockChainClient {
    private _prefix;
    private readonly _chainId;
    private _apiClient;
    private _cosmosClient;
    private readonly axiosConfig;
    private _keypair;
    _address: Buffer;
    constructor(testnet?: boolean);
    setPrivateKey: Function;
    createAccount: Function;
    getAccount: Function;
    getAccountLive: Function;
    getBlockAtHeight: Function;
    getLastFiftyBlocks: Function;
    getLatestBlock: Function;
    getLastFiftyTransactions: Function;
    getTransaction: Function;
    search: Function;
    broadcastRawTransaction: Function;
    transfer: Function;
}
