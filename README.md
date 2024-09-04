# Blockchain-Based Insurance Marketplace Backend

## Overview

This project is a decentralized insurance marketplace built on Ethereum, where users can buy insurance policies listed by providers. When a user purchases a policy, they receive an NFT representing that policy, and the premium amount is transferred from the user to the provider. Users can then submit claims, which the provider can approve or reject. If approved, the coverage amount is transferred to the user. Users can view all their purchased policies and claim statuses.

## Flow 
The diagram below illustrates the comprehensive flow of the decentralized insurance marketplace application:


![Flow of the Application](/src/assets/flow.png)
## Features

- **Buy Insurance Policy**: Users can purchase policies listed by providers. Upon purchase, an NFT is minted and sent to the user's wallet, and the premium amount is transferred to the provider.
- **Submit Claims**: Users can submit claims for their active policies. The claim must be approved by the provider for the user to receive the coverage amount.
- **Claim Approval/Rejection**: Providers can approve or reject claims. Approved claims result in the coverage amount being transferred to the user.
- **User Dashboards**: Users can view all their policies under "My Policies" and all their submitted claims under "My Claims."

## Technologies Used

### Blockchain & Smart Contracts
- **Solidity**: For writing smart contracts that manage policies, NFTs, and claims.
- **Ethereum**: The blockchain platform used for deploying and executing the smart contracts.
- **Sepolia Testnet**: A test network on Ethereum for safe contract deployment and testing.

### Frontend Development
- **React**: JavaScript library for building the user interface.
- **Tailwind CSS**: Utility-first CSS framework for styling the application.

### Data Indexing & Querying
- **The Graph**: Protocol for indexing and querying blockchain events, enabling efficient data retrieval.

### Development & Testing Tools
- **MetaMask**: Browser extension for Ethereum wallet management and dApp interaction.
- **Hardhat/Truffle**: Tools for smart contract development, testing, and deployment.




## Running the Project

### Prerequisites

1. **Node.js**: Ensure you have Node.js installed. You can download it from [Node.js official site](https://nodejs.org/).

2. **Truffle or Hardhat**: For deploying and interacting with smart contracts.

3. **MetaMask**: For interacting with the dApp in your browser.


### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/vemanava77/hackthon-frontend.git
   cd hackthon-frontend
   ```


2. **Install the dependencies**

    ```npm install```

3. **Run the Application**

    ```npm run dev```
4. **Deploy SmartContract** 

Download the Insurance.sol (solidity file ) and run deploy it using Truffle or Hardhat 
(for now we have left our contract adress in the code if you want to use your own contract you need to do the above )

5. If you deploy your own contract you need to connect it to your own subgraph
(we have already used our subgraph the API URl is present in the code )

6. If you want to deploy your own subgraph you can find all the files here
    [https://github.com/vemanava77/the-graph.git](https://github.com/vemanava77/the-graph.git)

once everything is done you can start exploring the features by doing the transaction from your metamask wallet


You can find the demo of the above app here 
[https://drive.google.com/file/d/1eXwMNlcEcNsF97YZOrNEauZf9HKgn5UV/view?usp=sharing](https://drive.google.com/file/d/1eXwMNlcEcNsF97YZOrNEauZf9HKgn5UV/view?usp=sharing)