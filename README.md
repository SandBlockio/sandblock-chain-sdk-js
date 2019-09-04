#### Sandblock Chain JS SDK

------------

👋 Welcome to the official Sandblock Chain Javascript SDK!

⚠️ This is beta software. Some features may not work as intended at the very beginning.

🤓 All contributions are more than welcome! Feel free to fork the repository and create a Pull Request!

------------

##### Project Architecture
The project is built using TypeScript. It offer client for both explorer API and blockchain API.

It also includes a lot of utils function to interact with wallets, keys and Ledger hardware wallet.

##### Usage
Feel free to have a look to the tests suite to have a look how to use the JS SDK.

##### Development
We are using Yarn as package manager.
Then, you can install the dependencies by typing
> $ yarn

###### Testing

We have written a lot of tests, that you can run by typing
> $ yarn test

In order to be able to run the tests you will need two things:

* A wallet.json file in the tests folder, which should be a keystore file with some SBC on it. (You can request some using testnet faucet)
* A Ledger connected to the computer, running the Sandblock App.
