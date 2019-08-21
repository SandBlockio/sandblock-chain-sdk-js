import * as utils from '../src2/utils';
import * as bip39 from "bip39";
import * as chai from 'chai';

describe('crypto', () => {
    it('generate a random address', () => {
        const privateKey = utils.generatePrivateKey();
        const kp = utils.getKeypairFromPrivateKey(privateKey);
        const address = utils.getAccAddress(kp.publicKey);
        chai.expect(address).to.be.ok;
    });

    it("generate an address from privateKey", () => {
        const privateKey = Buffer.from("90335b9d2153ad1a9799a3ccc070bd64b4164e9642ee1dd48053c33f9a3a05e9", "hex");
        const address = utils.getAddressFromPrivateKey(privateKey);
        chai.expect(address.toString()).to.equal("sand1hgm0p7khfk85zpz5v0j8wnej3a90w709mqukrg");
    });

    it("generate an address from publicKey", () => {
        const privateKey = Buffer.from("90335b9d2153ad1a9799a3ccc070bd64b4164e9642ee1dd48053c33f9a3a05e9", "hex");
        const publicKey = utils.getPublicKeyFromPrivateKey(privateKey);
        const address = utils.getAddressFromPublicKey(publicKey);
        chai.expect(address.toString()).to.equal("sand1hgm0p7khfk85zpz5v0j8wnej3a90w709mqukrg");
    });

    it("generate private key from keyStore", () => {
        const privateKey = utils.generatePrivateKey();
        const keyStore = utils.generateKeyStore(privateKey, "1234567");

        const pk = utils.getPrivateKeyFromKeyStore(keyStore, "1234567");
        chai.expect(pk.toString('hex')).to.equal(privateKey.toString('hex'));
    });

    it("generate private key from mnemonic", () => {
        const mnemonic = utils.generateMnemonic();
        const masterKey = utils.deriveMasterKeySync(mnemonic.toString());
        const keypair = utils.deriveKeypair(masterKey);
        const pubAddress = utils.getAccAddress(keypair.publicKey);

        chai.expect(pubAddress.toString()).to.be.ok;
        chai.expect(keypair.publicKey.toString('hex')).to.be.ok;
        chai.expect(keypair.privateKey.toString('hex')).to.be.ok;
    });

    it("generate mnemonic", ()=>{
        const mnemonic = utils.generateMnemonic();
        chai.expect(bip39.validateMnemonic(mnemonic.toString())).to.be.ok;
    });

    it("decodeAddress", ()=>{
        let address = "surprise1hgm0p7khfk85zpz5v0j8wnej3a90w70906sgzh";
        const decod = utils.decodeAddress(address);
        chai.expect(decod.toString("hex")).to.equal("ba36f0fad74d8f41045463e4774f328f4af779e5");
    });

    it("generate address from mnemonic", () => {
        const mnemonic = "offer caution gift cross surge pretty orange during eye soldier popular holiday mention east eight office fashion ill parrot vault rent devote earth cousin";
        const masterKey = utils.deriveMasterKeySync(mnemonic);
        const keypair = utils.deriveKeypair(masterKey);
        const address = utils.getAddressFromPrivateKey(keypair.privateKey);
        chai.expect(address.toString()).to.equal("sand1z9dwjn0nhs79jk8gmhg278erpkh2pujq86e4qu");
    });
});
