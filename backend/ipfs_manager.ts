
export class IPFSManager {
  private API_KEY = process.env.PINATA_API_KEY || '';
  private SECRET_KEY = process.env.PINATA_SECRET_KEY || '';

  public async pinData(data: any) {
    const url = `https://api.pinata.cloud/pinning/pinJSONToIPFS`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'pinata_api_key': this.API_KEY,
        'pinata_secret_api_key': this.SECRET_KEY
      },
      body: JSON.stringify({
        pinataContent: data,
        pinataMetadata: { 
          name: `SerenityJournal_${Date.now()}`, 
          keyvalues: { userEmail: data.userEmail } 
        }
      })
    });
    
    if (!response.ok) throw new Error("Failed to pin journal to IPFS via Pinata.");
    return await response.json();
  }

  public async getHistory(email: string) {
    const url = `https://api.pinata.cloud/data/pinList?status=pinned&metadata[keyvalues]={"userEmail":{"value":"${email}","op":"eq"}}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'pinata_api_key': this.API_KEY,
        'pinata_secret_api_key': this.SECRET_KEY
      }
    });
    if (!response.ok) return [];
    const result = await response.json();
    return result.rows || [];
  }
}
