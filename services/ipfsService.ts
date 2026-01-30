
export interface IPFSConfig {
  apiKey: string;
  apiSecret: string;
}

export class IPFSService {
  private STORAGE_KEY = 'serenity_ipfs_sim_storage';
  private CONFIG_KEY = 'serenity_ipfs_config';

  public saveConfig(config: IPFSConfig) {
    localStorage.setItem(this.CONFIG_KEY, JSON.stringify(config));
  }

  public getConfig(): IPFSConfig | null {
    const saved = localStorage.getItem(this.CONFIG_KEY);
    return saved ? JSON.parse(saved) : null;
  }

  /**
   * Uploads journal data to real IPFS via Pinata if configured, otherwise falls back to simulation.
   */
  public async uploadJournal(data: any, email: string): Promise<string> {
    const config = this.getConfig();

    let cid: string;

    if (config && config.apiKey && config.apiSecret) {
      try {
        cid = await this.uploadToPinata(data, config);
        console.log(`%c[IPFS] Successfully pinned to real network: ${cid}`, 'color: #10b981; font-weight: bold;');
      } catch (error) {
        console.error("Real IPFS upload failed, falling back to simulation:", error);
        cid = this.generateSimulatedCID();
      }
    } else {
      console.warn("IPFS configuration missing. Using simulated CID.");
      cid = this.generateSimulatedCID();
    }
    
    // We still maintain a local index of Email -> CID for easy history retrieval in this dApp demo
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
          userEmail: jsonData.userEmail,
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
    return resData.IpfsHash; // This is the real CID
  }

  private generateSimulatedCID(): string {
    return "Qm" + Array.from({length: 44}, () => "abcdef0123456789"[Math.floor(Math.random() * 16)]).join("");
  }

  /**
   * Retrieves all journal history associated with a specific email.
   */
  public async retrieveHistoryByEmail(email: string): Promise<any[]> {
    await new Promise(resolve => setTimeout(resolve, 800)); // Network simulation
    const storage = this.getSimulatedStorage();
    return storage
      .filter(item => item.email === email)
      .map(item => ({ ...item.data, ipfs_cid: item.cid }));
  }

  private getSimulatedStorage(): any[] {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }
}

export const ipfsService = new IPFSService();
