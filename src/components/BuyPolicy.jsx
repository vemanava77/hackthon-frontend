import React, { useState } from 'react';
import { ethers } from 'ethers';
import { contractABI } from '../constants/ABI';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './BuyPolicy.css';  // Import custom CSS for the component

const contractAddress = '0x954621368d89eb96fb5da8df0de5640a483c4391';

const BuyPolicy = ({ policyId, onClose }) => {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('');

    const buyPolicy = async () => {
        if (!window.ethereum) {
            setStatus('MetaMask is not installed');
            toast.error('MetaMask is not installed');
            return;
        }

        try {
            setLoading(true);
            setStatus('Connecting to MetaMask...');

            await window.ethereum.request({ method: 'eth_requestAccounts' });

            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            const contract = new ethers.Contract(contractAddress, contractABI, signer);

            const template = await contract.getPolicyTemplate(policyId);
            const premium = template.premium;

            const tx = await contract.buyPolicyFromProvider(policyId, { value: premium });
            setStatus('Transaction sent, waiting for confirmation...');

            await tx.wait();

            toast.success('Policy bought successfully!');
            setLoading(false);
            setStatus('Policy bought successfully!');
            onClose();  // Close the modal after successful purchase
        } catch (error) {
            setLoading(false);
            console.error(error);
            setStatus('Failed to buy policy: ' + error.message);
            toast.error('Failed to buy policy: ' + error.message);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-container">
                <div className="modal-header">
                    <h2 className="modal-title">Buy Policy</h2>
                    <button className="close-button" onClick={onClose}>&times;</button>
                </div>
                <div className="modal-body">
                    <label className="policy-id-label">{`Policy Id: ${policyId}`}</label>
                    <button className="buy-button" onClick={buyPolicy} disabled={loading}>
                        Buy Policy
                    </button>
                    <p className="status-message">{status}</p>
                </div>

                {loading && (
                    <div className="loading-screen">
                        <div className="loading-spinner"></div>
                        <p className="loading-text">Processing Transaction...</p>
                    </div>
                )}

                <ToastContainer position="bottom-right" autoClose={3000} />
            </div>
        </div>
    );
};

export default BuyPolicy;
