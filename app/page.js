'use client';
import { useState } from 'react';

export default function Home() {
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState('');
  const [encryptedFile, setEncryptedFile] = useState(null);
  const [decryptedFile, setDecryptedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fileExtension, setFileExtension] = useState('');  // Track file extension

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    console.log("File selected:", selectedFile);
    setFile(selectedFile);

    // Store the original file extension
    const fileExt = selectedFile.name.split('.').pop();
    setFileExtension(fileExt);
  };

  const handlePasswordChange = (e) => {
    const enteredPassword = e.target.value;
    console.log("Password entered:", enteredPassword);
    setPassword(enteredPassword);
  };

  // Encrypt file handler
  const handleEncryptFile = async () => {
    if (!file || !password) {
      alert("Please select a file and enter a password.");
      return;
    }

    setLoading(true);

    try {
      const { encryptedData, iv } = await encryptFile(file, password);

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
      setLoading(false);
    }
  };

  // Decrypt file handler
  const handleDecryptFile = async () => {
    if (!file || !password) {
      alert("Please select a file and enter a password.");
      return;
    }

    setLoading(true);

    try {
      const decryptedData = await decryptFile(file, password);

      const decryptedBlob = new Blob([decryptedData], { type: 'application/octet-stream' });
      const decryptedFileURL = URL.createObjectURL(decryptedBlob);

      setDecryptedFile(decryptedFileURL);
      alert("File decrypted successfully!");
    } catch (error) {
      console.error("Decryption Error:", error);
      alert("Error decrypting file");
    } finally {
      setLoading(false);
    }
  };

  async function encryptFile(file, password) {
    const encoder = new TextEncoder();
    const data = await file.arrayBuffer();

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
    const encryptedData = await window.crypto.subtle.encrypt(
      { name: "AES-CBC", iv },
      derivedKey,
      data
    );

    return { encryptedData, iv };
  }

  async function decryptFile(file, password) {
    const encoder = new TextEncoder();
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

    return decryptedData;
  }

  return (
    <div className="app-container">
      <h1>File Encryption & Decryption Tool (ASHIK)</h1>

      {/* Encrypt Section */}
      <div className="section">
        <h2>Encrypt File</h2>
        <div className="input-group">
          <input type="file" onChange={handleFileChange} />
          <input 
            type="password" 
            placeholder="Enter password" 
            value={password} 
            onChange={handlePasswordChange} 
          />
        </div>
        <button className="action-button" onClick={handleEncryptFile} disabled={loading}>
          {loading ? "Encrypting..." : "Encrypt File"}
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
          <input type="file" onChange={handleFileChange} />
          <input 
            type="password" 
            placeholder="Enter password" 
            value={password} 
            onChange={handlePasswordChange} 
          />
        </div>
        <button className="action-button" onClick={handleDecryptFile} disabled={loading}>
          {loading ? "Decrypting..." : "Decrypt File"}
        </button>
        {decryptedFile && (
          <div className="download-section">
            <h3>Decrypted File:</h3>
            <a 
              href={decryptedFile} 
              download={`decrypted_file.${fileExtension}`} 
              className="download-link"
            >
              Download Decrypted File
            </a>
          </div>
        )}
      </div>
      
      {/* Add your CSS styling */}
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

        .action-button:hover {
          background-color: #45a049;
        }

        .download-section {
          margin-top: 20px;
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
