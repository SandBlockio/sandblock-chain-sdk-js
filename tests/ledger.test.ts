import "regenerator-runtime/runtime";
import * as chai from 'chai';
import { signatureImport } from 'secp256k1';
import * as utils from '../src/utils';
import TransportU2F from '@ledgerhq/hw-transport-u2f';
import TransportWebUSB from '@ledgerhq/hw-transport-webusb';
import TransportHid from "@ledgerhq/hw-transport-node-hid";
import SandblockApp from "../src/utils/ledger";
import SandblockChainClient from "../src/client";

let transport = null;
const initTransport = async () => {
    if(transport !== null){
        return transport;
    }

    try {
        //@ts-ignore
        transport = await TransportU2F.create(1000);
        return transport;
    } catch(error){}
    try {
        if(!transport){
            transport = await TransportWebUSB.create();
        }
    } catch(error){
    }
    try {
        if(!transport){
            transport = await TransportHid.create();
        }
    } catch(error){}

    return transport;
}

const bootstrapClient: Function = (): SandblockChainClient => {
    const client = new SandblockChainClient(true);
    return client;
}

describe('ledger', () => {
    before(async () =>{
        await initTransport();
    });
    it('should init and get version', async () => {
        const transport = await initTransport();
        chai.expect(transport).to.be.ok;
        const app = new SandblockApp(transport);

        const response = await app.getVersion();
        chai.expect(response.return_code).to.equal(0x9000);
    });

    it('should get the public key the old way', async () => {
        const transport = await initTransport();
        chai.expect(transport).to.be.ok;
        const app = new SandblockApp(transport);

        const path = [44, 118, 0, 0, 0];
        const response = await app.publicKey(path);
        chai.expect(response.return_code).to.equal(0x9000);
        chai.expect(response.pk).to.be.ok;
        chai.expect(response.compressed_pk).to.be.ok;
    });

    it('should get the address and public key', async () => {
        const transport = await initTransport();
        chai.expect(transport).to.be.ok;
        const app = new SandblockApp(transport);

        const path = [44, 118, 0, 0, 0];
        const response = await app.getAddressAndPubKey(path, 'sand');
        chai.expect(response.return_code).to.equal(0x9000);
        chai.expect(response.bech32_address).to.be.ok;
        chai.expect(response.compressed_pk).to.be.ok;
    });

    it('should sign and dispatch a msg using the builder', async () => {
        const transport = await initTransport();
        chai.expect(transport).to.be.ok;
        const app = new SandblockApp(transport);

        const isAppOpen = await app.isAppOpen();
        chai.expect(isAppOpen).to.be.equal(true);

        const path = [44, 118, 0, 0, 0];
        const address = await app.publicKey(path);
        chai.expect(address.return_code).to.equal(0x9000);

        /* Generate payload */
        const client = await bootstrapClient();
        client.setAddress(utils.getAddressFromPublicKey(address.compressed_pk));
        client.setPublicKey(address.compressed_pk);
        const fromAddress = client._address.toString();
        const toAddress = "sand17gt85vkpsal48qed5ej93y43gmxrdqldvp2slu";
        const account = (await client.getAccountLive(fromAddress)).result;
        chai.expect(account).to.be.ok;
        const stdTx = utils.buildStdTx([utils.buildSend([
            {
                "amount": "1",
                "denom": "sbc"
            }
        ], fromAddress, toAddress)], {
            "gas": "200000",
            "amount": [
                {
                    "amount": "1",//TODO: dynamize
                    "denom": "sbc"//TODO: dynamize
                }
            ]
        }, "Sent using unit test");
        const messageToSign = utils.createSignMessage(stdTx.value, {
            sequence: account.value.sequence,
            account_number: account.value.account_number,
            chain_id: client._chainId
        });

        /* Sign the message using ledger */
        const response: any = await app.sign(path, messageToSign);

        chai.expect(response.return_code).to.equal(0x9000);
        chai.expect(response.signature).to.be.ok;

        /* Add the signature on payload */
        const signature = utils.createSignature(signatureImport(response.signature), client._keypair.publicKey);
        const signedTx = utils.createSignedTx(stdTx.value, signature);
        const broadcastBody = utils.createBroadcastBody(signedTx, "sync");
        const dispatch = (await client.broadcastRawTransaction(broadcastBody));
        chai.expect(dispatch).to.be.ok;
        chai.expect(dispatch.logs).to.be.ok;
    });
});
