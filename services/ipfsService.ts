
export class IPFSService {
  private STORAGE_KEY = 'serenity_ipfs_sim_storage';

  /**
   * Uploads journal data and tags it with user email for retrieval.
   */
  public async uploadJournal(data: any, email: string): Promise<string> {
    const cid = "Qm" + Array.from({length: 44}, () => "abcdef0123456789"[Math.floor(Math.random() * 16)]).join("");
    
    // Simulate IPFS network delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Simulated Decentralized Indexing Layer (storing mapping of Email -> CID)
    const storage = this.getSimulatedStorage();
    storage.push({ cid, email, data: { ...data, createdAt: new Date().toISOString() } });
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(storage));

    return cid;
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
