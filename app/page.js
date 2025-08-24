'use client';
import { useState } from 'react';

export default function Home() {
  // Encryption State
  const [encryptFile, setEncryptFile] = useState(null);
  const [encryptPassword, setEncryptPassword] = useState('');
  const [encryptedFile, setEncryptedFile] = useState(null);
  const [encryptLoading, setEncryptLoading] = useState(false);

  // Decryption State
  const [decryptFile, setDecryptFile] = useState(null);
  const [decryptPassword, setDecryptPassword] = useState('');
  const [decryptedFile, setDecryptedFile] = useState(null);
  const [decryptLoading, setDecryptLoading] = useState(false);

  const [originalFileExtension, setOriginalFileExtension] = useState('');  // Store original extension

  const handleFileChange = (e, action) => {
    const selectedFile = e.target.files[0];
    console.log("File selected:", selectedFile);
    
    if (action === 'encrypt') {
      setEncryptFile(selectedFile);
      // Store the original file extension when encrypting
      const fileExt = selectedFile.name.split('.').pop();
      setOriginalFileExtension(fileExt);
    } else if (action === 'decrypt') {
      setDecryptFile(selectedFile);
    }
  };

  const handlePasswordChange = (e, action) => {
    const enteredPassword = e.target.value;
    console.log("Password entered:", enteredPassword);

    if (action === 'encrypt') {
      setEncryptPassword(enteredPassword);
    } else if (action === 'decrypt') {
      setDecryptPassword(enteredPassword);
    }
  };

  // Encrypt file handler
  const handleEncryptFile = async () => {
    if (!encryptFile || !encryptPassword) {
      alert("Please select a file and enter a password for encryption.");
      return;
    }

    setEncryptLoading(true);

    try {
      const { encryptedData, iv } = await encryptFileMethod(encryptFile, encryptPassword, originalFileExtension);

      const encryptedBlob = new Blob([iv, encryptedData], { type: 'application/octet-stream' });
      const encryptedFileURL = URL.createObjectURL(encryptedBlob);

      setEncryptedFile({
        fileURL: encryptedFileURL,
        iv: iv,
      });

      alert("File encrypted successfully!");
    } catch (error) {
      console.error("Encryption Error:", error);
      alert("Error encrypting file");
    } finally {
      setEncryptLoading(false);
    }
  };

  // Decrypt file handler
  const handleDecryptFile = async () => {
    if (!decryptFile || !decryptPassword) {
      alert("Please select a file and enter a password for decryption.");
      return;
    }

    setDecryptLoading(true);

    try {
      const { decryptedData, fileExtension } = await decryptFileMethod(decryptFile, decryptPassword);

      const decryptedBlob = new Blob([decryptedData], { type: 'application/octet-stream' });
      const decryptedFileURL = URL.createObjectURL(decryptedBlob);

      setDecryptedFile({
        url: decryptedFileURL,
        extension: fileExtension
      });
      alert("File decrypted successfully!");
    } catch (error) {
      console.error("Decryption Error:", error);
      alert("Error decrypting file");
    } finally {
      setDecryptLoading(false);
    }
  };

  async function encryptFileMethod(file, password, fileExtension) {
    const encoder = new TextEncoder();
    const data = await file.arrayBuffer();

    // Store file extension in the encrypted data
    const extensionBytes = encoder.encode(fileExtension);
    const extensionLength = new Uint8Array([extensionBytes.length]); // Store length of extension

    const keyMaterial = await window.crypto.subtle.importKey(
      "raw", encoder.encode(password), "PBKDF2", false, ["deriveKey"]
    );

    const derivedKey = await window.crypto.subtle.deriveKey(
      { name: "PBKDF2", salt: encoder.encode("some_salt_here"), iterations: 100000, hash: "SHA-256" },
      keyMaterial,
      { name: "AES-CBC", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );

    const iv = window.crypto.getRandomValues(new Uint8Array(16)); // Random IV
    
    // Combine extension info with file data
    const combinedData = new Uint8Array(extensionLength.length + extensionBytes.length + data.byteLength);
    combinedData.set(extensionLength, 0);
    combinedData.set(extensionBytes, extensionLength.length);
    combinedData.set(new Uint8Array(data), extensionLength.length + extensionBytes.length);

    const encryptedData = await window.crypto.subtle.encrypt(
      { name: "AES-CBC", iv },
      derivedKey,
      combinedData
    );

    return { encryptedData, iv };
  }

  async function decryptFileMethod(file, password) {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const data = await file.arrayBuffer();

    const iv = new Uint8Array(data.slice(0, 16)); // First 16 bytes
    const encryptedData = data.slice(16);

    const keyMaterial = await window.crypto.subtle.importKey(
      "raw", encoder.encode(password), "PBKDF2", false, ["deriveKey"]
    );

    const derivedKey = await window.crypto.subtle.deriveKey(
      { name: "PBKDF2", salt: encoder.encode("some_salt_here"), iterations: 100000, hash: "SHA-256" },
      keyMaterial,
      { name: "AES-CBC", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );

    const decryptedData = await window.crypto.subtle.decrypt(
      { name: "AES-CBC", iv },
      derivedKey,
      encryptedData
    );

    // Extract extension and file data
    const decryptedArray = new Uint8Array(decryptedData);
    const extensionLength = decryptedArray[0];
    const extensionBytes = decryptedArray.slice(1, 1 + extensionLength);
    const fileData = decryptedArray.slice(1 + extensionLength);
    
    const fileExtension = decoder.decode(extensionBytes);

    return { decryptedData: fileData, fileExtension };
  }

  return (
    <div className="app-container">
      <h1>Trusted File Protection Suite</h1>

      {/* Encrypt Section */}
      <div className="section">
        <h2>Encrypt File</h2>
        <div className="input-group">
          <input type="file" onChange={(e) => handleFileChange(e, 'encrypt')} />
          <input 
            type="password" 
            placeholder="Enter password" 
            value={encryptPassword} 
            onChange={(e) => handlePasswordChange(e, 'encrypt')} 
          />
        </div>
        <button className="action-button" onClick={handleEncryptFile} disabled={encryptLoading}>
          {encryptLoading ? "Encrypting..." : "Encrypt File"}
        </button>
        {encryptedFile && (
          <div className="download-section">
            <h3>Encrypted File:</h3>
            <a href={encryptedFile.fileURL} download="encrypted_file.enc" className="download-link">
              Download Encrypted File
            </a>
          </div>
        )}
      </div>

      {/* Decrypt Section */}
      <div className="section">
        <h2>Decrypt File</h2>
        <div className="input-group">
          <input type="file" onChange={(e) => handleFileChange(e, 'decrypt')} />
          <input 
            type="password" 
            placeholder="Enter password" 
            value={decryptPassword} 
            onChange={(e) => handlePasswordChange(e, 'decrypt')} 
          />
        </div>
        <button className="action-button" onClick={handleDecryptFile} disabled={decryptLoading}>
          {decryptLoading ? "Decrypting..." : "Decrypt File"}
        </button>
        {decryptedFile && (
          <div className="download-section">
            <h3>Decrypted File:</h3>
            <a 
              href={decryptedFile.url} 
              download={`decrypted_file.${decryptedFile.extension}`} 
              className="download-link"
            >
              Download Decrypted File
            </a>
          </div>
        )}
      </div>

      <style jsx>{`
        .app-container {
          font-family: 'Arial', sans-serif;
          display: flex;
          flex-direction: column;
          align-items: center;
          background-color: #f0f4f8;
          padding: 20px;
          border-radius: 10px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          min-height: 100vh;
        }
        
        h1 {
          color: #333;
          font-size: 2.5rem;
          margin-bottom: 20px;
        }

        .section {
          width: 100%;
          max-width: 600px;
          margin-bottom: 40px;
          padding: 20px;
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        h2 {
          color: #333;
          margin-bottom: 10px;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          margin-bottom: 20px;
        }

        input {
          padding: 10px;
          font-size: 1rem;
          border-radius: 5px;
          border: 1px solid #ccc;
          margin-bottom: 10px;
        }

        .file-info {
          color: #666;
          font-size: 0.9rem;
          margin-bottom: 10px;
          font-style: italic;
        }

        .action-button {
          padding: 12px 20px;
          background-color: #4CAF50;
          color: white;
          border: none;
          border-radius: 5px;
          font-size: 1rem;
          cursor: pointer;
          transition: background-color 0.3s ease;
        }

        .action-button:disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }

        .action-button:hover:not(:disabled) {
          background-color: #45a049;
        }

        .download-section {
          margin-top: 20px;
          padding: 15px;
          background-color: #f9f9f9;
          border-radius: 5px;
        }

        .download-link {
          color: #007bff;
          text-decoration: none;
          font-size: 1rem;
          font-weight: bold;
        }

        .download-link:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}