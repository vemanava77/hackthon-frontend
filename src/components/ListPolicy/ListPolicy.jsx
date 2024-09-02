import React, { useEffect, useState } from 'react';
import { gql, request } from 'graphql-request';
import { ethers } from 'ethers';
import BuyPolicy from '../BuyPolicy';
import { useNavigate } from 'react-router-dom';
import ProviderClaims from '../Claims/ProviderClaims';


const query = gql`
  {
    policyTemplateListeds {
      id
      expirationDate
      coverage
      policyId
      policyType
      premium
      provider
    }
  }
`;

const url = 'https://api.studio.thegraph.com/query/87341/insurancetest/v0.0.4';

const ListPolicy = () => {
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [data, setPolicyList] = useState([]);
  const [walletAddress, setWalletAddress] = useState([]);
  const [showBuyPolicy, setShowBuyPolicy] = useState(false); // New state to control BuyPolicy rendering
  const [selectedPolicyForBuy, setSelectedPolicyForBuy] = useState(null); // State to hold policy data for BuyPolicy

  const navigate = useNavigate();

  // Fetch policy list when the component mounts
  useEffect(() => {
    const fetchPolicyList = async () => {
      try {
        const response = await request(url, query);
        setPolicyList(response);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchPolicyList();
  }, []);

  useEffect(() => {
    const getWalletAddress = async () => {
      if (typeof window.ethereum !== 'undefined') {
        try {
          await window.ethereum.request({ method: 'eth_requestAccounts' });
          const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
          const signer = web3Provider.getSigner();
          const address = await signer.getAddress();
          console.log("Addressssss", walletAddress);
          setWalletAddress(address);
        } catch (error) {
          console.error('Error getting wallet address:', error);
        }
      } else {
        console.error('MetaMask is not installed');
      }
    };

    getWalletAddress();
  }, []);

  const handleCardClick = (policy) => {
    const policies = data?.policyTemplateListeds?.filter((item) => item?.policyType === policy?.policyType);
    setSelectedPolicy(policies);
  };

  const onBuyPolicyClick = (policy) => {
    setSelectedPolicyForBuy(policy); // Set the policy for which BuyPolicy should render
    setShowBuyPolicy(true); // Show the BuyPolicy component
  };

  const handleCloseBuyPolicy = () => {
    setShowBuyPolicy(false); // Close the BuyPolicy component
  };

  const handleMyPoliciesClick = () => {
    navigate('/myPolicies', { state: { policies: data.policyTemplateListeds } });  // Navigate to MyPolicies and pass the policies
  };

  return (
    <div className="container mx-auto p-4">
      {walletAddress === "0xA2fF19d07679E538b8ff4767ef6171Be0c6cCd22" ? (
        <div>
          <h1 className="text-3xl font-bold mb-8">Claimed Policies</h1>
          <ProviderClaims/>
        </div>
      ) : (
        <div>
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Policies</h1>
            <button
              onClick={handleMyPoliciesClick}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              My Policies
            </button>
          </div>
          {!selectedPolicy && (
            <PolicyList policies={data?.policyTemplateListeds || []} onCardClick={handleCardClick} />
          )}
          {selectedPolicy && (
            <div className="mt-8">
              <h2 className="text-2xl font-bold">Policy Details</h2>
              <PolicyCard selectedPolicyType={selectedPolicy} onClick={onBuyPolicyClick} />
            </div>
          )}
          {showBuyPolicy && (
            <BuyPolicy policyId={selectedPolicyForBuy?.policyId} onClose={handleCloseBuyPolicy} />
          )}
        </div>
      )}
    </div>
  );
};

const PolicyCard = ({ selectedPolicyType, onClick }) => {
  return (
    <div className="flex flex-wrap justify-center">
      {selectedPolicyType.map((policy) => (
        <PolicyDetailsCard key={policy?.policyId} policy={policy} onClick={onClick} />
      ))}
    </div>
  );
};

const PolicyDetailsCard = ({ policy, onClick }) => {
  return (
    <div className="max-w-sm rounded overflow-hidden shadow-lg bg-white m-4 p-4">
      <div className="font-bold text-xl mb-2">
        Policy Type: {policy.policyType === 0 ? 'Flight Cancellation' : 'Flight.........'}
      </div>
      <p className="text-gray-700 text-base">Premium: {policy.premium}</p>
      <p className="text-gray-700 text-base">Coverage: {policy.coverage}</p>
      <p className="text-gray-700 text-base">Expiration Date: {policy.expirationDate}</p>
      <button
        onClick={() => onClick(policy)}
        className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        Buy Policy
      </button>
    </div>
  );
};

const PolicyListCard = ({ policy, onClick }) => {
  return (
    <div className="max-w-sm rounded overflow-hidden shadow-lg bg-white m-4 p-4">
      <div className="font-bold text-xl mb-2">
        Policy Type: {policy.policyType === 0 ? 'Flight Cancellation' : 'Unknown'}
      </div>
      <p className="text-gray-700 text-base">Premium: {policy.premium}</p>
      <p className="text-gray-700 text-base">Provider: {policy.provider}</p>
      <button
        onClick={() => onClick(policy)}
        className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        Buy Policy
      </button>
    </div>
  );
};

const PolicyList = ({ policies, onCardClick }) => {
  const uniquePolicies = policies.reduce((acc, current) => {
    const x = acc.find((policy) => policy.policyType === current.policyType);
    if (!x) {
      acc.push(current);
    }
    return acc;
  }, []);
  return (
    <div className="flex flex-wrap justify-center">
      {uniquePolicies.map((policy) => (
        <PolicyListCard key={policy.id} policy={policy} onClick={onCardClick} />
      ))}
    </div>
  );
};

export default ListPolicy;
