import { cctpV2Transfer } from "../../../../lib/circle/cctp/cctpTransfer.js";

export async function POST(req) {
  try {
    const body = await req.json();
    const { privateKey, sourceChainId, amount, destChainId, destAddress, isFast } = body;

    await cctpV2Transfer(privateKey, sourceChainId, amount, destChainId, destAddress, isFast);

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error("Transfer error:", err);

    // Extract error message from common error formats
    const errorMessage =
      err?.message || 
      err?.toString() || 
      "Unknown error occurred.";

    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
