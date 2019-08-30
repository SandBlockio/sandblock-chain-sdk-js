import "regenerator-runtime/runtime";
import * as chai from 'chai';
import TransportU2F from '@ledgerhq/hw-transport-u2f';
import TransportWebUSB from '@ledgerhq/hw-transport-webusb';
import TransportHid from "@ledgerhq/hw-transport-node-hid";
import SandblockApp from "../src/utils/ledger";

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

    it('should get the address', async () => {
        const transport = await initTransport();
        chai.expect(transport).to.be.ok;
        const app = new SandblockApp(transport);

        const path = [44, 118, 0, 0, 0];
        const response = await app.getAddressAndPubKey(path, 'sand');
        chai.expect(response.return_code).to.equal(0x9000);
        chai.expect(response.bech32_address).to.be.ok;
        chai.expect(response.compressed_pk).to.be.ok;
    });

    it('should sign a msg', async () => {
        const transport = await initTransport();
        chai.expect(transport).to.be.ok;
        const app = new SandblockApp(transport);

        const path = [44, 118, 0, 0, 0];
        const message = '{"account_number":"6571","chain_id":"cosmoshub-2","fee":{"amount":[{"amount":"5000","denom":"uatom"}],"gas":"200000"},"memo":"Delegated with Ledger from union.market","msgs":[{"type":"cosmos-sdk/MsgDelegate","value":{"amount":{"amount":"1000000","denom":"uatom"},"delegator_address":"cosmos102hty0jv2s29lyc4u0tv97z9v298e24t3vwtpl","validator_address":"cosmosvaloper1grgelyng2v6v3t8z87wu3sxgt9m5s03xfytvz7"}}],"sequence":"0"}';
        const response = await app.sign(path, message);
        chai.expect(response.return_code).to.equal(0x9000);
        //@ts-ignore
        chai.expect(response.signature).to.be.ok;
    });
});
