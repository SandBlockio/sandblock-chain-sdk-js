"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const HEX = require("crypto-js/enc-hex");
const hexEncoding = require("crypto-js/enc-hex");
const RIPEMD160 = require("crypto-js/ripemd160");
const SHA256 = require("crypto-js/sha256");
const SHA3 = require("crypto-js/sha3");
const csprng = require("secure-random");
const uuid = require("uuid");
const js_sha256_1 = require("js-sha256");
const bip32 = require("bip32");
const bip39 = require("bip39");
const bech32 = require("bech32");
const cryp = require("crypto-browserify");
const secp256k1 = require("secp256k1");
const accPrefix = 'sand';
const valPrefix = accPrefix + 'valoper';
const KEY_LEN = 32;
async function deriveMasterKey(mnemonic) {
    // throws if mnemonic is invalid
    bip39.validateMnemonic(mnemonic);
    const seed = await bip39.mnemonicToSeed(mnemonic);
    return bip32.fromSeed(seed);
}
exports.deriveMasterKey = deriveMasterKey;
function deriveMasterKeySync(mnemonic) {
    // throws if mnemonic is invalid
    bip39.validateMnemonic(mnemonic);
    const seed = bip39.mnemonicToSeedSync(mnemonic);
    return bip32.fromSeed(seed);
}
exports.deriveMasterKeySync = deriveMasterKeySync;
function validateMnemonic(mnemonic) {
    return bip39.validateMnemonic(mnemonic);
}
exports.validateMnemonic = validateMnemonic;
function getKeypairFromPrivateKey(privateKey) {
    const publicKey = secp256k1.publicKeyCreate(privateKey, true);
    return {
        privateKey,
        publicKey
    };
}
exports.getKeypairFromPrivateKey = getKeypairFromPrivateKey;
function getPrivateKeyFromMnemonic(mnemonic, derive = true, index = 0, password) {
    if (!bip39.validateMnemonic(mnemonic.toString())) {
        throw new Error('wrong mnemonic format');
    }
    const hdPathLuna = `44'/118'/0'/0/${index}`;
    const seed = bip39.mnemonicToSeedSync(mnemonic.toString(), password.toString());
    if (derive) {
        const master = bip32.fromSeed(seed);
        const child = master.derivePath(hdPathLuna);
        return child.privateKey;
    }
    return seed;
}
exports.getPrivateKeyFromMnemonic = getPrivateKeyFromMnemonic;
function getPrivateKeyFromKeyStore(keystore, password) {
    if (!password || password.length <= 0) {
        throw new Error("No password given");
    }
    const json = (typeof keystore == "object") ? keystore : JSON.parse(keystore);
    const kdfparams = json.crypto.kdfparams;
    if (kdfparams.prf !== "hmac-sha256") {
        throw new Error("Unsupported parameters to PBKDF2");
    }
    const derivedKey = cryp.pbkdf2Sync(Buffer.from(password), Buffer.from(kdfparams.salt, "hex"), kdfparams.c, kdfparams.dklen, "sha256");
    const ciphertext = Buffer.from(json.crypto.ciphertext, "hex");
    const bufferValue = Buffer.concat([derivedKey.slice(16, 32), ciphertext]);
    // try sha3 (new / ethereum keystore) mac first
    const mac = sha3(bufferValue.toString("hex"));
    if (mac !== json.crypto.mac) {
        // the legacy (sha256) mac is next to be checked. pre-testnet keystores used a sha256 digest for the mac.
        // the sha256 mac was not compatible with ethereum keystores, so it was changed to sha3 for mainnet.
        const macLegacy = SHA256(bufferValue.toString("hex"));
        if (macLegacy !== json.crypto.mac) {
            throw new Error("Keystore mac check failed (sha3 & sha256) - wrong password?");
        }
    }
    const decipher = cryp.createDecipheriv(json.crypto.cipher, derivedKey.slice(0, 32), Buffer.from(json.crypto.cipherparams.iv, "hex"));
    const privateKey = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("hex");
    return Buffer.from(privateKey, 'hex');
}
exports.getPrivateKeyFromKeyStore = getPrivateKeyFromKeyStore;
function deriveKeypair(masterKey, account = 0, index = 0) {
    //TODO: Change the 118 as soon as we register our ticker https://github.com/satoshilabs/slips/blob/master/slip-0044.md
    const hdPathLuna = `m/44'/118'/${account}'/0/${index}`;
    const sandHD = masterKey.derivePath(hdPathLuna);
    const privateKey = sandHD.privateKey;
    if (!privateKey) {
        throw new Error('Failed to derive key pair');
    }
    const publicKey = secp256k1.publicKeyCreate(privateKey, true);
    return {
        privateKey,
        publicKey
    };
}
exports.deriveKeypair = deriveKeypair;
// NOTE: this only works with a compressed public key (33 bytes)
function getAddress(publicKey) {
    if (typeof publicKey !== 'object' || publicKey.constructor !== Buffer) {
        throw TypeError('parameter must be Buffer that contains public key');
    }
    const message = HEX.parse(publicKey.toString('hex'));
    const hash = RIPEMD160(SHA256(message)).toString();
    const address = Buffer.from(hash, 'hex');
    return bech32.toWords(address);
}
// NOTE: this only works with a compressed public key (33 bytes)
function getAccAddress(publicKey, prefix = accPrefix) {
    const words = getAddress(publicKey);
    return Buffer.from(bech32.encode(prefix, words));
}
exports.getAccAddress = getAccAddress;
// NOTE: this only works with a compressed public key (33 bytes)
function getValAddress(publicKey, prefix = valPrefix) {
    const words = getAddress(publicKey);
    return bech32.encode(prefix, words);
}
exports.getValAddress = getValAddress;
function convertValAddressToAccAddress(address, prefix = accPrefix) {
    const { words } = bech32.decode(address);
    return bech32.encode(prefix, words);
}
exports.convertValAddressToAccAddress = convertValAddressToAccAddress;
function convertAccAddressToValAddress(address, prefix = valPrefix) {
    const { words } = bech32.decode(address);
    return bech32.encode(prefix, words);
}
exports.convertAccAddressToValAddress = convertAccAddressToValAddress;
function generateMnemonic() {
    return Buffer.from(bip39.generateMnemonic(256));
}
exports.generateMnemonic = generateMnemonic;
function generatePrivateKey(len = KEY_LEN) {
    return Buffer.from(csprng(len));
}
exports.generatePrivateKey = generatePrivateKey;
function sha3(hex) {
    if (typeof hex !== "string")
        throw new Error("sha3 expects a hex string");
    if (hex.length % 2 !== 0)
        throw new Error(`invalid hex string length: ${hex}`);
    const hexEncoded = hexEncoding.parse(hex);
    return SHA3(hexEncoded).toString();
}
exports.sha3 = sha3;
function generateKeyStore(privateKey, password) {
    const salt = cryp.randomBytes(32);
    const iv = cryp.randomBytes(16);
    const cipherAlg = "aes-256-ctr";
    const privateKeyHex = privateKey.toString('hex');
    const kdf = "pbkdf2";
    const kdfparams = {
        dklen: KEY_LEN,
        salt: salt.toString("hex"),
        c: 262144,
        prf: "hmac-sha256"
    };
    const derivedKey = cryp.pbkdf2Sync(Buffer.from(password), salt, kdfparams.c, kdfparams.dklen, "sha256");
    const cipher = cryp.createCipheriv(cipherAlg, derivedKey.slice(0, 32), iv);
    if (!cipher) {
        throw new Error("Unsupported cipher");
    }
    const ciphertext = Buffer.concat([cipher.update(Buffer.from(privateKeyHex, "hex")), cipher.final()]);
    const bufferValue = Buffer.concat([derivedKey.slice(16, 32), Buffer.from(ciphertext.toString('hex'), "hex")]);
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
    };
}
exports.generateKeyStore = generateKeyStore;
function getPublicKeyFromPrivateKey(privateKey) {
    return getKeypairFromPrivateKey(privateKey).publicKey;
}
exports.getPublicKeyFromPrivateKey = getPublicKeyFromPrivateKey;
function decodeAddress(value) {
    const decodeAddress = bech32.decode(value);
    return Buffer.from(bech32.fromWords(decodeAddress.words));
}
exports.decodeAddress = decodeAddress;
function encodeAddress(value, prefix = accPrefix, type = "hex") {
    // @ts-ignore
    const words = bech32.toWords(Buffer.from(value, type));
    return Buffer.from(bech32.encode(prefix, words));
}
exports.encodeAddress = encodeAddress;
function getAddressFromPublicKey(publicKey, prefix = accPrefix) {
    return getAccAddress(publicKey, prefix);
}
exports.getAddressFromPublicKey = getAddressFromPublicKey;
function getAddressFromPrivateKey(privateKey, prefix = accPrefix) {
    return getAddressFromPublicKey(getKeypairFromPrivateKey(privateKey).publicKey, prefix);
}
exports.getAddressFromPrivateKey = getAddressFromPrivateKey;
function decodeTransactionHash(hash) {
    return Buffer.from(js_sha256_1.sha256(Buffer.from(hash, 'base64'))).toString().toUpperCase();
}
exports.decodeTransactionHash = decodeTransactionHash;
//# sourceMappingURL=key.js.map