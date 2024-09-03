import React, { useEffect, useState } from 'react';
import { gql, request } from 'graphql-request';
import { useLocation } from 'react-router-dom';
import { ethers } from 'ethers';
import { contractABI } from '../../constants/ABI';
import './MyPolicies.css';  // Import custom CSS for the component
import { convertoETH } from '../../constants/constants';

const contractAddress = '0x954621368d89eb96fb5da8df0de5640a483c4391';
const url = 'https://api.studio.thegraph.com/query/87341/insurancetest/v0.0.8';

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
    const fetchPolicyList = async () => {
      if (!walletAddress) return;

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

        const policiesWithoutClaims = policyBoughts.filter(
          (policy) =>
            !claimSubmitteds.some(
              (claim) => claim.policyId === policy.policyId
            )
        );

        const enrichedPolicies = policiesWithoutClaims.map((policy) => {
          const fullPolicy = policiesList.find(
            (p) => p.policyType === policy.policyType
          );

          const currentDate = new Date();
          const expirationDate = new Date(
            currentDate.getTime() + (fullPolicy?.expirationDate || 0) * 1000
          );

          return {
            ...policy,
            coverage: convertoETH(fullPolicy?.coverage),
            expirationDate: expirationDate,
            premium: convertoETH(fullPolicy?.premium),
            provider: "Global Insurance Company",
          };
        });

        setMyPolicies(enrichedPolicies);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchPolicyList();
  }, [walletAddress, policiesList]);

  const handleClaimClick = async (policy) => {
    const currentDate = new Date();

    if (currentDate > policy.expirationDate) {
      alert('This policy has expired and cannot be claimed.');
      return;
    }

    try {
      if (contract) {
        const tx = await contract.submitClaim(policy.policyId, "YourEvidenceURI");

        alert('Transaction sent. Waiting for confirmation...');

        await tx.wait();

        alert('Claim submitted successfully!');
      } else {
        alert('Contract is not initialized.');
      }
    } catch (error) {
      console.error('Error submitting claim:', error);
    }
  };

  return (
    <div className="mx-auto p-6 bg-gradient-to-r from-green-400 to-blue-500 min-h-screen flex flex-col items-center">
      <h1 className="text-4xl font-bold text-white mb-10">My Policies</h1>
      {myPolicies?.length ? <PolicyList policies={myPolicies} onClaimClick={handleClaimClick} /> :  <h1 className="flex justify-center text-3xl font-bold text-white mt-20">No Policies found for the User</h1>}
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
    <div className="policy-card max-w-sm rounded-lg overflow-hidden shadow-lg bg-white m-4 p-6 transform hover:scale-105 transition-transform cursor-pointer">
      <div className="font-bold text-2xl mb-2 text-blue-700">
        Policy ID: {policy.policyId}
      </div>
      <p className="text-gray-600 text-lg">Policy Type: {policy.policyType}</p>
      <p className="text-gray-600 text-lg">Coverage: {policy.coverage}</p>
      <p className="text-gray-600 text-lg">Expiration Date: {policy.expirationDate.toLocaleDateString()}</p>
      <p className="text-gray-600 text-lg">Premium: {policy.premium}</p>
      <p className="text-gray-600 text-lg">Provider: {policy.provider}</p>
      <button
        onClick={() => onClaimClick(policy)}
        className="claim-button bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105 mt-4"
      >
        Claim
      </button>
    </div>
  );
};

export default MyPolicies;
