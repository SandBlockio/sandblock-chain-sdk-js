import * as utils from '../src/utils';
import * as bip39 from "bip39";
import * as chai from 'chai';

describe('utils', () => {
    it('should generate a random address', () => {
        const privateKey = utils.generatePrivateKey();
        const kp = utils.getKeypairFromPrivateKey(privateKey);
        const address = utils.getAccAddress(kp.publicKey);
        chai.expect(address).to.be.ok;
    });

    it("should generate an address from privateKey", () => {
        const privateKey = Buffer.from("90335b9d2153ad1a9799a3ccc070bd64b4164e9642ee1dd48053c33f9a3a05e9", "hex");
        const address = utils.getAddressFromPrivateKey(privateKey);
        chai.expect(address.toString()).to.equal("sand1hgm0p7khfk85zpz5v0j8wnej3a90w709mqukrg");
    });

    it("should generate an address from publicKey", () => {
        const privateKey = Buffer.from("90335b9d2153ad1a9799a3ccc070bd64b4164e9642ee1dd48053c33f9a3a05e9", "hex");
        const publicKey = utils.getPublicKeyFromPrivateKey(privateKey);
        const address = utils.getAddressFromPublicKey(publicKey);
        chai.expect(address.toString()).to.equal("sand1hgm0p7khfk85zpz5v0j8wnej3a90w709mqukrg");
    });

    it("should generate private key from keyStore", () => {
        const privateKey = utils.generatePrivateKey();
        const keyStore = utils.generateKeyStore(privateKey, "1234567");

        const pk = utils.getPrivateKeyFromKeyStore(keyStore, "1234567");
        chai.expect(pk.toString('hex')).to.equal(privateKey.toString('hex'));
    });

    it("should generate private key from mnemonic", () => {
        const mnemonic = utils.generateMnemonic();
        const masterKey = utils.deriveMasterKeySync(mnemonic.toString());
        const keypair = utils.deriveKeypair(masterKey);
        const pubAddress = utils.getAccAddress(keypair.publicKey);

        chai.expect(pubAddress.toString()).to.be.ok;
        chai.expect(keypair.publicKey.toString('hex')).to.be.ok;
        chai.expect(keypair.privateKey.toString('hex')).to.be.ok;
    });

    it("should generate mnemonic", ()=>{
        const mnemonic = utils.generateMnemonic();
        chai.expect(bip39.validateMnemonic(mnemonic.toString())).to.be.ok;
    });

    it("should decodeAddress", ()=>{
        let address = "sand1z9dwjn0nhs79jk8gmhg278erpkh2pujq86e4qu";
        const decod = utils.decodeAddress(address);
        chai.expect(decod.toString("hex")).to.equal("115ae94df3bc3c5958e8ddd0af1f230daea0f240");
    });

    it("sould convert validator addresses", () => {
        const add = "sandvaloper1ahgdmnyh92xfls7pd8fwwkjwsyvfvdv063uee7";
        const orig = "sand1ahgdmnyh92xfls7pd8fwwkjwsyvfvdv0seelfd";
        const toAcc = utils.convertValAddressToAccAddress(add).toString();
        const toVal = utils.convertAccAddressToValAddress(orig).toString()
        
        chai.expect(toAcc).to.equal(orig);
        chai.expect(toVal).to.equal(add);
    });

    it("should encode a proposer address", () => {
        let address = "05831E167533ED4083EEA1C22E78123F71F27C87";
        const consAddr = utils.encodeAddress(address, 'sandvalcons');

        chai.expect(consAddr.toString()).to.equal('sandvalcons1qkp3u9n4x0k5pqlw58pzu7qj8aclyly8hgfnll');
    });

    it("should generate address from mnemonic", () => {
        const mnemonic = "offer caution gift cross surge pretty orange during eye soldier popular holiday mention east eight office fashion ill parrot vault rent devote earth cousin";
        const masterKey = utils.deriveMasterKeySync(mnemonic);
        const keypair = utils.deriveKeypair(masterKey);
        const address = utils.getAddressFromPrivateKey(keypair.privateKey);
        chai.expect(address.toString()).to.equal("sand18j94qw97ag42lg6uany20gma2y3uwfluhj04mc");
    });

    it('should decode transaction hash', async () => {
        const encodedHash = "swEoKBapCjuoo2GaChTt0N3MlyqMn8PBadLnWk6BGJY1jxIUye4IJCSEA2qDUCFEY2MV9F57GIIaCQoDc2JjEgIxMBIEEMCaDBpqCibrWumHIQM9ytfgIIPWQYHSxp5yDzSsyq9xs4IuujEgyN1ka/yZmhJACNOVWFucRrIKjOSpS3MllxoohZ+1BlEPCEQfBbGkNaEsI1fVeLhmo1uqe43l9LXMq5X2S3ZdyU3aswrkNNe6kg==";
        const hash = "F85D2BE0D637DBF5BE902F01B4DF963299013A0DE601EF6E47814BC726A1DDDF";

        const decoded = utils.decodeTransactionHash(encodedHash);
        chai.expect(decoded).to.equal(hash);
    });

    it('should generate a private key from mnemonic then get the address and public key', () => {
        const mnemonic = utils.generateMnemonic();
        
        // First we generate with the old way
        const masterKey = utils.deriveMasterKeySync(mnemonic.toString());
        const first_keypair = utils.deriveKeypair(masterKey);

        // Then we derivate the private key from the mnemonic
        const second_private = utils.getPrivateKeyFromMnemonic(mnemonic, true, 0, Buffer.from(''));
        const second_keypair = utils.getKeypairFromPrivateKey(second_private);

        // We expect all parameters to match
        chai.expect(first_keypair.publicKey.toString('hex')).to.equal(second_keypair.publicKey.toString('hex'));
        chai.expect(first_keypair.privateKey.toString('hex')).to.equal(second_keypair.privateKey.toString('hex'));
    });
});
