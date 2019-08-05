import { crypto } from '../src';
import fs from 'fs';
import SandblockChainClient from '../src';

const bootstrapClient = () => {
    const client = new SandblockChainClient(true);
    if(!fs.existsSync(__dirname + '/wallet.json')){
        throw new Error('No wallet json file present on tests directory');
    }
    const keystore = fs.readFileSync(__dirname + '/wallet.json', 'utf8');
    const pk = crypto.getPrivateKeyFromKeyStore(keystore, "caca");
    client.setPrivateKey(pk);
    return client;
}

describe('apiclient', () => {
    it('init the class and fetch informations', () => {
        const client = bootstrapClient();
        expect(client).toBeTruthy();
    });

    it('generate an account', () => {
        const client = bootstrapClient();
        const res = client.createAccount();
        expect(res.address).toBeTruthy();
        expect(res.privateKey).toBeTruthy();
        expect(res.publicKey).toBeTruthy();
    });

    it('fetch balances of the account', async () => {
        const client = bootstrapClient();
        const accountPayload = await client.getAccount();
        const account = accountPayload.result;
        
        expect(accountPayload.code).toBe(200);
        expect(account.address).toBe(client._address);
    });
});
