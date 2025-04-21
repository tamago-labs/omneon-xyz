## Omneon.XYZ

Omneon is a decentralized lending protocol on IOTA Rebased that integrates AI-personalized intelligence. Users can supply or borrow assets with interest rates that adjust dynamically based on pool utilization. Real-time price feeds are secured by Pyth Oracle, while having AI-agents provide personalized insights, sending email updates and alerts when loan or collateral positions require attention.

By leveraging the power of AI, we enhance a lending platform that is more efficient and secure while maintaining a high degree of decentralization over user funds.

- [YouTube](https://youtu.be/DL0BbF2az9U)
- [Dapp](https://omneon.xyz)

## Highlighted Features
- Live on IOTA Rebased Testnet. Currently supports lending pools for **IOTA** and **vUSD** assets.  
  - IOTA requires vUSD as collateral  
  - vUSD requires IOTA as collateral

- Utilizes a dual-slope interest rate model based on pool utilization:  
  - Low utilization → stable, low rates  
  - High utilization → exponentially increasing rates

- Uses **Pyth Oracle** for real-time, on-chain price feeds used in Loan Health and LTV calculations.

- Uses **Claude AI** to interpret on-chain data into personalized, human-readable recommendations.  
  - Users can subscribe via email and link their wallet  
  - Loan health and LTV updates are sent in near real-time

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
