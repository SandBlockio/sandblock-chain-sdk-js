/// <reference types="node" />
import { KeyPair } from './key';
import { StdTxValue, Signature } from './msg';
import { StdTx } from './msg';
export declare function prepareSignBytes(jsonTx: any): any;
export interface SignMetaData {
    sequence: string;
    account_number: string;
    chain_id: string;
}
export declare function createSignMessage(tx: StdTxValue, { sequence, account_number, chain_id }: SignMetaData): string;
export declare function signWithPrivateKey(signMessage: any, privateKey: any): any;
export declare function createSignature(signature: Buffer, publicKey: Buffer, requestMetaData: SignMetaData): Signature;
export declare function sign(jsonTx: any, keyPair: KeyPair, requestMetaData: SignMetaData): Signature;
export declare function createSignedTx(tx: StdTxValue, signature: Signature): StdTxValue;
export declare function getAminoDecodecTxBytes(tx: StdTx): any;
export declare function getTxHash(txbytes: Uint8Array): any;
export declare function createBroadcastBody(signedTx: StdTxValue, modeType?: string): string;
