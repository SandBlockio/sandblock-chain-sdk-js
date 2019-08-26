"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CryptoJS = require("crypto-js");
const secp256k1 = require("secp256k1");
const Amino = require("js-amino");
function byteArrayToWordArray(ba) {
    const wa = [];
    for (let i = 0; i < ba.length; i += 1) {
        wa[(i / 4) | 0] |= ba[i] << (24 - 8 * i);
    }
    return CryptoJS.lib.WordArray.create(wa, ba.length);
}
// Transactions often have amino decoded objects in them {type, value}.
// We need to strip this clutter as we need to sign only the values.
function prepareSignBytes(jsonTx) {
    if (Array.isArray(jsonTx)) {
        return jsonTx.map(prepareSignBytes);
    }
    // string or number
    if (typeof jsonTx !== `object`) {
        return jsonTx;
    }
    const sorted = {};
    Object.keys(jsonTx)
        .sort()
        .forEach(key => {
        if (jsonTx[key] === undefined || jsonTx[key] === null)
            return;
        sorted[key] = prepareSignBytes(jsonTx[key]);
    });
    return sorted;
}
exports.prepareSignBytes = prepareSignBytes;
/*
The SDK expects a certain message format to serialize and then sign.
type StdSignMsg struct {
  ChainID       string      `json:"chain_id"`
  AccountNumber uint64      `json:"account_number"`
  Sequence      uint64      `json:"sequence"`
  Fee           auth.StdFee `json:"fee"`
  Msgs          []sdk.Msg   `json:"msgs"`
  Memo          string      `json:"memo"`
}
*/
/* eslint-disable @typescript-eslint/camelcase */
function createSignMessage(tx, { sequence, account_number, chain_id }) {
    // sign bytes need amount to be an array
    const fee = {
        amount: tx.fee.amount || [],
        gas: tx.fee.gas
    };
    return JSON.stringify(prepareSignBytes({
        fee,
        memo: tx.memo,
        msgs: tx.msg,
        sequence,
        account_number,
        chain_id
    }));
}
// produces the signature for a message (returns Buffer)
function signWithPrivateKey(signMessage, privateKey) {
    const signHash = Buffer.from(CryptoJS.SHA256(signMessage).toString(), `hex`);
    const { signature } = secp256k1.sign(signHash, Buffer.from(privateKey, `hex`));
    return signature;
}
function createSignature(signature, publicKey) {
    return {
        signature: signature.toString(`base64`),
        pub_key: {
            type: `tendermint/PubKeySecp256k1`,
            value: publicKey.toString(`base64`)
        }
    };
}
// main function to sign a jsonTx using the local keystore wallet
// returns the complete signature object to add to the tx
function sign(jsonTx, keyPair, requestMetaData) {
    const signMessage = createSignMessage(jsonTx, requestMetaData);
    const signatureBuffer = signWithPrivateKey(signMessage, keyPair.privateKey);
    return createSignature(signatureBuffer, keyPair.publicKey);
}
exports.sign = sign;
// adds the signature object to the tx
function createSignedTx(tx, signature) {
    return Object.assign({}, tx, {
        signatures: [signature]
    });
}
exports.createSignedTx = createSignedTx;
function getAminoDecodecTxBytes(tx) {
    return Amino.marshalTx(tx, true);
}
exports.getAminoDecodecTxBytes = getAminoDecodecTxBytes;
function getTxHash(txbytes) {
    return CryptoJS.SHA256(byteArrayToWordArray(txbytes)).toString();
}
exports.getTxHash = getTxHash;
// the broadcast body consists of the signed tx and a return type
// returnType can be block (inclusion in block), async (right away), sync (after checkTx has passed)
function createBroadcastBody(signedTx, modeType = `block`) {
    return JSON.stringify({
        tx: signedTx,
        mode: modeType
    });
}
exports.createBroadcastBody = createBroadcastBody;
//# sourceMappingURL=tx.js.map