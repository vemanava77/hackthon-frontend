import React, { useEffect, useState } from 'react';
import { gql, request } from 'graphql-request';
import { ethers } from 'ethers';
import { contractABI } from '../../constants/ABI';

const contractAddress = '0x607cCF60493A51c61D86f4616E93014DB9e32b77';
const url = 'https://api.studio.thegraph.com/query/87341/insurancetest/v0.0.4';

const MyClaims = () => {
  const [claims, setClaims] = useState([]);
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
    const fetchClaims = async () => {
      if (!walletAddress) return;

      // Define the GraphQL queries to fetch submitted, approved, and rejected claims
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

        // Merge claims by claimId
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
            claimsMap[claim.claimId] = { ...claim, status: 'Rejected'};
          }
        });

        // Convert the object back to an array
        setClaims(Object.values(claimsMap));
      } catch (error) {
        console.error("Error fetching claims:", error);
      }
    };

    fetchClaims();
  }, [walletAddress]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8">My Claims</h1>
      <ClaimList claims={claims} />
    </div>
  );
};

const ClaimList = ({ claims }) => {
  return (
    <div className="flex flex-wrap justify-center">
      {claims.map((claim) => (
        <ClaimCard key={claim.claimId} claim={claim} />
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
      <p className="text-gray-700 text-base">Claimed by: {claim.claimant}</p>
      <p className="text-gray-700 text-base">Coverage Amount {claim.coverageAmount}</p>
      <p className="text-gray-700 text-base">Status: {claim.status}</p>
      {claim.status === 'Approved' && (
        <p className="text-green-700 text-base">Approved</p>
      )}
      {claim.status === 'Rejected' && (
        <>
          <p className="text-red-700 text-base">Rejected</p>
          
        </>
      )}
    </div>
  );
};

export default MyClaims;
