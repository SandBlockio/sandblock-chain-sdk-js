import * as HEX from 'crypto-js/enc-hex'
import * as hexEncoding from 'crypto-js/enc-hex'
import * as RIPEMD160 from 'crypto-js/ripemd160'
import * as SHA256 from 'crypto-js/sha256'
import * as SHA3 from "crypto-js/sha3"
import * as csprng from "secure-random"
import * as uuid from "uuid"

import * as bip32 from 'bip32'
import * as bip39 from 'bip39'
import * as bech32 from 'bech32'
import * as cryp from "crypto-browserify"

import * as secp256k1 from 'secp256k1'

const accPrefix = 'sand'
const valPrefix = 'sandval'
const KEY_LEN = 32;

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

export function validateMnemonic(mnemonic: string): boolean {
    return bip39.validateMnemonic(mnemonic);
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
export function getAccAddress(publicKey: Buffer): Buffer {
    const words = getAddress(publicKey)
    return Buffer.from(bech32.encode(accPrefix, words));
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

export function generateMnemonic(): Buffer {
    return Buffer.from(bip39.generateMnemonic(256));
}

export function generatePrivateKey(len = KEY_LEN): Buffer {
    return Buffer.from(csprng(len));
}

export function sha3(hex) {
    if (typeof hex !== "string") throw new Error("sha3 expects a hex string")
    if (hex.length % 2 !== 0) throw new Error(`invalid hex string length: ${hex}`)
    const hexEncoded = hexEncoding.parse(hex)
    return SHA3(hexEncoded).toString()
}

export function generateKeyStore(privateKey: Buffer, password: string): {} {
    const salt = cryp.randomBytes(32)
    const iv = cryp.randomBytes(16)
    const cipherAlg = "aes-256-ctr"

    const privateKeyHex = privateKey.toString('hex');

    const kdf = "pbkdf2"
    const kdfparams = {
        dklen: KEY_LEN,
        salt: salt.toString("hex"),
        c: 262144,
        prf: "hmac-sha256"
    }

    const derivedKey = cryp.pbkdf2Sync(Buffer.from(password), salt, kdfparams.c, kdfparams.dklen, "sha256")
    const cipher = cryp.createCipheriv(cipherAlg, derivedKey.slice(0, 32), iv)
    if (!cipher) {
        throw new Error("Unsupported cipher")
    }

    const ciphertext = Buffer.concat([cipher.update(Buffer.from(privateKeyHex, "hex")), cipher.final()])
    const bufferValue = Buffer.concat([derivedKey.slice(16, 32), Buffer.from(ciphertext.toString('hex'), "hex")])

    return {
        version: 1,
        id: uuid.v4({
            random: cryp.randomBytes(16)
        }),
        crypto: {
            ciphertext: ciphertext.toString("hex"),
            cipherparams: {
                iv: iv.toString("hex")
            },
            cipher: cipherAlg,
            kdf,
            kdfparams: kdfparams,
            // mac must use sha3 according to web3 secret storage spec
            mac: sha3(bufferValue.toString("hex"))
        }
    }
}

export function getPublicKeyFromPrivateKey(privateKey: Buffer): Buffer {
    return getKeypairFromPrivateKey(privateKey).publicKey;
}

export function decodeAddress(value): Buffer {
    const decodeAddress = bech32.decode(value);
    return Buffer.from(bech32.fromWords(decodeAddress.words));
}

export function encodeAddress(value: string, prefix:string = "sand", type:string = "hex"): Buffer {
    // @ts-ignore
    const words = bech32.toWords(Buffer.from(value, type));
    return Buffer.from(bech32.encode(prefix, words));
}

export function getAddressFromPublicKey(publicKey: Buffer, prefix: string = accPrefix): Buffer {
    return getAccAddress(publicKey);
}

export function getAddressFromPrivateKey(privateKey: Buffer, prefix: string = accPrefix): Buffer {
    return getAddressFromPublicKey(getKeypairFromPrivateKey(privateKey).publicKey);
}
