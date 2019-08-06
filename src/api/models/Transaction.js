import * as encoder from '../../crypto/encoder';
import * as UVarInt from '../../crypto/varint';
import * as crypto from '../../crypto/index';

export const txType = {
    MsgSend: "cosmos-sdk/MsgSend"
};

export const typePrefix = {
    MsgSend: "2A2C87FA",
};

class Transaction {
    constructor(data){
        if (!data.chain_id) {
            throw new Error("chain id should not be null")
        }

        data = data || {};

        this.type = data.type;
        this.sequence = data.sequence || 0;
        this.account_number = data.account_number || 0;
        this.chain_id = data.chain_id;
        this.msgs = data.msg ? [data.msg] : [];
        this.memo = data.memo;
    }

    getSignBytes(msg){
        if(!msg){
            throw new Error('Msg should be an object');
        }
        const signMsg = {
            "account_number": this.account_number.toString(),
            "chain_id": this.chain_id,
            "data": null,
            "memo": this.memo,
            "msgs": [msg],
            "sequence": this.sequence.toString()
        }
        return encoder.convertObjectToSignBytes(signMsg);
    }

    addSignature(pubKey, signature) {
        pubKey = this._serializePubKey(pubKey) // => Buffer
        this.signatures = [{
            signature: signature.toString('hex'),
            pub_key: pubKey.toString('hex')
        }];
        return this
    }

    sign(privateKey, msg) {
        if(!privateKey){
            throw new Error("private key should not be null")
        }

        if(!msg){
            throw new Error("signing message should not be null")
        }

        const signBytes = this.getSignBytes(msg)
        const privKeyBuf = Buffer.from(privateKey, "hex")
        const signature = crypto.generateSignature(signBytes.toString("hex"), privKeyBuf);
        this.addSignature(crypto.generatePubKey(privKeyBuf), signature)
        return this;
    }

    serialize() {
        if (!this.signatures) {
            throw new Error("need signature")
        }

        let msg = this.msgs[0]
        const stdTx = {
            type: "cosmos-sdk/StdTx",
            value: {
                msg: [msg],
                fee: {amount: [], gas: "200000"},
                signatures: this.signatures,
                memo: this.memo
            }
        }
        console.log(JSON.stringify(stdTx));
        const bytes = encoder.marshalBinary(stdTx)
        return bytes.toString("hex")
    }

    _serializePubKey(unencodedPubKey) {
        let format = 0x2
        if (unencodedPubKey.y && unencodedPubKey.y.isOdd()) {
            format |= 0x1
        }
        let pubBz = Buffer.concat([
            UVarInt.encode(format),
            unencodedPubKey.x.toArrayLike(Buffer, "be", 32)
        ])
        // prefixed with length
        pubBz = encoder.encodeBinaryByteArray(pubBz)
        // add the amino prefix
        pubBz = Buffer.concat([Buffer.from("EB5AE987", "hex"), pubBz])
        return pubBz
    }
}

Transaction.txType = txType;
Transaction.typePrefix = typePrefix;

export default Transaction;
