import React, { useEffect, useState } from 'react';
import { gql, request } from 'graphql-request';
import { ethers } from 'ethers';
import { contractABI } from '../../constants/ABI';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './ProviderClaims.css';  // Import custom CSS for the component
import { convertoETH } from '../../constants/constants';

const contractAddress = '0x954621368d89eb96fb5da8df0de5640a483c4391';
const url = 'https://api.studio.thegraph.com/query/87341/insurancetest/v0.0.8';

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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const connectContract = async () => {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });

        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(contractAddress, contractABI, signer);

        setContract(contract);
        setProvider(provider);
        setSigner(signer);
      } catch (error) {
        console.error(error);
      }
    };

    connectContract();
  }, []);

  useEffect(() => {
    const fetchClaims = async () => {
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
            coverageAmount
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

  const filteredClaims = () => {
    const submitted = claims?.submitted.filter(
      (item) =>
        !claims?.approved.some((approvedItem) => approvedItem.claimId === item.claimId) &&
        !claims?.rejected.some((rejectedItem) => rejectedItem.claimId === item.claimId)
    );

    return submitted;

  };

  const handleApprove = async (claimId, address) => {
    try {
      setLoading(true);
      if (contract) {
        const tx = await contract.approveClaim(address, +claimId - 1);
        await tx.wait();
        setLoading(false);
        toast.success(`Claim ${claimId} approved successfully!`);
      }
    } catch (error) {
      setLoading(false);
      console.error('Error approving claim:', error);
      toast.error(`Failed to approve claim ${claimId}: ${error.message}`);
    }
  };

  const handleReject = async (claimId, address) => {
    try {
      setLoading(true);
      if (contract) {
        const tx = await contract.rejectClaim(address, +claimId - 1);
        await tx.wait();
        setLoading(false);
        toast.success(`Claim ${claimId} rejected successfully!`);
      }
    } catch (error) {
      setLoading(false);
      console.error('Error rejecting claim:', error);
      toast.error(`Failed to reject claim ${claimId}: ${error.message}`);
    }
  };

  return (
    <div className="p-6 bg-gradient-to-r from-purple-500 to-indigo-600 min-h-screen flex flex-col items-center">
      <h1 className="text-4xl font-bold text-white mb-10">Manage Claims</h1>
      <h2 className="text-3xl font-semibold text-white mb-6">Submitted Claims</h2>
      <ClaimList msg={"No claims ready for Approval/Rejection"} claims={filteredClaims()} onApprove={handleApprove} onReject={handleReject} showActions />
      <h2 className="text-3xl font-semibold text-white mt-10 mb-6">Approved Claims</h2>
      <ClaimList msg={"No Approved Claims"} claims={claims.approved} />
      <h2 className="text-3xl font-semibold text-white mt-10 mb-6">Rejected Claims</h2>
      <ClaimList msg={"No Rejected Claims"} claims={claims.rejected} />

      {loading && (
        <div className="loading-screen">
          <div className="loading-spinner"></div>
          <p className="loading-text">Processing Transaction...</p>
        </div>
      )}

      <ToastContainer position="bottom-right" autoClose={3000} />
    </div>
  );
};

const ClaimList = ({ msg, claims, onApprove, onReject, showActions }) => {
  return (
    <div className="flex flex-wrap justify-center">
      {/* Show message if claims are available */}
      {claims?.length > 0 ? (
        <>
          {claims.map((claim) => (
            <ClaimCard
              key={claim.claimId}
              claim={claim}
              onApprove={onApprove}
              onReject={onReject}
              showActions={showActions}
            />
          ))}
        </>
      ) : (
        <h1 className="flex justify-center text-xl font-bold text-gray-300 mb-10">{msg}</h1>
      )}
    </div>
  );
};

const ClaimCard = ({ claim, onApprove, onReject, showActions }) => {
  return (
    <div className="claim-card max-w-sm rounded-lg overflow-hidden shadow-lg bg-white m-4 p-6 transform hover:scale-105 transition-transform cursor-pointer">
      <div className="font-bold text-2xl mb-2 text-indigo-700">
        Claim ID: {claim.claimId}
      </div>
      <p className="text-gray-600 text-lg">Policy ID: {claim.policyId}</p>
      <p className="text-gray-600 text-lg">Claimed by: {claim.claimant}</p>
      <p className="text-gray-600 text-lg">Coverage Amount: {convertoETH(claim.coverageAmount)}</p>
      {showActions && (
        <div className="flex justify-between mt-6">
          <button
            onClick={() => onApprove(claim.claimId, claim.claimant)}
            className="action-button bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105"
          >
            Approve
          </button>
          <button
            onClick={() => onReject(claim.claimId, claim.claimant)}
            className="action-button bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105"
          >
            Reject
          </button>
        </div>
      )}
    </div>
  );
};

export default MyClaims;
