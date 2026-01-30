
export interface IPFSConfig {
  apiKey: string;
  apiSecret: string;
}

export class IPFSService {
  private STORAGE_KEY = 'serenity_ipfs_sim_storage';
  private CONFIG_KEY = 'serenity_ipfs_config';
  private GATEWAY_URL = 'https://gateway.pinata.cloud/ipfs/'; // Dedicated Pinata gateway is faster

  public saveConfig(config: IPFSConfig) {
    localStorage.setItem(this.CONFIG_KEY, JSON.stringify(config));
  }

  public getConfig(): IPFSConfig | null {
    const saved = localStorage.getItem(this.CONFIG_KEY);
    return saved ? JSON.parse(saved) : null;
  }

  /**
   * Uploads journal data to real IPFS via Pinata.
   */
  public async uploadJournal(data: any, email: string): Promise<string> {
    const config = this.getConfig();
    let cid: string;

    if (config && config.apiKey && config.apiSecret) {
      try {
        cid = await this.uploadToPinata(data, config);
        console.log(`%c[IPFS] Pinned to global network: ${cid}`, 'color: #10b981; font-weight: bold;');
      } catch (error) {
        console.error("Real IPFS upload failed, falling back to simulation:", error);
        cid = this.generateSimulatedCID();
      }
    } else {
      console.warn("IPFS configuration missing. Using simulated CID.");
      cid = this.generateSimulatedCID();
    }
    
    // Maintain a local mirror for instant availability
    const storage = this.getSimulatedStorage();
    storage.push({ 
      cid, 
      email, 
      data: { ...data, createdAt: new Date().toISOString() } 
    });
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(storage));

    return cid;
  }

  private async uploadToPinata(jsonData: any, config: IPFSConfig): Promise<string> {
    const url = `https://api.pinata.cloud/pinning/pinJSONToIPFS`;
    
    const body = {
      pinataContent: jsonData,
      pinataMetadata: {
        name: `SerenityJournal_${jsonData.sessionId || Date.now()}`,
        keyvalues: {
          userEmail: jsonData.userEmail, // Key for retrieval
          type: 'mental_health_journal'
        }
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'pinata_api_key': config.apiKey,
        'pinata_secret_api_key': config.apiSecret
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Pinata IPFS Error: ${errorData}`);
    }

    const resData = await response.json();
    return resData.IpfsHash;
  }

  /**
   * Retrieves all journal history associated with a specific email.
   * If Pinata is configured, it fetches from the real network.
   */
  public async retrieveHistoryByEmail(email: string): Promise<any[]> {
    const config = this.getConfig();
    
    if (config && config.apiKey && config.apiSecret) {
      try {
        return await this.fetchHistoryFromPinata(email, config);
      } catch (error) {
        console.error("Failed to fetch remote IPFS history, using local mirror:", error);
      }
    }

    // Fallback to local mirror
    const storage = this.getSimulatedStorage();
    return storage
      .filter(item => item.email === email)
      .map(item => ({ ...item.data, ipfs_cid: item.cid }));
  }

  private async fetchHistoryFromPinata(email: string, config: IPFSConfig): Promise<any[]> {
    const queryUrl = `https://api.pinata.cloud/data/pinList?status=pinned&metadata[keyvalues]={"userEmail":{"value":"${email}","op":"eq"}}`;
    
    const response = await fetch(queryUrl, {
      method: 'GET',
      headers: {
        'pinata_api_key': config.apiKey,
        'pinata_secret_api_key': config.apiSecret
      }
    });

    if (!response.ok) throw new Error("Failed to query Pinata index");

    const pinListData = await response.json();
    const pins = pinListData.rows || [];

    // Fetch the actual JSON content for each pin from an IPFS gateway
    const historyPromises = pins.map(async (pin: any) => {
      try {
        const contentResponse = await fetch(`${this.GATEWAY_URL}${pin.ipfs_pin_hash}`, {
          signal: AbortSignal.timeout(5000) // Don't hang the app if a CID is slow
        });
        if (!contentResponse.ok) return null;
        const journalData = await contentResponse.json();
        return { ...journalData, ipfs_cid: pin.ipfs_pin_hash };
      } catch (e) {
        console.warn(`Could not fetch content for CID ${pin.ipfs_pin_hash}`);
        return null;
      }
    });

    const results = await Promise.all(historyPromises);
    return results.filter(r => r !== null);
  }

  private generateSimulatedCID(): string {
    return "Qm" + Array.from({length: 44}, () => "abcdef0123456789"[Math.floor(Math.random() * 16)]).join("");
  }

  private getSimulatedStorage(): any[] {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }
}

export const ipfsService = new IPFSService();
