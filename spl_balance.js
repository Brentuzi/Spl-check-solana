const fs = require('fs');
const web3 = require('@solana/web3.js');
const { TOKEN_PROGRAM_ID } = require('@solana/spl-token');

const RPC_URL = "https://api.mainnet-beta.solana.com";
const connection = new web3.Connection(RPC_URL, "confirmed");
const walletFile = 'wallets.txt';

async function getTokenAccountInfo(walletAddress) {
  try {
    const publicKey = new web3.PublicKey(walletAddress);
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, { programId: TOKEN_PROGRAM_ID });

    let tokensInfo = [];
    for (const { account } of tokenAccounts.value) {
      const { mint, tokenAmount } = account.data.parsed.info;
      tokensInfo.push({
        mint: mint,
        amount: tokenAmount.uiAmount,
        decimals: tokenAmount.decimals
      });
    }
    return tokensInfo;
  } catch (error) {
    console.error('Error fetching token accounts:', error);
    return [];
  }
}

async function main() {
  const walletAddresses = fs.readFileSync(walletFile, 'utf-8').split('\n').filter(line => line.trim().length > 0);
  let totalTokens = {};

  for (const walletAddress of walletAddresses) {
    const tokensInfo = await getTokenAccountInfo(walletAddress.trim());
    console.log('Кошелек', walletAddress);
    for (const { mint, amount, decimals } of tokensInfo) {
      console.log(`${mint} ${(amount || 0).toLocaleString('en-US', { maximumFractionDigits: decimals })}`);
      // Суммируем токены по каждому типу
      totalTokens[mint] = (totalTokens[mint] || 0) + amount;
    }
    console.log('');
  }

  console.log('Общее количество токенов на всех кошельках:');
  for (const [mint, amount] of Object.entries(totalTokens)) {
    console.log(`${mint}: ${amount}`);
  }
}

main();
