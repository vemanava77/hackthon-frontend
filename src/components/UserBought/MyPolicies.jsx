import React, { useEffect, useState } from 'react';
import { gql, request } from 'graphql-request';
import { useLocation } from 'react-router-dom';
import { ethers } from 'ethers';
import { contractABI } from '../../constants/ABI';


const contractAddress = '0x607cCF60493A51c61D86f4616E93014DB9e32b77';

const url = 'https://api.studio.thegraph.com/query/87341/insurancetest/v0.0.4';

const MyPolicies = () => {
  const [myPolicies, setMyPolicies] = useState([]);
  const [walletAddress, setWalletAddress] = useState('');
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);

  const location = useLocation();
  const policiesList = location.state?.policies || [];

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
  }, [contractAddress, contractABI]);

  useEffect(() => {
    // Fetch policies once wallet address is available
    const fetchPolicyList = async () => {
      if (!walletAddress) return;
  
      // Define the GraphQL query to fetch policies and claims separately
      const dynamicQuery = gql`
        {
          policyBoughts(where: { buyer: "${walletAddress.toLowerCase()}" }) {
            id
            policyId
            policyType
            buyer
          }
          claimSubmitteds {
            id
            policyId
            claimId
            claimant
          }
        }
      `;
  
      try {
        const response = await request(url, dynamicQuery);
        const { policyBoughts, claimSubmitteds } = response;
  
        // Filter policies that do not have a corresponding claim submitted
        const policiesWithoutClaims = policyBoughts.filter(
          (policy) =>
            !claimSubmitteds.some(
              (claim) => claim.policyId === policy.policyId
            )
        );
  
        // Enrich the policies with additional information
        const enrichedPolicies = policiesWithoutClaims.map((policy) => {
          const fullPolicy = policiesList.find(
            (p) => p.policyType === policy.policyType
          );
  
          // Calculate the expiration date by adding the expiration seconds to the current date
          const currentDate = new Date();
          const expirationDate = new Date(
            currentDate.getTime() + (fullPolicy?.expirationDate || 0) * 1000
          );
  
          return {
            ...policy,
            coverage: fullPolicy?.coverage,
            expirationDate: expirationDate, // Store Date object for easier comparison
            premium: fullPolicy?.premium,
            provider: fullPolicy?.provider,
          };
        });
  
        // Set the policies without submitted claims to state
        setMyPolicies(enrichedPolicies);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
  
    fetchPolicyList();
  }, [walletAddress, policiesList]);
  

  const handleClaimClick = async (policy) => {
    const currentDate = new Date();

    // Check if the policy is expired
    if (currentDate > policy.expirationDate) {
      alert('This policy has expired and cannot be claimed.');
      return;
    }

    try {
      if (contract) {
        // Submit the claim using the smart contract function
        const tx = await contract.submitClaim(policy.policyId, "YourEvidenceURI");

        alert('Transaction sent. Waiting for confirmation...');

        // Wait for the transaction to be confirmed
        await tx.wait();

        alert('Claim submitted successfully!');
      } else {
        alert('Contract is not initialized.');
      }
    } catch (error) {
      console.error('Error submitting claim:', error);
      alert(`Failed to submit claim: ${error.message}`);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8">My Policies</h1>
      <PolicyList policies={myPolicies} onClaimClick={handleClaimClick} />
    </div>
  );
};

const PolicyList = ({ policies, onClaimClick }) => {
  return (
    <div className="flex flex-wrap justify-center">
      {policies.map((policy) => (
        <PolicyCard key={policy.id} policy={policy} onClaimClick={onClaimClick} />
      ))}
    </div>
  );
};

const PolicyCard = ({ policy, onClaimClick }) => {
  return (
    <div className="max-w-sm rounded overflow-hidden shadow-lg bg-white m-4 p-4">
      <div className="font-bold text-xl mb-2">
        Policy ID: {policy.policyId}
      </div>
      <p className="text-gray-700 text-base">Policy Type: {policy.policyType}</p>
      <p className="text-gray-700 text-base">Coverage: {policy.coverage}</p>
      <p className="text-gray-700 text-base">Expiration Date: {policy.expirationDate.toLocaleDateString()}</p>
      <p className="text-gray-700 text-base">Premium: {policy.premium}</p>
      <p className="text-gray-700 text-base">Provider: {policy.provider}</p>
      <button
        onClick={() => onClaimClick(policy)}
        className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        Claim
      </button>
    </div>
  );
};

export default MyPolicies;
