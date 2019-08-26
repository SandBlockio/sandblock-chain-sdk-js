"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function buildStdTx(msg, fee, memo) {
    return {
        type: 'auth/StdTx',
        value: {
            fee,
            memo,
            msg,
            signatures: []
        }
    };
}
exports.buildStdTx = buildStdTx;
function buildSend(amount, fromAddress, toAddress) {
    // Sort coins before building msg
    amount.sort((a, b) => {
        if (a.denom < b.denom)
            return -1;
        return 1;
    });
    return {
        type: 'cosmos-sdk/MsgSend',
        value: {
            amount,
            from_address: fromAddress,
            to_address: toAddress
        }
    };
}
exports.buildSend = buildSend;
function buildMultiSend(inputs, outputs) {
    // Sort coins before building msg
    inputs.forEach(o => {
        o.coins.sort((a, b) => {
            if (a < b)
                return 1;
            return -1;
        });
    });
    outputs.forEach(o => {
        o.coins.sort((a, b) => {
            if (a < b)
                return 1;
            return -1;
        });
    });
    return {
        type: 'cosmos-sdk/MsgMultiSend',
        value: {
            inputs,
            outputs
        }
    };
}
exports.buildMultiSend = buildMultiSend;
function buildSetWithdrawAddress(delegatorAddress, withdrawAddress) {
    return {
        type: 'distribution/MsgModifyWithdrawAddress',
        value: {
            delegator_address: delegatorAddress,
            withdraw_address: withdrawAddress
        }
    };
}
exports.buildSetWithdrawAddress = buildSetWithdrawAddress;
function buildWithdrawDelegatorReward(delegatorAddress, validatorAddress) {
    return {
        type: 'distribution/MsgWithdrawDelegationReward',
        value: {
            delegator_address: delegatorAddress,
            validator_address: validatorAddress
        }
    };
}
exports.buildWithdrawDelegatorReward = buildWithdrawDelegatorReward;
function buildDelegate(delegatorAddress, validatorAddress, amount) {
    return {
        type: 'staking/MsgDelegate',
        value: {
            delegator_address: delegatorAddress,
            validator_address: validatorAddress,
            amount
        }
    };
}
exports.buildDelegate = buildDelegate;
function buildRedelegate(delegatorAddress, validatorSrcAddress, validatorDstAddress, amount) {
    return {
        type: 'staking/MsgBeginRedelegate',
        value: {
            delegator_address: delegatorAddress,
            validator_src_address: validatorSrcAddress,
            validator_dst_address: validatorDstAddress,
            amount
        }
    };
}
exports.buildRedelegate = buildRedelegate;
function buildUndelegate(delegatorAddress, validatorAddress, amount) {
    return {
        type: 'staking/MsgUndelegate',
        value: {
            delegator_address: delegatorAddress,
            validator_address: validatorAddress,
            amount
        }
    };
}
exports.buildUndelegate = buildUndelegate;
//# sourceMappingURL=msg.js.map