import Web3 from 'web3';

// Worldchain RPC URL
const url = 'https://worldchain.drpc.org'; // 或者你選擇的 RPC URL
const web3 = new Web3(new Web3.providers.HttpProvider(url));

// WLD 代幣的合約地址
const contractAddress = '0x2cFc85d8E48F8EAB294be644d9E25C3030863003';

// ERC-20 token balanceOf 方法的 ABI 編碼
const abi = [
  {
    constant: true,
    inputs: [
      {
        name: '_owner',
        type: 'address'
      }
    ],
    name: 'balanceOf',
    outputs: [
      {
        name: 'balance',
        type: 'uint256'
      }
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  }
];

export async function GET(request: Request) {
  try {
    // 解析 URL 查詢參數，這裡我們假設用戶會傳遞一個 "address" 參數
    const url = new URL(request.url);
    const address = url.searchParams.get('address');

    // 如果沒有提供地址，回傳錯誤
    if (!address) {
      return new Response(JSON.stringify({ error: 'Address is required' }), { status: 400 });
    }

    // 創建合約實例
    const contract = new web3.eth.Contract(abi, contractAddress);

    // 查詢地址的 WLD 餘額
    const balance = await contract.methods.balanceOf(address).call();

    // 回傳 WLD 餘額（轉換為常見的顯示單位）
    return new Response(JSON.stringify({ address, balance: web3.utils.fromWei(balance as any, 'ether') }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    // 錯誤處理
    console.error(error);
    return new Response(JSON.stringify({ error: 'An error occurred while fetching data' }), { status: 500 });
  }
}
