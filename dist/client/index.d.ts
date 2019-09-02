/// <reference types="node" />
export default class SandblockChainClient {
    private _prefix;
    private readonly _chainId;
    private _apiClient;
    private _cosmosClient;
    private _tendermintClient;
    private readonly axiosConfig;
    private _keypair;
    _address: Buffer;
    constructor(testnet?: boolean);
    setPrivateKey: Function;
    createAccount: Function;
    getAccount: Function;
    getAccountLive: Function;
    getBlocksBetween: Function;
    getBlockAtHeight: Function;
    getBlockAtHeightLive: Function;
    getLastFiftyBlocks: Function;
    getLatestBlock: Function;
    getLastFiftyTransactions: Function;
    getTransaction: Function;
    getTransactionLive: Function;
    getValidatorsSet: Function;
    getValidators: Function;
    getValidator: Function;
    getValidatorDelegations: Function;
    getStatus: Function;
    search: Function;
    broadcastRawTransaction: Function;
    transfer: Function;
}
