## Omneon.XYZ

**Omneon** is a decentralized lending protocol on **IOTA Rebased** that integrates AI-personalized intelligence. Users can supply or borrow assets with interest rates that adjust dynamically based on pool utilization. Real-time price feeds are secured by **Pyth Oracle**, while having AI-agents provide personalized insights, sending email updates and alerts when loan or collateral positions require attention.

By leveraging the power of AI, we enhance a lending platform that is more efficient and secure while maintaining a high degree of decentralization over user funds.

- [YouTube](https://youtu.be/DL0BbF2az9U)
- [Dapp](https://omneon.xyz)

## Highlighted Features
- Live on IOTA Rebased Testnet. Currently supports lending pools for **IOTA** and **vUSD** assets.  
- Utilizes a dual-slope interest rate model based on pool utilization:  
  - Low utilization → stable, low rates  
  - High utilization → exponentially increasing rates

- Uses **Pyth Oracle** for real-time, on-chain price feeds used in Loan Health and LTV calculations.

- Uses **Claude AI** to interpret on-chain data into personalized, human-readable recommendations.

## System Overview

The project follows the **AWS Amplify** stack for full-stack development as code.  It uses **Next.js** for the frontend and **AWS Lambda** functions for backend processing. Smart contracts are located seperately in the `/contracts` folder.

### The system consists of 3 main subsystems:

1. **AI Notifications**  
   - Fetches on-chain data using the **IOTA TypeScript SDK**  
   - Uses **LangChain LangGraph** to prepare prompts for **Claude AI**  
   - Claude interprets the data into readable recommendations  
   - Sends emails via **AWS SES** to subscribed users

2. **Lending System**  
   - Built with **IOTA Move** smart contracts  
   - Supports a lending pool that issues share tokens when assets are supplied  
   - Share token value increases over time from accrued interest  
   - Borrowers must repay loans with interest

3. **Staking System**  
   - Also built with **IOTA Move**  
   - Implements the **Omneon Token** with a staking mechanism  
   - Token has a max supply of **1 billion**  
   - On mint:  
     - **50%** goes to staking pool automatically
     - **50%** goes to the treasury for community airdrops, team allocation, and future initiatives

## AI Notifications ## 

We use AI with **Claude AI** for smart email notifications on the backend. These notifications are triggered either on a scheduled basis or through manual test calls. 

We have a **LangChain ReAct Agent** (ReAct: *Synergizing Reasoning and Acting in Language Models*) to process on-chain data. This agent uses a structured system prompt to convert JSON data into meaningful HTML content for emails.

The following is the system prompt used to guide the AI agent. 

```
You are a helpful assistant to interpret JSON data from a DeFi lending protocol and generate HTML content for sending emails to users. Your role is to analyze user-specific data and present it clearly and effectively via email, helping users understand their current lending and borrowing status.

Core Tasks:

1. Summarize each market, including stats such as utilization rate, total supply, total borrow, and interest rates.

2. For any market with an activePosition (i.e., user has borrowed), summarize the position:

  - Show borrowed amount, collateral value, and health factor.

  - Highlight if the health factor is below a safe threshold (e.g., <1.25).

Rules:

1. Format the output in clean, semantic HTML for email delivery.

2. Use clear, user-friendly language (avoid technical jargon).

3. Emphasize critical info using bold text or color cues.

4. Do not fabricate data — only display what's in the JSON.
```

Once the HTML output is generated, the Lambda backend sends the email via the AWS SES service. 

Since AWS SES requires email addresses to be verified before sending, a verification email is sent during registration. However, this process is not automated at the moment. If you'd like to receive notifications, please contact us so we can manually verify your email.

## Lending Pool 

The lending pool is the core component of Omneon's DeFi lending protocol, built on IOTA Move. It enables users to supply assets, borrow against collateral, and earn interest in a secure, efficient manner.

### Core Parameters

| Parameter | Description |
|-----------|-------------|
| LTV (Loan-to-Value) | Maximum percentage of collateral value that can be borrowed |
| Liquidation Threshold | The point at which a position becomes eligible for liquidation |
| Liquidation Bonus | Additional collateral percentage awarded to liquidators |
| Reserve Factor | Percentage of interest that goes to protocol reserves |
| Base Rate | Minimum interest rate when utilization is 0% |
| Slope1 | Rate of increase before optimal utilization |
| Slope2 | Rate of increase after optimal utilization (steeper) |

### Smart Contract Structure

The lending pool implementation includes the following key components:

- `POOL<X, Y>`: Generic pool structure supporting any asset pair
- Interest rate model with utilization-based calculations
- Collateralization and liquidation mechanisms
- Share token system for representing supplied assets

### Future Enhancements

- Flash loan functionality
- Governance-controlled parameter adjustment
- Multi-asset collateralization
- Interest rate model optimization through AI analytics

## Staking

Lenders who supply assets to Omneon lending pools receive share tokens representing their portion of the lending pool. These share tokens can then be staked to earn Omneon (OMN) token rewards, creating additional yield on top of the standard lending interest.

### How Staking Works

1. **Share Token Staking**: When you supply assets to a lending pool, you receive share tokens. These tokens can be staked directly through the staking interface.

2. **Reward Distribution**: Stakers earn OMN tokens proportional to:
   - The amount of share tokens staked
   - The duration of staking
   - The specific reward rate for each asset type

3. **Reward Calculation**: Rewards accrue continuously based on time-weighted participation in the staking pools.

4. **Flexible Options**: Users can:
   - Stake and unstake at any time
   - Claim rewards without unstaking
   - View real-time APY information

### Tokenomics

The planned Omneon token (OMN) follows a fair-launch model with no pre-sales or investor allocations:

- **Total Supply**: 1,000,000,000 OMN
- **Staking Rewards**: 50% of total supply
- **Community Treasury**: 30% of total supply
- **Core Team**: 15% of total supply
- **Protocol Launch**: 5% of total supply

## How to Test

The project is built using the AWS Amplify Stack with Next.js for the frontend. All backend configurations are managed inside the `/amplify` folder. When the GitHub repo is updated, AWS automatically deploys services like real-time databases and APIs. 

However, outside of this stack, we also have a Move smart contract that handles all lending/staking processes. To run the system locally after downloading:

```
npm install
```

You must retrieve `amplify_outputs.json` from the AWS Dashboard after linking your GitHub repo to AWS and place it in the root folder. 

Also, make sure to obtain API keys from the AI services we use and add them to the secret management in the AWS Amplify console.

We can run the frontend with:

```
npm run dev
```

For the smart contract, navigate to `/contracts/omneon` and run test cases with:

```
iota move test
```

Refer to the documentation for deploying a new contract on the live network and updating the JSON file in the project accordingly. 

## Deployment

### IOTA Rebased Testnet

Component Name | ID/Address
--- | --- 
Package ID |  0x0c0b0216de041640f43657028dffd70f35f6528623d6751a190d282c05253c64
Lending Global State | 0x1b48d0219088beb4bace0f978c0b88ff84d88891ba5dc419aade04e40f4b3c87
Mock vUSD Global State | 0x9bd14ab92d3076d98dff360c08ad5e3b61dabe71889abce36628ee6e0cc28f1c
Mock vUSD Type | 0x0c0b0216de041640f43657028dffd70f35f6528623d6751a190d282c05253c64::mock_vusd::MOCK_VUSD
AdminCap | 0xe7560ac3ea0415ec1913d2046b63df6ba9b104c17b6db3333d8e361146e2a750
Pyth IOTA/USD Price State | 0x0a728e3d95fd5d26b1ba68f372cbd0162b0e0ea978b87af771b38a188faca142
Staking Global State | 0x9cc7f40a3375a4dee8a6a95b99dace6c50564910b2c607c66d9241ced461946c
Staking Admincap | 0xf7ca03c89caa9b6f939bbfd16732e5fcfa9c90a2f05a2aed32ebdf081be2d5f2
Omneon Token | 0x05b4c48658ea6aa63c9e847f6421cf7e903f9ae58eb5233597e460ad869fda7f::omneon::OMNEON

## License

This library is licensed under the MIT-0 License. See the LICENSE file.
