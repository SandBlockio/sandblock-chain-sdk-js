import 'regenerator-runtime/runtime';
import * as chai from 'chai';
import TransportU2F from '@ledgerhq/hw-transport-u2f';
import TransportWebUSB from '@ledgerhq/hw-transport-webusb';
import TransportHid from '@ledgerhq/hw-transport-node-hid';
import SandblockApp from '../src/utils/ledger';
import SandblockChainClient from '../src/client';
import { Fee } from '../src/utils';

let transport = null;
const initTransport = async () => {
    if (transport !== null) {
        return transport;
    }
    try {
        if (!transport) {
            transport = await TransportHid.create();
        }
    } catch (error) {}

    return transport;
};

const bootstrapClient: Function = (): SandblockChainClient => {
    const client = new SandblockChainClient(true);
    return client;
};

const buildStdFee: Function = (): Fee => {
    return {
        gas: '20000',
        amount: [
            {
                amount: '1',
                denom: 'sbc'
            }
        ]
    };
};

describe('ledger', () => {
    before(async () => {
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

        await client.initLedgerMetas(transport, path);

        const payload = await client.transfer('sand17gt85vkpsal48qed5ej93y43gmxrdqldvp2slu', 'sbc', 1, buildStdFee(), 'Sent using Ledger');
        const tx = await client.dispatchWithLedger(payload, transport, path);

        chai.expect(tx).to.be.ok;
        chai.expect(tx.raw_log).to.be.ok;
        chai.expect(tx.txhash).to.be.ok;
    });
});
