
import { ethers } from "ethers";

export class BlockchainService {
  private provider: ethers.BrowserProvider | null = null;

  constructor() {
    // Fixed: Cast window to any to access the ethereum provider without TypeScript errors
    const eth = (window as any).ethereum;
    if (eth) {
      this.provider = new ethers.BrowserProvider(eth);
    }
  }

  public async connectWallet(): Promise<string | null> {
    if (!this.provider) {
      alert("Please install MetaMask or another Web3 wallet.");
      return null;
    }
    try {
      const accounts = await this.provider.send("eth_requestAccounts", []);
      return accounts[0];
    } catch (error) {
      console.error("Wallet connection failed:", error);
      return null;
    }
  }

  public async notarizeCID(cid: string): Promise<string> {
    console.log(`Notarizing CID: ${cid} on blockchain...`);
    
    // Simulate transaction delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // In a real app, you would call a smart contract:
    // const signer = await this.provider!.getSigner();
    // const contract = new ethers.Contract(CONTRACT_ADDR, ABI, signer);
    // const tx = await contract.notarize(cid);
    // await tx.wait();
    // return tx.hash;

    return "0x" + Array.from({length: 64}, () => "abcdef0123456789"[Math.floor(Math.random() * 16)]).join("");
  }
}

export const blockchainService = new BlockchainService();
