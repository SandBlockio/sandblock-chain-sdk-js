/// <reference types="node" />
import * as bip32 from 'bip32';
export declare function deriveMasterKey(mnemonic: string): Promise<bip32.BIP32Interface>;
export declare function deriveMasterKeySync(mnemonic: string): bip32.BIP32Interface;
export declare function validateMnemonic(mnemonic: string): boolean;
export interface KeyPair {
    privateKey: Buffer;
    publicKey: Buffer;
}
export declare function getKeypairFromPrivateKey(privateKey: Buffer): KeyPair;
export declare function getPrivateKeyFromKeyStore(keystore: any, password: string): Buffer;
export declare function deriveKeypair(masterKey: bip32.BIP32Interface, account?: Number, index?: Number): KeyPair;
export declare function getAccAddress(publicKey: Buffer, prefix?: string): Buffer;
export declare function getValAddress(publicKey: Buffer, prefix?: string): string;
export declare function convertValAddressToAccAddress(address: string, prefix?: string): string;
export declare function convertAccAddressToValAddress(address: string, prefix?: string): string;
export declare function generateMnemonic(): Buffer;
export declare function generatePrivateKey(len?: number): Buffer;
export declare function sha3(hex: any): any;
export declare function generateKeyStore(privateKey: Buffer, password: string): {};
export declare function getPublicKeyFromPrivateKey(privateKey: Buffer): Buffer;
export declare function decodeAddress(value: any): Buffer;
export declare function encodeAddress(value: string, prefix?: string, type?: string): Buffer;
export declare function getAddressFromPublicKey(publicKey: Buffer, prefix?: string): Buffer;
export declare function getAddressFromPrivateKey(privateKey: Buffer, prefix?: string): Buffer;
