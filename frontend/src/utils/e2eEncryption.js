// End-to-End Encryption using Web Crypto API (RSA-OAEP)

class E2EEncryption {
  constructor() {
    this.keyPair = null;
    this.recipientPublicKey = null;
  }

  // Generate RSA key pair
  async generateKeyPair() {
    try {
      this.keyPair = await window.crypto.subtle.generateKey(
        {
          name: 'RSA-OAEP',
          modulusLength: 2048,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: 'SHA-256'
        },
        true,
        ['encrypt', 'decrypt']
      );
      
      return this.keyPair;
    } catch (error) {
      console.error('Error generating key pair:', error);
      throw error;
    }
  }

  // Export public key to share with others
  async exportPublicKey() {
    try {
      const exported = await window.crypto.subtle.exportKey(
        'spki',
        this.keyPair.publicKey
      );
      
      return this.arrayBufferToBase64(exported);
    } catch (error) {
      console.error('Error exporting public key:', error);
      throw error;
    }
  }

  // Import recipient's public key
  async importPublicKey(base64Key) {
    try {
      const keyData = this.base64ToArrayBuffer(base64Key);
      
      this.recipientPublicKey = await window.crypto.subtle.importKey(
        'spki',
        keyData,
        {
          name: 'RSA-OAEP',
          hash: 'SHA-256'
        },
        true,
        ['encrypt']
      );
      
      return this.recipientPublicKey;
    } catch (error) {
      console.error('Error importing public key:', error);
      throw error;
    }
  }

  // Encrypt message with recipient's public key
  async encrypt(message) {
    try {
      if (!this.recipientPublicKey) {
        throw new Error('Recipient public key not set');
      }

      const encoder = new TextEncoder();
      const data = encoder.encode(message);

      const encrypted = await window.crypto.subtle.encrypt(
        {
          name: 'RSA-OAEP'
        },
        this.recipientPublicKey,
        data
      );

      return this.arrayBufferToBase64(encrypted);
    } catch (error) {
      console.error('Error encrypting message:', error);
      throw error;
    }
  }

  // Decrypt message with own private key
  async decrypt(encryptedBase64) {
    try {
      if (!this.keyPair) {
        throw new Error('Key pair not generated');
      }

      const encryptedData = this.base64ToArrayBuffer(encryptedBase64);

      const decrypted = await window.crypto.subtle.decrypt(
        {
          name: 'RSA-OAEP'
        },
        this.keyPair.privateKey,
        encryptedData
      );

      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (error) {
      console.error('Error decrypting message:', error);
      return '[Decryption failed]';
    }
  }

  // Helper: ArrayBuffer to Base64
  arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  // Helper: Base64 to ArrayBuffer
  base64ToArrayBuffer(base64) {
    const binary = window.atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}

export default E2EEncryption;
