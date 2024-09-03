import React, { useEffect, useState } from 'react';
import { gql, request } from 'graphql-request';
import { ethers } from 'ethers';
import BuyPolicy from '../BuyPolicy';
import { useNavigate } from 'react-router-dom';
import ProviderClaims from '../Claims/ProviderClaims';
import { policyList, convertoETH } from '../../constants/constants.js';
import './ListPolicy.css';  // Import the custom CSS file

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

const url = 'https://api.studio.thegraph.com/query/87341/insurancetest/v0.0.8';

const ListPolicy = () => {
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [data, setPolicyList] = useState([]);
  const [walletAddress, setWalletAddress] = useState([]);
  const [showBuyPolicy, setShowBuyPolicy] = useState(false);
  const [selectedPolicyForBuy, setSelectedPolicyForBuy] = useState(null);

  const navigate = useNavigate();

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
    setSelectedPolicyForBuy(policy);
    setShowBuyPolicy(true);
  };

  const handleCloseBuyPolicy = () => {
    setShowBuyPolicy(false);
  };

  const handleMyPoliciesClick = () => {
    navigate('/myPolicies', { state: { policies: data.policyTemplateListeds } });
  };

  const handleMyClaimsClick = () => {
    navigate('/myClaims', { state: { policies: data.policyTemplateListeds } });
  };

  const handleBackClick = () => {
    setSelectedPolicy(false);
  }

  return (
    <div className="w-full p-6 bg-gradient-to-r from-blue-500 to-purple-600 min-h-screen flex flex-col items-center">
      {walletAddress === "0xA2fF19d07679E538b8ff4767ef6171Be0c6cCd22" ? (
        <div>
          <h1 className="text-5xl font-bold mb-10 text-white text-center">Claimed Policies</h1>
          <ProviderClaims />
        </div>
      ) : (
        <div className="w-full">
          <div className="flex justify-between items-center mb-8">
          <h2 className="text-4xl font-bold text-white mb-7">Travel Insurance Marketplace</h2>
            <div className="flex items-center mb-8">
              <button
                onClick={handleMyPoliciesClick}
                className="bg-blue-700 hover:bg-blue-900 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition duration-300 ease-in-out transform hover:scale-105 mr-3"
              >
                My Policies
              </button>
              <button
                onClick={handleMyClaimsClick}
                className="bg-blue-700 hover:bg-blue-900 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition duration-300 ease-in-out transform hover:scale-105"
              >
                My Claims
              </button>
            </div>
          </div>
          {!selectedPolicy && (
            <PolicyList policies={data?.policyTemplateListeds || []} onCardClick={handleCardClick} />
          )}
          {selectedPolicy && (
            <div className="mt-10">
              <h2 className="text-4xl font-bold text-white mb-6">Policy Details</h2>
              <button
                className="absolute top-20 left-4 text-black text-xl"
                onClick={handleBackClick}
              >
                ← Back
              </button>
              <PolicyCard selectedPolicyType={selectedPolicy} onClick={onBuyPolicyClick} />
            </div>
          )}
          {showBuyPolicy && (
            <BuyPolicy policyId={+selectedPolicyForBuy?.policyId - 1} onClose={handleCloseBuyPolicy} />
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

  const formatExpiryDate = (expirationDate) => {
    const currentDate = new Date();
    const formattedDate = new Date(
      currentDate.getTime() + (expirationDate || 0) * 1000);

    return formattedDate?.toLocaleDateString()
  };

  return (
    <div
      className="policy-card max-w-sm rounded-lg overflow-hidden shadow-lg bg-white m-4 p-6"
    >
      <div className="font-bold text-2xl mb-4 text-blue-700">
        {policyList["policyTypes"][policy.policyType][policy.policyType]}
      </div>
      <p className="text-gray-600 text-lg">Flight Number: BS-6070</p>
      <p className="text-gray-600 text-lg">Premium: {convertoETH(policy.premium)}</p>
      <p className="text-gray-600 text-lg">Coverage: {convertoETH(policy.coverage)}</p>
      <p className="text-gray-600 text-lg">Expiration Date: {formatExpiryDate(policy?.expirationDate)}</p>
      <button className='buy-button transform hover:scale-105 transition-transform cursor-pointer' onClick={() => onClick(policy)}>Select Policy</button>
    </div>
  );
};

const PolicyListCard = ({ policy, onClick }) => {
  return (
    <div
      className="policy-card max-w-sm rounded-lg overflow-hidden shadow-lg bg-white m-4 p-6 transform hover:scale-105 transition-transform cursor-pointer"
      onClick={() => onClick(policy)}
    >
      <div className="font-bold text-2xl mb-4 text-blue-700">
        {policyList["policyTypes"][policy.policyType][policy.policyType]}
      </div>
      <p className="text-gray-600 text-lg">Provider: Global Insurance Company</p>
      <p className="text-gray-600 text-lg">Description: {policyList["policyTypes"][policy.policyType]['desc']}</p>
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
    <>
      <h2 className="text-3xl font-bold text-white">Available Policies</h2>
      <div className="flex flex-wrap justify-center">
        {uniquePolicies.map((policy) => (
          <PolicyListCard key={policy.id} policy={policy} onClick={onCardClick} />
        ))}
      </div>
    </>

  );
};

export default ListPolicy;
