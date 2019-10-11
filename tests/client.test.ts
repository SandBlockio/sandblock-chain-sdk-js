import * as fs from 'fs';
import * as chai from 'chai';
import SandblockChainClient from '../src/client/index';
import { getPrivateKeyFromKeyStore, Fee } from '../src/utils';

const bootstrapClient: Function = (): SandblockChainClient => {
    const client = new SandblockChainClient(true);
    if (!fs.existsSync(__dirname + '/wallet.json')) {
        throw new Error('No wallet json file present on tests directory');
    }
    const keystore = fs.readFileSync(__dirname + '/wallet.json', 'utf8');
    const pk = getPrivateKeyFromKeyStore(keystore, 'caca');
    client.setPrivateKey(pk);
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

describe('client', () => {
    it('should init the class and fetch information', () => {
        const client = bootstrapClient();
        chai.expect(client).to.be.ok;
    });

    it('should generate an account', () => {
        const client = bootstrapClient();
        const res = client.createAccount();
        chai.expect(res.address).to.be.ok;
        chai.expect(res.address).to.be.ok;
        chai.expect(res.privateKey).to.be.ok;
        chai.expect(res.publicKey).to.be.ok;
    });

    it('should fetch balances of the account', async () => {
        const client = bootstrapClient();
        const accountPayload = await client.getAccount();
        chai.expect(accountPayload).to.be.ok;
        const account = accountPayload.result;

        chai.expect(accountPayload.code).to.be.ok;
        chai.expect(accountPayload.code).to.equal(200);
        chai.expect(account.address).to.be.ok;
        chai.expect(account.address).to.equal(client._address.toString());
    });

    it('should get the first ten blocks', async () => {
        const client = bootstrapClient();
        const blocks = await client.getBlocksBetween(1, 10);

        chai.expect(blocks).to.be.ok;
        chai.expect(blocks.result).to.be.ok;
        chai.expect(blocks.result.block_metas.length).to.equal(10);
    });

    it('should fetch the last fifty blocks', async () => {
        const client = bootstrapClient();
        const blocks = await client.getLastFiftyBlocks();

        chai.expect(blocks.code).to.be.ok;
        chai.expect(blocks.result).to.be.ok;
        chai.expect(blocks.code).to.equal(200);
        chai.expect(blocks.result.length).to.equal(50);
        chai.expect(blocks.result[0].id).to.be.ok;
    });

    it('should fetch the last block', async () => {
        const client = bootstrapClient();
        const block = await client.getLatestBlock();

        chai.expect(block.code).to.be.ok;
        chai.expect(block.code).to.equal(200);
        chai.expect(block.result).to.be.ok;
        chai.expect(block.result.id).to.be.ok;
    });

    it('should fetch a block at a given height', async () => {
        const client = bootstrapClient();
        const block = await client.getBlockAtHeight(10);

        chai.expect(block.code).to.be.ok;
        chai.expect(block.code).to.equal(200);
        chai.expect(block.result).to.be.ok;
        chai.expect(block.result.id).to.be.ok;
        chai.expect(parseInt(block.result.height)).to.equal(10);
    });

    it('should fetch the last fifty transactions', async () => {
        const client = bootstrapClient();
        const transactions = await client.getLastFiftyTransactions();

        chai.expect(transactions.code).to.be.ok;
        chai.expect(transactions.code).to.equal(200);
        chai.expect(transactions.result).to.be.ok;
        chai.expect(transactions.result[0].id).to.be.ok;

        if (transactions.result.length > 0) {
            const transaction = await client.getTransaction(transactions.result[0].hash);

            chai.expect(transaction.code).to.be.ok;
            chai.expect(transaction.code).to.equal(200);
            chai.expect(transaction.result).to.be.ok;
            chai.expect(transaction.result.hash).to.equal(transactions.result[0].hash);
            chai.expect(transaction.result.id).to.be.ok;
        }
    });

    it('should search for a transaction', async () => {
        const client = bootstrapClient();
        const transactions = await client.getLastFiftyTransactions();
        chai.expect(transactions.code).to.be.ok;
        chai.expect(transactions.code).to.equal(200);
        chai.expect(transactions.result).to.be.ok;
        chai.expect(transactions.result.length).to.be.above(0);

        const res = await client.search(transactions.result[0].hash);
        chai.expect(res.code).to.be.ok;
        chai.expect(res.code).to.equal(200);
        chai.expect(res.result).to.be.ok;
        chai.expect(res.result.type).to.equal('transaction');
        chai.expect(res.result.data).to.be.ok;
    });

    it('should search for a block', async () => {
        const client = bootstrapClient();
        const res = await client.search('50');

        chai.expect(res.code).to.be.ok;
        chai.expect(res.code).to.equal(200);
        chai.expect(res.result).to.be.ok;
        chai.expect(res.result.type).to.equal('block');
        chai.expect(res.result.data).to.be.ok;
    });

    it('should sign and broadcast a transfer transaction', async () => {
        const client = await bootstrapClient();
        const payload = await client.transfer('sand17gt85vkpsal48qed5ej93y43gmxrdqldvp2slu', 'sbc', 1, buildStdFee(), 'Sent using client');
        const tx = await client.dispatch(payload);

        chai.expect(tx).to.be.ok;
        chai.expect(tx.raw_log).to.be.ok;
        chai.expect(tx.txhash).to.be.ok;
    });

    it('should get the validators set', async () => {
        const client = bootstrapClient();
        const res = await client.getValidatorsSet();

        chai.expect(res).to.be.ok;
    });

    it('should get the staking validators', async () => {
        const client = bootstrapClient();
        const res = await client.getValidators();

        chai.expect(res).to.be.ok;
    });

    it('should get a given staking validator', async () => {
        const client = bootstrapClient();
        const res = await client.getValidators();
        chai.expect(res).to.be.ok;
        chai.expect(res.result).to.be.ok;
        chai.expect(res.result[0]).to.be.ok;

        const validator = await client.getValidator(res.result[0].operator_address);
        chai.expect(validator).to.be.ok;

        const delegations = await client.getValidatorDelegations(res.result[0].operator_address);
        chai.expect(delegations).to.be.ok;
    });

    it('should get the tendermint status', async () => {
        const client = bootstrapClient();
        const res = await client.getStatus();

        chai.expect(res).to.be.ok;
    });

    it('should sign and broadcast a delegate transaction', async () => {
        const client = await bootstrapClient();
        const payload = await client.delegate('sandvaloper1jakhxnfgh2mh59xaxpm7py4wvadkhe33l8w0pf', 'sbc', 12, buildStdFee(), 'coucou');
        const tx = await client.dispatch(payload);
    });
});
