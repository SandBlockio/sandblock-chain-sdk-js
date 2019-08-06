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

        expect(accountPayload.code).toBeTruthy();
        expect(accountPayload.code).toBe(200);
        expect(account.address).toBeTruthy();
        expect(account.address).toBe(client._address);
    });

    it('fetch the last fifty blocks', async () => {
        const client = bootstrapClient();
        const blocks = await client.getLastFiftyBlocks();

        expect(blocks.code).toBeTruthy();
        expect(blocks.result).toBeTruthy();
        expect(blocks.code).toBe(200);
        expect(blocks.result.length).toBe(50);
        expect(blocks.result[0].id).toBeTruthy();
    });

    it('fetch the last block', async () => {
        const client = bootstrapClient();
        const block = await client.getLatestBlock();

        expect(block.code).toBeTruthy();
        expect(block.code).toBe(200);
        expect(block.result).toBeTruthy();
        expect(block.result.id).toBeTruthy();
    });

    it('fetch a block at a given height', async () => {
        const client = bootstrapClient();
        const block = await client.getBlockAtHeight(10);

        expect(block.code).toBeTruthy();
        expect(block.code).toBe(200);
        expect(block.result).toBeTruthy();
        expect(block.result.id).toBeTruthy();
        expect(block.result.height).toBe(10);
    });

    it('fetch the last fifty transactions', async () => {
        const client = bootstrapClient();
        const transactions = await client.getLastFiftyTransactions();

        expect(transactions.code).toBeTruthy();
        expect(transactions.code).toBe(200);
        expect(transactions.result).toBeTruthy();
        expect(transactions.result[0].id).toBeTruthy();

        if(transactions.result.length > 0) {
            const transaction = await client.getTransaction(transactions.result[0].hash);

            expect(transaction.code).toBeTruthy();
            expect(transaction.code).toBe(200);
            expect(transaction.result).toBeTruthy();
            expect(transaction.result.hash).toBe(transactions.result[0].hash);
            expect(transaction.result.id).toBeTruthy();
        }
    });

    it('search for a transaction', async () => {
        const client = bootstrapClient();
        const transactions = await client.getLastFiftyTransactions();
        expect(transactions.code).toBeTruthy();
        expect(transactions.code).toBe(200);
        expect(transactions.result).toBeTruthy();
        expect(transactions.result.length).toBeGreaterThan(0);


        const res = await client.search(transactions.result[0].hash);
        expect(res.code).toBeTruthy();
        expect(res.code).toBe(200);
        expect(res.result).toBeTruthy();
        expect(res.result.type).toBe('transaction');
        expect(res.result.data).toBeTruthy();
    });

    it('search for a block', async () => {
        const client = bootstrapClient();
        const res = await client.search('50');

        expect(res.code).toBeTruthy();
        expect(res.code).toBe(200);
        expect(res.result).toBeTruthy();
        expect(res.result.type).toBe('block');
        expect(res.result.data).toBeTruthy();
    });
});
