import React, { useEffect, useState } from 'react';
import { gql, request } from 'graphql-request';
import { useLocation } from 'react-router-dom';
import { ethers } from 'ethers';
import { contractABI } from '../../constants/ABI';

const contractAddress = '0x954621368d89eb96fb5da8df0de5640a483c4391';
const url = 'https://api.studio.thegraph.com/query/87341/insurancetest/v0.0.8';

const ClaimsRejected = () => {
  const [myClaims, setMyClaims] = useState([]);
  const [walletAddress, setWalletAddress] = useState('');
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);

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

          // Initialize contract
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
    // Fetch claims once wallet address is available
    const fetchClaimList = async () => {
      if (!walletAddress) return;

      // Define the GraphQL query to fetch submitted claims
      const dynamicQuery = gql`
        {
          claimRejecteds(where: { claimant: "${walletAddress.toLowerCase()}" }) {
            id
            policyId
            claimId
            claimant
            coverageAmount
          }
        }
      `;

      try {
        const response = await request(url, dynamicQuery);
        const { claimSubmitteds } = response;

        // Set the claims to state
        setMyClaims(claimSubmitteds);
      } catch (error) {
        console.error("Error fetching claims:", error);
      }
    };

    fetchClaimList();
  }, [walletAddress]);

  return (
    <div className="container  p-4">
      <h1 className="text-3xl font-bold mb-8">Submitted Claims</h1>
      <ClaimList claims={myClaims} />
    </div>
  );
};

const ClaimList = ({ claims }) => {
  return (
    <div className="flex flex-wrap justify-center">
      {claims.map((claim) => (
        <ClaimCard key={claim.id} claim={claim} />
      ))}
    </div>
  );
};

const ClaimCard = ({ claim }) => {
  return (
    <div className="max-w-sm rounded overflow-hidden shadow-lg bg-white m-4 p-4">
      <div className="font-bold text-xl mb-2">
        Claim ID: {claim.claimId}
      </div>
      <p className="text-gray-700 text-base">Policy ID: {claim.policyId}</p>
      <p className="text-gray-700 text-base">Claimed By: {claim.claimant}</p>
      <p className="text-gray-700 text-base">Coverage Amount : {claim.coverageAmount} wei</p>
    </div>
  );
};

export default ClaimsRejected;
