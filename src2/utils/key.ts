import * as HEX from 'crypto-js/enc-hex'
import * as RIPEMD160 from 'crypto-js/ripemd160'
import * as SHA256 from 'crypto-js/sha256'
import * as SHA3 from "crypto-js/sha3"
import * as hexEncoding from "crypto-js/enc-hex"

import * as bip32 from 'bip32'
import * as bip39 from 'bip39'
import * as bech32 from 'bech32'
import * as cryp from "crypto-browserify"

import * as secp256k1 from 'secp256k1'

const accPrefix = 'sand'
const valPrefix = 'sandval'

export async function deriveMasterKey(mnemonic: string): Promise<bip32.BIP32Interface> {
    // throws if mnemonic is invalid
    bip39.validateMnemonic(mnemonic)

    const seed = await bip39.mnemonicToSeed(mnemonic)
    return bip32.fromSeed(seed)
}

export function deriveMasterKeySync(mnemonic: string): bip32.BIP32Interface {
    // throws if mnemonic is invalid
    bip39.validateMnemonic(mnemonic)

    const seed = bip39.mnemonicToSeedSync(mnemonic)
    return bip32.fromSeed(seed)
}

export interface KeyPair {
    privateKey: Buffer
    publicKey: Buffer
}

export function getKeypairFromPrivateKey(privateKey: Buffer): KeyPair {
    const publicKey = secp256k1.publicKeyCreate(privateKey, true);
    return {
        privateKey,
        publicKey
    }
}

export function getPrivateKeyFromKeyStore (keystore: any, password: string): Buffer{
    if(!password || password.length <= 0){
        throw new Error("No password given");
    }

    const json = (typeof keystore == "object") ? keystore : JSON.parse(keystore);
    const kdfparams = json.crypto.kdfparams

    if (kdfparams.prf !== "hmac-sha256") {
        throw new Error("Unsupported parameters to PBKDF2")
    }

    const derivedKey = cryp.pbkdf2Sync(Buffer.from(password), Buffer.from(kdfparams.salt, "hex"), kdfparams.c, kdfparams.dklen, "sha256")
    const ciphertext = Buffer.from(json.crypto.ciphertext, "hex")
    const bufferValue = Buffer.concat([derivedKey.slice(16, 32), ciphertext])

    // try sha3 (new / ethereum keystore) mac first
    const mac = sha3(bufferValue.toString("hex"))
    if (mac !== json.crypto.mac) {
        // the legacy (sha256) mac is next to be checked. pre-testnet keystores used a sha256 digest for the mac.
        // the sha256 mac was not compatible with ethereum keystores, so it was changed to sha3 for mainnet.
        const macLegacy = SHA256(bufferValue.toString("hex"))
        if (macLegacy !== json.crypto.mac) {
            throw new Error("Keystore mac check failed (sha3 & sha256) - wrong password?")
        }
    }

    const decipher = cryp.createDecipheriv(json.crypto.cipher, derivedKey.slice(0, 32), Buffer.from(json.crypto.cipherparams.iv, "hex"))
    const privateKey = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("hex")

    return Buffer.from(privateKey, 'hex');
}

export function deriveKeypair(masterKey: bip32.BIP32Interface, account: Number = 0, index: Number = 0): KeyPair {
    const hdPathLuna = `m/44'/330'/${account}'/0/${index}`
    const terraHD = masterKey.derivePath(hdPathLuna)

    const privateKey = terraHD.privateKey

    if (!privateKey) {
        throw new Error('Failed to derive key pair')
    }

    const publicKey = secp256k1.publicKeyCreate(privateKey, true)

    return {
        privateKey,
        publicKey
    }
}

// NOTE: this only works with a compressed public key (33 bytes)
function getAddress(publicKey: Buffer): Buffer {
    if (typeof publicKey !== 'object' || publicKey.constructor !== Buffer) {
        throw TypeError('parameter must be Buffer that contains public key');
    }

    const message = HEX.parse(publicKey.toString('hex'))
    const hash = RIPEMD160(SHA256(message)).toString()
    const address = Buffer.from(hash, 'hex')
    return bech32.toWords(address)
}

// NOTE: this only works with a compressed public key (33 bytes)
export function getAccAddress(publicKey: Buffer): string {
    const words = getAddress(publicKey)
    return bech32.encode(accPrefix, words)
}

// NOTE: this only works with a compressed public key (33 bytes)
export function getValAddress(publicKey: Buffer): string {
    const words = getAddress(publicKey)
    return bech32.encode(valPrefix, words)
}

export function convertValAddressToAccAddress(address: string): string {
    const { words } = bech32.decode(address)
    return bech32.encode(accPrefix, words)
}

export function convertAccAddressToValAddress(address: string): string {
    const { words } = bech32.decode(address)
    return bech32.encode(valPrefix, words)
}

export function generateMnemonic(): string {
    return bip39.generateMnemonic(256)
}

export function sha3(hex) {
    if (typeof hex !== "string") throw new Error("sha3 expects a hex string")
    if (hex.length % 2 !== 0) throw new Error(`invalid hex string length: ${hex}`)
    const hexEncoded = hexEncoding.parse(hex)
    return SHA3(hexEncoded).toString()
}