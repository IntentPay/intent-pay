import { privateKeyToAccount } from 'viem/accounts'
import { createWalletClient, http, encodeFunctionData, createPublicClient } from 'viem'
import { erc20Abi } from 'viem'
import { sepolia, avalancheFuji, baseSepolia } from 'viem/chains'
import axios from 'axios'
import 'dotenv/config'
import {
    SupportedChainId,
    CHAIN_TO_CHAIN_NAME,
    CHAIN_IDS_TO_USDC_ADDRESSES,
    CHAIN_IDS_TO_TOKEN_MESSENGER,
    CHAIN_IDS_TO_MESSAGE_TRANSMITTER,
    DESTINATION_DOMAINS,
    RPC_URL,
    DEFAULT_MAX_FEE,
    DEFAULT_FINALITY_THRESHOLD
} from "./cctpChains.js"

// logger
const logger = [];
function addLog(message) {
  const timestamp = new Date().toLocaleTimeString();
  logger.push(`[${timestamp}] ${message}`);
}

// TransferState
const TransferState = {
    IDLE: "idle",
    APPROVING: "approving",
    BURNING: "burning",
    WAITING_ATTESTATION: "waiting-attestation",
    MINTING: "minting",
    COMPLETED: "completed",
    ERROR: "error"
  };  
let currentState = TransferState.IDLE;

function getWalletClient(privateKey, chainId)
{
    console.log("Create Wallet Client", DESTINATION_DOMAINS[chainId]);
    const account = privateKeyToAccount(`0x${privateKey}`);
    let chain;
    switch(chainId)
    {
        case SupportedChainId.ETH_SEPOLIA:
            chain = sepolia;
            break;
        case SupportedChainId.AVAX_FUJI:
            chain = avalancheFuji;
            break;
        case SupportedChainId.BASE_SEPOLIA:
            chain = baseSepolia;
    }
    return createWalletClient({
      chain: chain,
      transport: http(RPC_URL[chainId]),
      account,
    })
}

function getPublicClient(chainId){
    console.log("Create Public Client", DESTINATION_DOMAINS[chainId]);
    return createPublicClient({
      chain: DESTINATION_DOMAINS[chainId],
      transport: http(RPC_URL[chainId])
    });
}

async function test() {
    const sepoliaPublicClient = getPublicClient(SupportedChainId.ETH_SEPOLIA);
    const avaxPublicClient = getPublicClient(SupportedChainId.AVAX_FUJI);
    const basePublicClient = getPublicClient(SupportedChainId.BASE_SEPOLIA);

    const block1 = await sepoliaPublicClient.getBlockNumber();
    const block2 = await avaxPublicClient.getBlockNumber();
    const block3 = await basePublicClient.getBlockNumber();
  
    console.log('Sepolia Block:', block1);
    console.log('Fuji Block:', block2);
    console.log('base Block:', block3);
}

async function checkTransactionStatus(client, hash) {
    if (!hash || typeof hash !== 'string' || !hash.startsWith('0x')) {
      throw new Error('❌ Invalid transaction hash.');
    }
  
    console.log(`🔍 Checking transaction: ${hash} ...`);
    addLog(`🔍 Checking transaction: ${hash} ...`);

    const receipt = await client.waitForTransactionReceipt({ hash });
    if (receipt.status === 'success') {
      console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);
      addLog(`✅ Transaction confirmed in block ${receipt.blockNumber}`);
    } 
    else if (receipt.status === 'reverted') {
      console.log(`❌ Transaction reverted in block ${receipt.blockNumber}`);
      addLog(`❌ Transaction reverted in block ${receipt.blockNumber}`);
    } 
    else {
      console.log(`⏳ Status: ${receipt.status}, still pending...`);
      addLog(`⏳ Status: ${receipt.status}, still pending...`);
    }
  
    return receipt;
}

async function approveUSDC(client, chainId, amount) {
  console.log(`Approving ${amount} USDC transfer on ${CHAIN_TO_CHAIN_NAME[chainId]}...`);
  addLog(`Approving ${amount} USDC transfer on ${CHAIN_TO_CHAIN_NAME[chainId]}...`);
  currentState = TransferState.APPROVING;
  
  const approveTx = await client.sendTransaction({
    to: CHAIN_IDS_TO_USDC_ADDRESSES[chainId],
    data: encodeFunctionData({
      abi: erc20Abi,
      functionName: 'approve',
      args: [CHAIN_IDS_TO_TOKEN_MESSENGER[chainId], amount]
    })
  });
  console.log(`USDC Approval Tx: ${approveTx}`);
  addLog(`USDC Approval Tx: ${approveTx}`);
  return approveTx;
}

async function burnUSDC(client, sourceChainId, amount, destChainId, destAddress, isFast) {
  console.log(`Burning ${amount} USDC on ${CHAIN_TO_CHAIN_NAME[sourceChainId]}...`);
  addLog(`Burning ${amount} USDC on ${CHAIN_TO_CHAIN_NAME[sourceChainId]}...`);
  currentState = TransferState.BURNING;
  
  const burnTx = await client.sendTransaction({
    to: CHAIN_IDS_TO_TOKEN_MESSENGER[sourceChainId],
    data: encodeFunctionData({
      abi: [
        {
          type: 'function',
          name: 'depositForBurn',
          stateMutability: 'nonpayable',
          inputs: [
            { name: 'amount', type: 'uint256' },
            { name: 'destinationDomain', type: 'uint32' },
            { name: 'mintRecipient', type: 'bytes32' },
            { name: 'burnToken', type: 'address' },
            { name: 'destinationCaller', type: 'bytes32' },
            { name: 'maxFee', type: 'uint256' },
            { name: 'minFinalityThreshold', type: 'uint32' },
          ],
          outputs: [],
        },
      ],
      functionName: 'depositForBurn',
      args: [
        amount,
        DESTINATION_DOMAINS[destChainId],
        `0x000000000000000000000000${destAddress.slice(2)}`,
        CHAIN_IDS_TO_USDC_ADDRESSES[sourceChainId],
        '0x0000000000000000000000000000000000000000000000000000000000000000',
        isFast ? DEFAULT_MAX_FEE : 0,
        DEFAULT_FINALITY_THRESHOLD, // minFinalityThreshold (1000 or less for Fast Transfer)
      ],
    }),
  });

  console.log(`Burn Tx: ${burnTx}`);
  addLog(`Burn Tx: ${burnTx}`);
  return burnTx
}

async function retrieveAttestation(chainId, transactionHash) {
    console.log(`Retrieving attestation on ${CHAIN_TO_CHAIN_NAME[chainId]}...`);
    addLog(`Retrieving attestation on ${CHAIN_TO_CHAIN_NAME[chainId]}...`);
    currentState = TransferState.WAITING_ATTESTATION;

    const url = `https://iris-api-sandbox.circle.com/v2/messages/${DESTINATION_DOMAINS[chainId]}?transactionHash=${transactionHash}`
    
    while (true) {
      try {
        const response = await axios.get(url)
        if (response.status === 404) {
          console.log('Waiting for attestation...')
          addLog('Waiting for attestation...')
        }
        if (response.data?.messages?.[0]?.status === 'complete') {
          console.log('Attestation retrieved successfully!')
          addLog('Attestation retrieved successfully!')
          return response.data.messages[0]
        }
        console.log('Waiting for attestation...')
        addLog('Waiting for attestation...')
        await new Promise((resolve) => setTimeout(resolve, 5000))
      } catch (error) {
        console.error('Error fetching attestation:', error.message)
        addLog('Error fetching attestation:', error.message)
        await new Promise((resolve) => setTimeout(resolve, 5000))
      }
    }
}

async function mintUSDC(client, chainId, attestation) {
  console.log(`Minting USDC on ${CHAIN_TO_CHAIN_NAME[chainId]}...`);
  addLog(`Minting USDC on ${CHAIN_TO_CHAIN_NAME[chainId]}...`);
  currentState = TransferState.MINTING;

  const mintTx = await client.sendTransaction({
    to: CHAIN_IDS_TO_MESSAGE_TRANSMITTER[chainId],
    data: encodeFunctionData({
      abi: [
        {
          type: 'function',
          name: 'receiveMessage',
          stateMutability: 'nonpayable',
          inputs: [
            { name: 'message', type: 'bytes' },
            { name: 'attestation', type: 'bytes' },
          ],
          outputs: [],
        },
      ],
      functionName: 'receiveMessage',
      args: [attestation.message, attestation.attestation],
    }),
  })

  console.log(`Mint Tx: ${mintTx}`)
  addLog(`Mint Tx: ${mintTx}`)
  return mintTx;
}

async function cctpV2Transfer(privateKey, sourceChainId, amount, destChainId, destAddress, isFast){
    const sourceClientWallet = getWalletClient(privateKey, sourceChainId);
    const destClientWallet = getWalletClient(privateKey, destChainId);
    const sourcePublicClient = getPublicClient(sourceChainId);
    const destPublicClient = getPublicClient(destChainId);

    const approveTx = await approveUSDC(sourceClientWallet, sourceChainId, amount);
    await checkTransactionStatus(sourcePublicClient, approveTx);
    const burnTx = await burnUSDC(
        sourceClientWallet, 
        sourceChainId, 
        amount, 
        destChainId,
        destAddress,
        isFast
    );
    await checkTransactionStatus(sourcePublicClient, burnTx);
    const attestation = await retrieveAttestation(sourceChainId, burnTx);
    const mintTx = await mintUSDC(destClientWallet, destChainId, attestation);
    await checkTransactionStatus(destPublicClient, mintTx);
}   

async function getUSDCBalance(client, chainId, address) {
  const balance = await client.readContract({
    address: CHAIN_IDS_TO_USDC_ADDRESSES[chainId],
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [address],
  });
  return BigInt(balance);
}

async function rebalanceUSDC(privateKey, isFast = true) {
  const account = privateKeyToAccount(`0x${privateKey}`);
  const address = account.address;

  const chainIds = [
    SupportedChainId.ETH_SEPOLIA,
    SupportedChainId.AVAX_FUJI,
    SupportedChainId.BASE_SEPOLIA,
  ];

  const publicClients = chainIds.map((chainId) => getPublicClient(chainId));
  const balances = await Promise.all(
    publicClients.map((client, i) => getUSDCBalance(client, chainIds[i], address))
  );

  const total = balances.reduce((acc, b) => acc + b, BigInt(0));
  const average = total / BigInt(balances.length);

  console.log("Current balances:");
  chainIds.forEach((id, i) =>
    console.log(`Circle Paymaster on ${CHAIN_TO_CHAIN_NAME[id]}: ${balances[i] / BigInt(1e6)} USDC`)
  );

  const deltas = balances.map((b) => b - average);

  // loop through excess chains and send to deficit chains
  for (let fromIdx = 0; fromIdx < deltas.length; fromIdx++) {
    if (deltas[fromIdx] <= 0n) continue;

    for (let toIdx = 0; toIdx < deltas.length; toIdx++) {
      if (fromIdx === toIdx || deltas[toIdx] >= 0n) continue;

      const transferAmount = deltas[fromIdx] < -deltas[toIdx]
        ? deltas[fromIdx]
        : -deltas[toIdx];

      if (transferAmount > DEFAULT_MAX_FEE) {
        console.log(`Rebalancing: ${transferAmount / BigInt(1e6)} USDC from ${CHAIN_TO_CHAIN_NAME[chainIds[fromIdx]]} to ${CHAIN_TO_CHAIN_NAME[chainIds[toIdx]]}`);
        await cctpV2Transfer(
          privateKey,
          chainIds[fromIdx],
          transferAmount.toString(),
          chainIds[toIdx],
          address,
          isFast
        );
        deltas[fromIdx] -= transferAmount;
        deltas[toIdx] += isFast ? (transferAmount - DEFAULT_MAX_FEE) : transferAmount;
      }
    }
  }

  console.log("✅ Rebalancing complete.");

  const balancesFinal = await Promise.all(
    publicClients.map((client, i) => getUSDCBalance(client, chainIds[i], address))
  );

  console.log("Final balances:");
  chainIds.forEach((id, i) =>
    console.log(`Circle Paymaster on ${CHAIN_TO_CHAIN_NAME[id]}: ${balancesFinal[i] / BigInt(1e6)} USDC`)
  );
}

async function main() {
  await rebalanceUSDC(process.env.PRIVATE_KEY, true);
}

main().catch(console.error)

export { cctpV2Transfer };