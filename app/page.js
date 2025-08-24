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
        @import url('https://fonts.googleapis.com/css2?family=Roboto+Slab:wght@400;700&family=Inter:wght@400;600&display=swap');

        .app-container {
          font-family: 'Inter', sans-serif;
          background-color: #f5f7fa; /* very light gray */
          color: #2e3440; /* dark slate gray */
          min-height: 100vh;
          padding: 60px 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        h1 {
          font-family: 'Roboto Slab', serif;
          font-size: 3rem;
          font-weight: 700;
          margin-bottom: 56px;
          color: #1f2937;
          text-align: center;
          letter-spacing: -0.03em;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .section {
          width: 100%;
          max-width: 600px;
          background: #ffffff;
          border-radius: 14px;
          box-shadow: 0 8px 16px rgb(0 0 0 / 0.08);
          padding: 36px 32px;
          margin-bottom: 56px;
          transition: box-shadow 0.3s ease;
        }

        .section:hover {
          box-shadow: 0 12px 24px rgb(0 0 0 / 0.12);
        }

        h2 {
          font-family: 'Roboto Slab', serif;
          font-weight: 700;
          font-size: 1.75rem;
          margin-bottom: 28px;
          color: #1f2937;
          border-bottom: 2px solid #3b82f6; /* subtle blue underline */
          padding-bottom: 8px;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 20px;
          margin-bottom: 32px;
        }

        input[type="file"],
        input[type="password"] {
          padding: 14px 18px;
          font-size: 1rem;
          border-radius: 10px;
          border: 1.8px solid #d1d5db; /* soft neutral border */
          background-color: #f9fafb;
          color: #374151;
          transition: border-color 0.25s ease, box-shadow 0.25s ease;
          font-weight: 500;
        }

        input[type="file"]::-webkit-file-upload-button {
          cursor: pointer;
          background-color: #2563eb; /* primary blue */
          border: none;
          padding: 10px 22px;
          border-radius: 10px;
          color: white;
          font-weight: 700;
          font-size: 1rem;
          transition: background-color 0.3s ease;
        }

        input[type="file"]::-webkit-file-upload-button:hover {
          background-color: #1e40af;
        }

        input[type="password"]:focus,
        input[type="file"]:focus {
          outline: none;
          border-color: #2563eb;
          box-shadow: 0 0 10px rgb(37 99 235 / 0.5);
          background-color: #fff;
        }

        .action-button {
          padding: 16px 36px;
          font-size: 1.15rem;
          font-weight: 700;
          border-radius: 12px;
          border: none;
          background-color: #2563eb;
          color: white;
          cursor: pointer;
          transition: background-color 0.3s ease, box-shadow 0.3s ease;
          letter-spacing: 0.03em;
          user-select: none;
        }

        .action-button:disabled {
          background-color: #93c5fd;
          cursor: not-allowed;
          color: #e0e7ff;
          box-shadow: none;
        }

        .action-button:hover:not(:disabled) {
          background-color: #1e40af;
          box-shadow: 0 6px 20px rgb(30 64 175 / 0.45);
        }

        .action-button:active:not(:disabled) {
          background-color: #1b3a8a;
          box-shadow: 0 3px 12px rgb(27 58 138 / 0.5);
        }

        .download-section {
          margin-top: 32px;
          padding: 24px;
          background-color: #f3f4f6;
          border-radius: 14px;
          text-align: center;
          box-shadow: 0 2px 8px rgb(0 0 0 / 0.06);
          transition: box-shadow 0.3s ease;
        }

        .download-section:hover {
          box-shadow: 0 8px 20px rgb(0 0 0 / 0.1);
        }

        .download-link {
          display: inline-block;
          background-color: #1e40af;
          color: white;
          font-weight: 700;
          font-size: 1.1rem;
          padding: 14px 36px;
          border-radius: 9999px;
          text-decoration: none;
          box-shadow: 0 4px 16px rgb(30 64 175 / 0.6);
          transition: background-color 0.3s ease, box-shadow 0.3s ease, transform 0.2s ease;
          user-select: none;
        }

        .download-link:hover {
          background-color: #143c8a;
          box-shadow: 0 8px 28px rgb(20 60 138 / 0.7);
          transform: scale(1.07);
        }
      `}</style>

    </div>
  );
}