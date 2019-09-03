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
        const client = bootstrapClient();
        const transport = await initTransport();
        const path = [44, 118, 0, 0, 0];
        const tx = await client.transferUsingLedger(transport, path, "sand17gt85vkpsal48qed5ej93y43gmxrdqldvp2slu", "sbc", 1);
        
        chai.expect(tx).to.be.ok;
        chai.expect(tx.raw_log).to.be.ok;
        chai.expect(tx.txhash).to.be.ok;
    });
});
