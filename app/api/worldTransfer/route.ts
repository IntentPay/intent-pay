import { hexToBigInt } from 'viem';
import Web3 from 'web3';

const url = 'https://worldchain.drpc.org'; // Worldchain RPC URL
const web3 = new Web3(new Web3.providers.HttpProvider(url));

const WLD_CONTRACT_ADDRESS = '0x2cFc85d8E48F8EAB294be644d9E25C3030863003'; // WLD Contract Address
const WLD_ABI = [
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'from', type: 'address' },
      { indexed: true, internalType: 'address', name: 'to', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'value', type: 'uint256' }
    ],
    name: 'Transfer',
    type: 'event'
  }
];

// 查询指定地址的 Token 转账记录，分批次查询
const getTokenTransfersInRange = async (address: string, startBlock: number, endBlock: number) => {
  const events = await web3.eth.getPastLogs({
    fromBlock: startBlock,
    toBlock: endBlock,
    address: WLD_CONTRACT_ADDRESS,
    topics: [
      web3.utils.sha3('Transfer(address,address,uint256)'), // Transfer event signature
      null, // "from" address (null means no filter on the "from" address)
      web3.utils.padLeft(address, 64) // "to" address (filtering for the specific address)
    ]
  });

  return events.map((event) => ({
    from: event.topics[1], // 从哪个地址发送
    to: event.topics[2], // 发送到哪个地址
    value: hexToBigInt(event.data).toString() // 转账数量（uint256 类型，转换为字符串）
  }));
};

// 分批查询，确保每次查询不超过 5000 个区块
const getTokenTransfersInBatches = async (
  address: string,
  startBlock: number,
  endBlock: string | number,
  batchSize = 5000
) => {
  const currentEndBlock = endBlock === 'latest' ? await web3.eth.getBlockNumber() : endBlock;
  let transfers = [];
  let currentStartBlock = startBlock;
  let currentEndBlockRange = Math.min(currentStartBlock + batchSize, currentEndBlock);

  while (currentStartBlock < currentEndBlock) {
    const batchTransfers = await getTokenTransfersInRange(address, currentStartBlock, currentEndBlockRange);
    transfers = transfers.concat(batchTransfers);

    currentStartBlock = currentEndBlockRange + 1;
    currentEndBlockRange = Math.min(currentStartBlock + batchSize, currentEndBlock);
  }

  return transfers;
};

// API GET 方法
export async function GET(request: { url: string | URL }) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');
  const startBlock = parseInt(searchParams.get('startBlock') || '0', 10); // 默认从区块 0 开始
  const endBlock = searchParams.get('endBlock') || 'latest'; // 默认查询到最新区块

  if (!address) {
    return new Response(JSON.stringify({ error: 'Address is required' }), { status: 400 });
  }

  try {
    // 查詢 token 轉移紀錄，從區塊 0 開始到最新區塊，並分批查詢每 5000 個區塊
    const transfers = await getTokenTransfersInBatches(address, startBlock, endBlock, 5000);
    return new Response(JSON.stringify({ transfers }), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
