import React, { useEffect, useState } from 'react';
import { gql, request } from 'graphql-request';
import { ethers } from 'ethers';
import { contractABI } from '../../constants/ABI';
import './MyClaims.css';  // Import custom CSS for the modal
import { convertoETH } from '../../constants/constants';

const contractAddress = '0x954621368d89eb96fb5da8df0de5640a483c4391';
const url = 'https://api.studio.thegraph.com/query/87341/insurancetest/v0.0.8';

const MyClaims = () => {
    const [claims, setClaims] = useState([]);
    const [walletAddress, setWalletAddress] = useState('');
    const [provider, setProvider] = useState(null);
    const [signer, setSigner] = useState(null);
    const [contract, setContract] = useState(null);
    const [selectedClaim, setSelectedClaim] = useState(null);

    useEffect(() => {
        const getWalletAddress = async () => {
            if (typeof window.ethereum !== 'undefined') {
                try {
                    await window.ethereum.request({ method: 'eth_requestAccounts' });
                    const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
                    const signer = web3Provider.getSigner();
                    const address = await signer.getAddress();

                    setWalletAddress(address);
                    setProvider(web3Provider);
                    setSigner(signer);

                    const contract = new ethers.Contract(contractAddress, contractABI, signer);
                    setContract(contract);
                } catch (error) {
                    console.error('Error getting wallet address:', error);
                }
            } else {
                console.error('MetaMask is not installed');
            }
        };

        getWalletAddress();
    }, []);

    useEffect(() => {
        const fetchClaims = async () => {
            if (!walletAddress) return;

            const dynamicQuery = gql`
        {
          claimSubmitteds(where: { claimant: "${walletAddress.toLowerCase()}" }) {
            id
            policyId
            claimId
            claimant
            coverageAmount
          }
          claimApproveds(where: { claimant: "${walletAddress.toLowerCase()}" }) {
            id
            policyId
            claimId
            claimant
          }
          claimRejecteds(where: { claimant: "${walletAddress.toLowerCase()}" }) {
            id
            policyId
            claimId
            claimant
            
          }
        }
      `;

            try {
                const response = await request(url, dynamicQuery);
                const { claimSubmitteds, claimApproveds, claimRejecteds } = response;

                const claimsMap = {};

                claimSubmitteds.forEach((claim) => {
                    claimsMap[claim.claimId] = { ...claim, status: 'Submitted' };
                });

                claimApproveds.forEach((claim) => {
                    if (claimsMap[claim.claimId]) {
                        claimsMap[claim.claimId].status = 'Approved';
                    } else {
                        claimsMap[claim.claimId] = { ...claim, status: 'Approved' };
                    }
                });

                claimRejecteds.forEach((claim) => {
                    if (claimsMap[claim.claimId]) {
                        claimsMap[claim.claimId].status = 'Rejected';
                    } else {
                        claimsMap[claim.claimId] = { ...claim, status: 'Rejected' };
                    }
                });

                setClaims(Object.values(claimsMap));
            } catch (error) {
                console.error("Error fetching claims:", error);
            }
        };

        fetchClaims();
    }, [walletAddress]);

    const handleCardClick = (claim) => {
        setSelectedClaim(claim);
    };

    const closeModal = () => {
        setSelectedClaim(null);
    };

    return (
        <div className="p-6 bg-gradient-to-r from-green-400 to-blue-500 min-h-screen flex flex-col items-center">
            <h1 className="text-4xl font-bold text-white mb-10">My Claims</h1>
            {claims?.length > 0 ? (
                <>
                    <ClaimList claims={claims} onCardClick={handleCardClick} />
                    {selectedClaim && (
                        <ClaimModal claim={selectedClaim} onClose={closeModal} />
                    )}
                </>
            ) : (
                <h1 className="flex justify-center text-3xl font-bold text-white mt-20">
                    No Claims found for the User
                </h1>
            )}
        </div>
    );

};

const ClaimList = ({ claims, onCardClick }) => {
    return (
        <div className="flex flex-wrap justify-center">
            {claims.map((claim) => (
                <ClaimCard key={claim.claimId} claim={claim} onClick={() => onCardClick(claim)} />
            ))}
        </div>
    );
};

const ClaimCard = ({ claim, onClick }) => {
    return (
        <div
            className="claim-card max-w-sm rounded-lg overflow-hidden shadow-lg bg-white m-4 p-6 transform hover:scale-105 transition-transform cursor-pointer"
            onClick={onClick}
        >
            <div className="font-bold text-2xl mb-2 text-blue-700">
                Claim ID: {claim.claimId}
            </div>
            <p className="text-gray-600 text-lg">Policy ID: {claim.policyId}</p>
            <p className="text-gray-600 text-lg">Claimed by: {claim.claimant}</p>
            <p className="text-gray-600 text-lg">Coverage Amount: {convertoETH(claim.coverageAmount)}</p>
            <p className="text-gray-600 text-lg">Status: </p>
            {claim.status === 'Approved' && (
                <p className="text-green-600 text-lg">Approved</p>
            )}
            {claim.status === 'Rejected' && (
                <p className="text-red-600 text-lg">Rejected</p>
            )}
        </div>
    );
};

const ClaimModal = ({ claim, onClose }) => {
    return (
        <div className="modal-overlay">
            <div className="modal-container">
                <div className="modal-header">
                    <h2 className="modal-title">Claim Details</h2>
                    <button className="close-button" onClick={onClose}>&times;</button>
                </div>
                <div className="modal-body">
                    <p><strong>Claim ID:</strong> {claim.claimId}</p>
                    <p><strong>Policy ID:</strong> {claim.policyId}</p>
                    <p><strong>Claimant:</strong> {claim.claimant}</p>
                    <p><strong>Coverage Amount:</strong> {claim.coverageAmount}</p>
                    <p><strong>Status:</strong></p>
                    {claim.status === 'Approved' && (
                        <p className="text-green-600"><strong>Approved</strong></p>
                    )}
                    {claim.status === 'Rejected' && (
                        <p className="text-red-600"><strong>Rejected</strong></p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MyClaims;
