export interface Coin {
    denom: string
    amount: string
}

export interface Fee {
    gas: string
    amount: Coin[]
}

export interface InOut {
    address: string
    coins: Coin[]
}

export interface Signature {
    signature: string
    pub_key: {
        type: string
        value: string
    },
    account_number: string;
    sequence: string;
    chain_id: string;
}

export interface StdTxValue {
    fee: Fee
    memo: string
    msg: object[]
    signatures: Signature[]
}

export interface StdTx {
    type: string
    value: StdTxValue
}

export function buildStdTx(msg: object[], fee: Fee, memo: string): StdTx {
    return {
        type: 'auth/StdTx',
        value: {
            fee,
            memo,
            msg,
            signatures: []
        }
    }
}

interface MsgSend {
    type: string
    value: {
        amount: Coin[]
        from_address: string
        to_address: string
    }
}

export function buildSend(amount: Coin[], fromAddress: string, toAddress: string): MsgSend {
    // Sort coins before building msg
    amount.sort((a, b) => {
        if (a.denom < b.denom) return -1
        return 1
    })

    return {
        type: 'cosmos-sdk/MsgSend',
        value: {
            amount,
            from_address: fromAddress,
            to_address: toAddress
        }
    }
}

interface MsgMultiSend {
    type: string
    value: {
        inputs: InOut[]
        outputs: InOut[]
    }
}

export function buildMultiSend(inputs: InOut[], outputs: InOut[]): MsgMultiSend {
    // Sort coins before building msg
    inputs.forEach(o => {
        o.coins.sort((a, b) => {
            if (a < b) return 1
            return -1
        })
    })

    outputs.forEach(o => {
        o.coins.sort((a, b) => {
            if (a < b) return 1
            return -1
        })
    })

    return {
        type: 'cosmos-sdk/MsgMultiSend',
        value: {
            inputs,
            outputs
        }
    }
}

interface MsgSetWithdrawAddress {
    type: string
    value: {
        delegator_address: string
        withdraw_address: string
    }
}

export function buildSetWithdrawAddress(delegatorAddress: string, withdrawAddress: string): MsgSetWithdrawAddress {
    return {
        type: 'cosmos-sdk/MsgModifyWithdrawAddress',
        value: {
            delegator_address: delegatorAddress,
            withdraw_address: withdrawAddress
        }
    }
}

interface MsgWithdrawDelegatorReward {
    type: string
    value: {
        delegator_address: string
        validator_address: string
    }
}

export function buildWithdrawDelegatorReward(delegatorAddress: string, validatorAddress: string): MsgWithdrawDelegatorReward {
    return {
        type: 'cosmos-sdk/MsgWithdrawDelegationReward',
        value: {
            delegator_address: delegatorAddress,
            validator_address: validatorAddress
        }
    }
}

interface MsgDelegate {
    type: string
    value: {
        delegator_address: string
        validator_address: string
        amount: Coin
    }
}

export function buildDelegate(delegatorAddress: string, validatorAddress: string, amount: Coin): MsgDelegate {
    return {
        type: 'cosmos-sdk/MsgDelegate',
        value: {
            delegator_address: delegatorAddress,
            validator_address: validatorAddress,
            amount
        }
    }
}

interface MsgRedelegate {
    type: string
    value: {
        delegator_address: string
        validator_src_address: string
        validator_dst_address: string
        amount: Coin
    }
}

export function buildRedelegate(delegatorAddress: string, validatorSrcAddress: string, validatorDstAddress: string, amount: Coin): MsgRedelegate {
    return {
        type: 'cosmos-sdk/MsgBeginRedelegate',
        value: {
            delegator_address: delegatorAddress,
            validator_src_address: validatorSrcAddress,
            validator_dst_address: validatorDstAddress,
            amount
        }
    }
}

interface MsgUndelegate {
    type: string
    value: {
        delegator_address: string
        validator_address: string
        amount: Coin
    }
}

export function buildUndelegate(delegatorAddress: string, validatorAddress: string, amount: Coin): MsgUndelegate {
    return {
        type: 'cosmos-sdk/MsgUndelegate',
        value: {
            delegator_address: delegatorAddress,
            validator_address: validatorAddress,
            amount
        }
    }
}
