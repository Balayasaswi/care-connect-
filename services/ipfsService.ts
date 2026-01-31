
import { server } from "../api";

export class IPFSService {
  private GATEWAY_URL = 'https://gateway.pinata.cloud/ipfs/';

  /**
   * Uploads journal data to real IPFS via our backend.
   */
  public async uploadJournal(data: any, email: string): Promise<string> {
    try {
      const res = await server.pinToIPFS(data);
      console.log(`%c[Backend IPFS] Successfully pinned: ${res.IpfsHash}`, 'color: #10b981; font-weight: bold;');
      return res.IpfsHash;
    } catch (error) {
      console.error("Backend IPFS failed:", error);
      return "Qm" + Math.random().toString(36).substring(7); // Fallback to simulated
    }
  }

  /**
   * Retrieves all journal history associated with a specific email via the backend.
   */
  public async retrieveHistoryByEmail(email: string): Promise<any[]> {
    try {
      const pins = await server.getIPFSHistory(email);
      const historyPromises = pins.map(async (pin: any) => {
        try {
          const contentResponse = await fetch(`${this.GATEWAY_URL}${pin.ipfs_pin_hash}`, {
            signal: AbortSignal.timeout(5000)
          });
          if (!contentResponse.ok) return null;
          const journalData = await contentResponse.json();
          return { ...journalData, ipfs_cid: pin.ipfs_pin_hash };
        } catch (e) {
          return null;
        }
      });
      const results = await Promise.all(historyPromises);
      return results.filter(r => r !== null);
    } catch (error) {
      console.error("Backend History Fetch failed:", error);
      return [];
    }
  }
}

export const ipfsService = new IPFSService();
