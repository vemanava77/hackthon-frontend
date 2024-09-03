export const policyList = {
    "policyTypes": [
        {
            "0": "Flight Delay",
            "desc": "This policy is for Flight Delays"
        },
        {
            "1": "Flight Cancellation",
            "desc": "This policy is for Flight Cancellation"
        },
        {
            "2": "Flight Accident",
            "desc": "This policy is for Flight Accidents"
        },
    ]
};

export const convertoETH = (wei) => {
    const eth = wei/1e18;
    return `${eth} ETH`;
};