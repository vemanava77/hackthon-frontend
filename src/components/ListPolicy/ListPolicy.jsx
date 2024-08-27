import React from 'react';
import { gql, request } from 'graphql-request';
import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Policy from '../Policy/Policy'
const query = gql`
  {
    policyTemplateListeds(orderBy: id) {
      coverage
      expirationDate
      id
      policyId
      policyType
      provider
      premium
      timestamp
      transactionHash
    }
  }
`;

const url = 'https://api.studio.thegraph.com/query/87341/insurancetest/v0.0.2';

const  ListPolicy = () => {
  const { data, status } = useQuery({
    queryKey: ['policyTemplateListeds'],
    queryFn: async () => {
      const response = await request(url, query);
      return response.policyTemplateListeds;
    },
  });
  console.log(data)
  if (status === 'loading') return <div>Loading...</div>;
  if (status === 'error') return <div>Error occurred</div>;

  return (
    <div>
      {/* {data.map((policy) => (
        <Policy key={policy.id} policy={policy} />
      ))} */}
    </div>
  );
};

export default  ListPolicy 
