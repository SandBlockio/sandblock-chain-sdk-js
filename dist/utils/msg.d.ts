export interface Coin {
    denom: string;
    amount: string;
}
export interface Fee {
    gas: string;
    amount: Coin[];
}
export interface InOut {
    address: string;
    coins: Coin[];
}
export interface Signature {
    signature: string;
    pub_key: {
        type: string;
        value: string;
    };
}
export interface StdTxValue {
    fee: Fee;
    memo: string;
    msg: object[];
    signatures: Signature[];
}
export interface StdTx {
    type: string;
    value: StdTxValue;
}
export declare function buildStdTx(msg: object[], fee: Fee, memo: string): StdTx;
interface MsgSend {
    type: string;
    value: {
        amount: Coin[];
        from_address: string;
        to_address: string;
    };
}
export declare function buildSend(amount: Coin[], fromAddress: string, toAddress: string): MsgSend;
interface MsgMultiSend {
    type: string;
    value: {
        inputs: InOut[];
        outputs: InOut[];
    };
}
export declare function buildMultiSend(inputs: InOut[], outputs: InOut[]): MsgMultiSend;
interface MsgSetWithdrawAddress {
    type: string;
    value: {
        delegator_address: string;
        withdraw_address: string;
    };
}
export declare function buildSetWithdrawAddress(delegatorAddress: string, withdrawAddress: string): MsgSetWithdrawAddress;
interface MsgWithdrawDelegatorReward {
    type: string;
    value: {
        delegator_address: string;
        validator_address: string;
    };
}
export declare function buildWithdrawDelegatorReward(delegatorAddress: string, validatorAddress: string): MsgWithdrawDelegatorReward;
interface MsgDelegate {
    type: string;
    value: {
        delegator_address: string;
        validator_address: string;
        amount: Coin;
    };
}
export declare function buildDelegate(delegatorAddress: string, validatorAddress: string, amount: Coin): MsgDelegate;
interface MsgRedelegate {
    type: string;
    value: {
        delegator_address: string;
        validator_src_address: string;
        validator_dst_address: string;
        amount: Coin;
    };
}
export declare function buildRedelegate(delegatorAddress: string, validatorSrcAddress: string, validatorDstAddress: string, amount: Coin): MsgRedelegate;
interface MsgUndelegate {
    type: string;
    value: {
        delegator_address: string;
        validator_address: string;
        amount: Coin;
    };
}
export declare function buildUndelegate(delegatorAddress: string, validatorAddress: string, amount: Coin): MsgUndelegate;
export {};
