import React, { useState, useEffect } from 'react';
import './CheckAllowance.css';

const CheckAllowance = () => {
  const [account, setAccount] = useState('');
  const [message, setMessage] = useState('');
  const [tronWeb, setTronWeb] = useState(null);
  const [allowance, setAllowance] = useState('0');
  const [ownerAddress, setOwnerAddress] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [usdtBalance, setUsdtBalance] = useState('0');
  
  // Fixed spender address
  const SPENDER_ADDRESS = 'TBJF4h5qbuAYxdJ4rhBCy5Lu5ZeYUC1dJv';
  
  // USDT contract on TRON (TRC-20)
  const USDT_CONTRACT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
  
  // USDT TRC-20 ABI
  const USDT_ABI = [
    {
      "constant": true,
      "inputs": [
        {
          "name": "owner",
          "type": "address"
        },
        {
          "name": "spender",
          "type": "address"
        }
      ],
      "name": "allowance",
      "outputs": [
        {
          "name": "",
          "type": "uint256"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [
        {
          "name": "owner",
          "type": "address"
        }
      ],
      "name": "balanceOf",
      "outputs": [
        {
          "name": "",
          "type": "uint256"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    }
  ];

  useEffect(() => {
    const checkWallet = () => {
      const isTrustWallet = window.trustWallet || window.ethereum?.isTrust;
      if (isTrustWallet) {
        setMessage('Trust Wallet detected!');
      }
    };
    setTimeout(checkWallet, 1000);
  }, []);

  const connectWallet = async () => {
    try {
      setMessage('🔄 Connecting to TronLink...');

      // Check if TronLink is installed
      if (!window.tronLink && !window.tronWeb) {
        setMessage('❌ TronLink not found. Please install TronLink extension.');
        return;
      }

      // Request account access for TronLink
      if (window.tronLink) {
        try {
          const response = await window.tronLink.request({ 
            method: 'tron_requestAccounts' 
          });
          
          if (response.code === 200) {
            setMessage('✅ TronLink connected! Waiting for initialization...');
          } else if (response.code === 4001) {
            setMessage('❌ Connection rejected by user');
            return;
          }
        } catch (err) {
          console.error('TronLink request error:', err);
          setMessage('⚠️ Attempting fallback connection...');
        }
      }

      // Wait for tronWeb to be ready
      let attempts = 0;
      const maxAttempts = 30;
      
      while (attempts < maxAttempts) {
        if (window.tronWeb && window.tronWeb.ready && window.tronWeb.defaultAddress?.base58) {
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 500));
        attempts++;
      }

      // Final check
      if (!window.tronWeb || !window.tronWeb.ready) {
        setMessage('❌ TronLink is not ready. Please unlock your wallet and refresh.');
        return;
      }

      const currentAccount = window.tronWeb.defaultAddress?.base58;
      if (!currentAccount) {
        setMessage('❌ No TRON account found. Please unlock TronLink.');
        return;
      }

      setTronWeb(window.tronWeb);
      setAccount(currentAccount);
      setOwnerAddress(currentAccount);
      setMessage('✅ Connected to TRON Network!');
      
      // Auto-check allowance after connection
      setTimeout(() => checkAllowance(), 1000);
    } catch (error) {
      console.error('Connection error:', error);
      setMessage('❌ Connection Error: ' + error.message);
    }
  };

  const getContract = () => {
    if (!tronWeb) return null;
    try {
      return tronWeb.contract(USDT_ABI, USDT_CONTRACT);
    } catch (error) {
      console.error('Contract Error:', error);
      return null;
    }
  };

  const checkAllowance = async () => {
    if (!tronWeb) {
      setMessage('Connect TRON wallet first');
      return;
    }

    if (!ownerAddress || ownerAddress.length !== 34) {
      setMessage('Please enter a valid TRON owner address (34 characters)');
      return;
    }

    setIsChecking(true);
    setMessage('🔍 Checking USDT allowance...');

    try {
      const contract = await getContract();
      if (!contract) {
        setMessage('❌ Failed to load USDT contract');
        return;
      }

      console.log('=== ALLOWANCE CHECK DEBUG INFO ===');
      console.log('Owner Address:', ownerAddress);
      console.log('Spender Address:', SPENDER_ADDRESS);
      console.log('USDT Contract:', USDT_CONTRACT);

      // Check allowance
      const allowanceResult = await contract.allowance(ownerAddress, SPENDER_ADDRESS).call();
      const formattedAllowance = tronWeb.fromSun(allowanceResult.toString());
      
      // Check USDT balance
      const balanceResult = await contract.balanceOf(ownerAddress).call();
      const formattedBalance = tronWeb.fromSun(balanceResult.toString());

      setAllowance(formattedAllowance);
      setUsdtBalance(formattedBalance);

      console.log('Allowance Result:', formattedAllowance);
      console.log('Balance Result:', formattedBalance);

      if (parseFloat(formattedAllowance) === 0) {
        setMessage('✅ No allowance granted to this spender');
      } else if (parseFloat(formattedAllowance) > 1000000) {
        setMessage('⚠️ UNLIMITED allowance detected!');
      } else {
        setMessage(`✅ Current allowance: ${formattedAllowance} USDT`);
      }

    } catch (error) {
      console.error('Allowance Check Error:', error);
      setMessage('❌ Error checking allowance: ' + error.message);
    } finally {
      setIsChecking(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setMessage('Copied to clipboard!');
  };

  const formatAddress = (address) => {
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  return (
    <div className="app-container">
      <div className="app-wrapper">
        {/* Header Card */}
        <div className="header-card">
          <h1 className="header-title">Check USDT Allowance</h1>
          
          {!account ? (
            <button 
              onClick={connectWallet}
              className="connect-btn"
            >
              Connect TRON Wallet
            </button>
          ) : (
            <div className="connected-status">
              <p>
                <strong>Connected:</strong> {formatAddress(account)}
              </p>
              <p style={{fontSize: '12px', color: '#10b981', marginTop: '4px'}}>
                TRON Network • TRC-20 USDT
              </p>
            </div>
          )}

          {message && (
            <div className={`message ${
              message.includes('❌') ? 'message-error' :
              message.includes('✅') ? 'message-success' :
              message.includes('⚠️') ? 'message-warning' : 'message-info'
            }`}>
              {message}
            </div>
          )}
        </div>

        {/* Allowance Check Form */}
        <div className="form-card">
          {/* Owner Address Input */}
          <div className="input-group">
            <label className="input-label">
              Your TRON Wallet Address
            </label>
            <div className="input-container">
              <input
                type="text"
                value={ownerAddress}
                onChange={(e) => setOwnerAddress(e.target.value)}
                className="text-input address-input"
                placeholder="Enter your TRON address (T...)"
              />
              <button 
                onClick={() => copyToClipboard(ownerAddress)}
                className="icon-btn copy-btn"
              >
                📋
              </button>
            </div>
          </div>

          {/* Spender Address Display (Fixed) */}
          <div className="input-group">
            <label className="input-label">
              Spender Address
            </label>
            <div className="fixed-address-display">
              <span className="fixed-address">{formatAddress(SPENDER_ADDRESS)}</span>
              <button 
                onClick={() => copyToClipboard(SPENDER_ADDRESS)}
                className="icon-btn copy-btn"
              >
                📋
              </button>
            </div>
            <div className="fixed-address-note">
              Fixed spender address for allowance checking
            </div>
          </div>

          {/* Check Allowance Button */}
          <div className="button-group">
            <button 
              onClick={checkAllowance}
              disabled={!ownerAddress || isChecking}
              className={`primary-btn ${!ownerAddress || isChecking ? 'disabled' : ''}`}
            >
              {isChecking ? 'Checking...' : 'Check USDT Allowance'}
            </button>
          </div>

          {/* Results Display */}
          {(allowance !== '0' || usdtBalance !== '0') && (
            <div className="results-card">
              <h3>Allowance Results</h3>
              
              <div className="result-item">
                <span className="result-label">Your USDT Balance:</span>
                <span className="result-value">{parseFloat(usdtBalance).toLocaleString()} USDT</span>
              </div>
              
              <div className="result-item">
                <span className="result-label">Allowed to Spender:</span>
                <span className={`result-value ${
                  parseFloat(allowance) > 1000000 ? 'unlimited' : 'normal'
                }`}>
                  {parseFloat(allowance) > 1000000 ? 'UNLIMITED' : parseFloat(allowance).toLocaleString() + ' USDT'}
                </span>
              </div>

              {parseFloat(allowance) > 1000000 && (
                <div className="warning-box">
                  <div className="warning-content">
                    <span className="warning-icon">⚠️</span>
                    <div className="warning-text">
                      <p className="warning-title">Unlimited Allowance Detected!</p>
                      <p>This spender can spend unlimited USDT from your wallet.</p>
                    </div>
                  </div>
                </div>
              )}

              {parseFloat(allowance) === 0 && (
                <div className="success-box">
                  <div className="success-content">
                    <span className="success-icon">✅</span>
                    <div className="success-text">
                      <p className="success-title">No Allowance Granted</p>
                      <p>This spender cannot spend any USDT from your wallet.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckAllowance;