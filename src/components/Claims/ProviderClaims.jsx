import React, { useEffect, useState } from 'react';
import { gql, request } from 'graphql-request';
import { ethers } from 'ethers';
import { contractABI } from '../../constants/ABI';

const contractAddress = '0x607cCF60493A51c61D86f4616E93014DB9e32b77';
const url = 'https://api.studio.thegraph.com/query/87341/insurancetest/v0.0.4';

const MyClaims = () => {
  const [claims, setClaims] = useState({
    submitted: [],
    approved: [],
    rejected: []
  });
  const [walletAddress, setWalletAddress] = useState('');
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);

  useEffect(() => {

    const connectContract = async () => {
      try {
        // Request account access if needed
        await window.ethereum.request({ method: 'eth_requestAccounts' });

        // Create a provider and signer
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();

        // Create the contract instance
        const contract = new ethers.Contract(contractAddress, contractABI, signer);

        setContract(contract);
        setProvider(provider);
        setSigner(signer);
        console.log(contract);
      } catch (error) {
        console.error(error);

      }
    }

    connectContract();
  }, [])

  useEffect(() => {
    const fetchClaims = async () => {
      // Define the GraphQL queries to fetch submitted, approved, and rejected claims
      const dynamicQuery = gql`
        {
          claimSubmitteds {
            id
            policyId
            claimId
            claimant
            coverageAmount
          }
          claimApproveds {
            id
            policyId
            claimId
            claimant
          }
          claimRejecteds {
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

        setClaims({
          submitted: claimSubmitteds,
          approved: claimApproveds,
          rejected: claimRejecteds
        });
      } catch (error) {
        console.error("Error fetching claims:", error);
      }
    };

    fetchClaims();
  }, [walletAddress]);

  const handleApprove = async (claimId) => {
    try {
      if (contract) {
        const tx = await contract.approveClaim(claimId);
        await tx.wait();
        alert(`Claim ${claimId} approved successfully!`);
      }
    } catch (error) {
      console.error('Error approving claim:', error);
    }
  };

  const handleReject = async (claimId) => {
    try {
      if (contract) {
        const tx = await contract.rejectClaim(claimId);
        await tx.wait();
        alert(`Claim ${claimId} rejected successfully!`);
      }
    } catch (error) {
      console.error('Error rejecting claim:', error);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Submitted Claims</h2>
      <ClaimList claims={claims.submitted} onApprove={handleApprove} onReject={handleReject} showActions />
      <h2 className="text-2xl font-bold mb-4">Approved Claims</h2>
      <ClaimList claims={claims.approved} />
      <h2 className="text-2xl font-bold mb-4">Rejected Claims</h2>
      <ClaimList claims={claims.rejected} />
    </div>
  );
};

const ClaimList = ({ claims, onApprove, onReject, showActions }) => {
  return (
    <div className="flex flex-wrap justify-center">
      {claims.map((claim) => (
        <ClaimCard key={claim.claimId} claim={claim} onApprove={onApprove} onReject={onReject} showActions={showActions} />
      ))}
    </div>
  );
};

const ClaimCard = ({ claim, onApprove, onReject, showActions }) => {
  return (
    <div className="max-w-sm rounded overflow-hidden shadow-lg bg-white m-4 p-4">
      <div className="font-bold text-xl mb-2">
        Claim ID: {claim.claimId}
      </div>
      <p className="text-gray-700 text-base">Policy ID: {claim.policyId}</p>
      <p className="text-gray-700 text-base">Claimed by: {claim.claimant}</p>
      <p className="text-gray-700 text-base">Coverage Amount: {claim.coverageAmount}</p>
      {showActions && (
        <div className="flex justify-between mt-4">
          <button
            onClick={() => onApprove(claim.claimId)}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            Approve
          </button>
          <button
            onClick={() => onReject(claim.claimId)}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            Reject
          </button>
        </div>
      )}
    </div>
  );
};

export default MyClaims;
