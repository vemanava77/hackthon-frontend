import React from 'react';

const Policy = ({ policy }) => (
  <div className="policy-card border p-4 mb-4 rounded shadow">
    <h3 className="text-xl font-semibold">Policy ID: {policy.policyId}</h3>
    <p><strong>Coverage:</strong> {policy.coverage}</p>
    <p><strong>Expiration Date:</strong> {new Date(parseInt(policy.expirationDate) * 1000).toLocaleDateString()}</p>
    <p><strong>Provider:</strong> {policy.provider}</p>
    <p><strong>Premium:</strong> {policy.premium}</p>
    <p><strong>Timestamp:</strong> {new Date(parseInt(policy.timestamp) * 1000).toLocaleDateString()}</p>
    <p><strong>Transaction Hash:</strong> {policy.transactionHash}</p>
  </div>
);

export default Policy;
