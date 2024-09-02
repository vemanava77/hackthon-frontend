import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { contractABI } from '../constants/ABI';


const contractAddress = '0x607cCF60493A51c61D86f4616E93014DB9e32b77';

const BuyPolicy = ({ policyId }) => {
    const [policies, setPolicies] = useState([]);
    const [status, setStatus] = useState('');

    const buyPolicy = async () => {
        if (!window.ethereum) {
            setStatus('MetaMask is not installed');
            return;
        }

        try {
            setStatus('Connecting to MetaMask...');

            // Request account access if needed
            await window.ethereum.request({ method: 'eth_requestAccounts' });

            // Create a provider and signer
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();

            // Create the contract instance
            const contract = new ethers.Contract(contractAddress, contractABI, signer);

            // Fetch the policy template to get the premium amount
            const template = await contract.getPolicyTemplate(policyId);
            const premium = template.premium;

            // Execute the buyPolicy function
            const tx = await contract.buyPolicyFromProvider(policyId, { value: premium });
            setStatus('Transaction sent, waiting for confirmation...');

            // Wait for the transaction to be confirmed
            await tx.wait();

            setStatus('Policy bought successfully!');
        } catch (error) {
            console.error(error);
            setStatus('Failed to buy policy: ' + error.message);
        }
    };

    return (
        <div>
            <h2>Buy Policy</h2>
            <label className='mr-4'>{`Policy Id: ${policyId}`}</label>
            <button onClick={buyPolicy}>Buy Policy</button>
            <p>{status}</p>

            <h2>Available Policies</h2>
            {policies.length > 0 ? (
                <ul>
                    {policies.map((policy, index) => (
                        <li key={index}>
                            <p>Policy ID: {index}</p>
                            <p>Provider: {policy.provider}</p>
                            <p>Premium: {ethers.utils.formatEther(policy.premium)} ETH</p>
                            <p>Coverage: {ethers.utils.formatEther(policy.coverage)} ETH</p>
                            <p>Expiration Date: {new Date(policy.expirationDate * 1000).toLocaleString()}</p>
                            <p>Description: {policy.description}</p>
                            <p>Policy Type: {PolicyType[policy.policyType]}</p>
                        </li>
                    ))}
                </ul>
            ) : (
                <p>No policies available</p>
            )}
        </div>
    );
};

const PolicyType = ['Delay', 'Cancellation', 'Accident'];

export default BuyPolicy;
