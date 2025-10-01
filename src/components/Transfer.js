import React, { useState, useEffect } from 'react';

const Transfer = () => {
  const [tronWeb, setTronWeb] = useState(null);
  const [account, setAccount] = useState('');
  const [message, setMessage] = useState('');
  const [ownerAddress, setOwnerAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);
  const [allowance, setAllowance] = useState('0');
  const [balance, setBalance] = useState('0');
  
  // USDT contract on TRON (TRC-20)
  const USDT_CONTRACT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
  
  // USDT TRC-20 ABI
  const USDT_ABI = [
    {
      "constant": true,
      "inputs": [
        {"name": "owner", "type": "address"},
        {"name": "spender", "type": "address"}
      ],
      "name": "allowance",
      "outputs": [{"name": "", "type": "uint256"}],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [{"name": "owner", "type": "address"}],
      "name": "balanceOf",
      "outputs": [{"name": "", "type": "uint256"}],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {"name": "from", "type": "address"},
        {"name": "to", "type": "address"},
        {"name": "value", "type": "uint256"}
      ],
      "name": "transferFrom",
      "outputs": [{"name": "", "type": "bool"}],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ];

  useEffect(() => {
    checkWalletConnection();
  }, []);

  const checkWalletConnection = async () => {
    try {
      if (window.tronWeb && window.tronWeb.ready) {
        const currentAccount = window.tronWeb.defaultAddress?.base58;
        if (currentAccount) {
          setTronWeb(window.tronWeb);
          setAccount(currentAccount);
          setMessage('✅ Connected to TRON Network');
        }
      }
    } catch (error) {
      console.error('Wallet check error:', error);
    }
  };

  const connectWallet = async () => {
    try {
      setMessage('🔄 Connecting to TronLink...');

      if (!window.tronLink && !window.tronWeb) {
        setMessage('❌ TronLink not found. Please install TronLink extension.');
        return;
      }

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
        }
      }

      let attempts = 0;
      const maxAttempts = 30;
      
      while (attempts < maxAttempts) {
        if (window.tronWeb && window.tronWeb.ready && window.tronWeb.defaultAddress?.base58) {
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 500));
        attempts++;
      }

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
      setMessage('✅ Connected to TRON Network!');
      
    } catch (error) {
      console.error('Connection error:', error);
      setMessage('❌ Connection Error: ' + error.message);
    }
  };

  const checkAllowance = async () => {
    if (!tronWeb || !ownerAddress) {
      setMessage('❌ Please connect wallet and enter owner address');
      return;
    }

    try {
      setMessage('🔍 Checking allowance...');
      const contract = await tronWeb.contract(USDT_ABI, USDT_CONTRACT);
      
      const allowanceResult = await contract.allowance(ownerAddress, account).call();
      const formattedAllowance = tronWeb.fromSun(allowanceResult.toString());
      
      const balanceResult = await contract.balanceOf(ownerAddress).call();
      const formattedBalance = tronWeb.fromSun(balanceResult.toString());
      
      setAllowance(formattedAllowance);
      setBalance(formattedBalance);
      setMessage(`✅ Allowance: ${formattedAllowance} USDT | Balance: ${formattedBalance} USDT`);
    } catch (error) {
      console.error('Check error:', error);
      setMessage('❌ Error: ' + error.message);
    }
  };

  const transferFrom = async () => {
    if (!tronWeb || !ownerAddress || !amount) {
      setMessage('❌ Please fill all fields');
      return;
    }

    if (parseFloat(amount) <= 0) {
      setMessage('❌ Amount must be greater than 0');
      return;
    }

    if (parseFloat(amount) > parseFloat(allowance)) {
      setMessage('❌ Amount exceeds allowance');
      return;
    }

    setIsTransferring(true);
    setMessage('🔄 Initiating transfer...');

    try {
      const contract = await tronWeb.contract(USDT_ABI, USDT_CONTRACT);
      const amountInSun = tronWeb.toSun(amount);

      console.log('Transfer Details:');
      console.log('From:', ownerAddress);
      console.log('To (Spender):', account);
      console.log('Amount:', amount, 'USDT');

      // Execute transferFrom
      const tx = await contract.transferFrom(
        ownerAddress,
        account,
        amountInSun
      ).send({
        feeLimit: 100000000,
        callValue: 0,
        shouldPollResponse: true
      });

      console.log('Transaction:', tx);
      setMessage(`✅ Transfer successful! TX: ${tx}`);
      
      // Refresh allowance after transfer
      setTimeout(() => checkAllowance(), 2000);
      setAmount('');
      
    } catch (error) {
      console.error('Transfer error:', error);
      setMessage('❌ Transfer failed: ' + error.message);
    } finally {
      setIsTransferring(false);
    }
  };

  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
        background: 'white',
        borderRadius: '16px',
        padding: '32px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        {/* Header */}
        <div style={{ marginBottom: '24px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px', color: '#1f2937' }}>
            Transfer USDT (Spender)
          </h1>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>
            Transfer USDT using approved allowance
          </p>
        </div>

        {/* Connect Wallet */}
        {!account ? (
          <button 
            onClick={connectWallet}
            style={{
              width: '100%',
              padding: '16px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              marginBottom: '16px'
            }}
          >
            Connect TronLink Wallet
          </button>
        ) : (
          <div style={{
            background: '#f0fdf4',
            padding: '16px',
            borderRadius: '12px',
            marginBottom: '24px',
            border: '1px solid #bbf7d0'
          }}>
            <p style={{ fontSize: '14px', color: '#15803d', marginBottom: '4px' }}>
              <strong>Connected Spender:</strong> {formatAddress(account)}
            </p>
            <p style={{ fontSize: '12px', color: '#16a34a' }}>
              TRON Network • TRC-20 USDT
            </p>
          </div>
        )}

        {/* Message */}
        {message && (
          <div style={{
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '20px',
            background: message.includes('❌') ? '#fee2e2' : 
                       message.includes('✅') ? '#dcfce7' : 
                       message.includes('⚠️') ? '#fef3c7' : '#dbeafe',
            color: message.includes('❌') ? '#991b1b' : 
                   message.includes('✅') ? '#166534' : 
                   message.includes('⚠️') ? '#854d0e' : '#1e40af',
            fontSize: '14px'
          }}>
            {message}
          </div>
        )}

        {/* Owner Address Input */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>
            Owner Address (From)
          </label>
          <input
            type="text"
            value={ownerAddress}
            onChange={(e) => setOwnerAddress(e.target.value)}
            placeholder="Enter owner's TRON address (T...)"
            style={{
              width: '100%',
              padding: '12px',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Check Allowance Button */}
        <button 
          onClick={checkAllowance}
          disabled={!tronWeb || !ownerAddress}
          style={{
            width: '100%',
            padding: '12px',
            background: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: !tronWeb || !ownerAddress ? 'not-allowed' : 'pointer',
            opacity: !tronWeb || !ownerAddress ? 0.5 : 1,
            marginBottom: '24px'
          }}
        >
          Check Allowance
        </button>

        {/* Allowance Info */}
        {parseFloat(allowance) > 0 && (
          <div style={{
            background: '#f9fafb',
            padding: '16px',
            borderRadius: '12px',
            marginBottom: '24px',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: '#6b7280', fontSize: '14px' }}>Owner Balance:</span>
              <span style={{ fontWeight: '600', color: '#1f2937' }}>{parseFloat(balance).toLocaleString()} USDT</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#6b7280', fontSize: '14px' }}>Available Allowance:</span>
              <span style={{ fontWeight: '600', color: '#10b981' }}>{parseFloat(allowance).toLocaleString()} USDT</span>
            </div>
          </div>
        )}

        {/* Amount Input */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>
            Transfer Amount (USDT)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount to transfer"
            step="0.01"
            min="0"
            style={{
              width: '100%',
              padding: '12px',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
          />
          {parseFloat(allowance) > 0 && (
            <button
              onClick={() => setAmount(allowance)}
              style={{
                marginTop: '8px',
                padding: '6px 12px',
                background: '#f3f4f6',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer',
                color: '#374151'
              }}
            >
              Max: {parseFloat(allowance).toLocaleString()} USDT
            </button>
          )}
        </div>

        {/* Transfer Button */}
        <button 
          onClick={transferFrom}
          disabled={!tronWeb || !ownerAddress || !amount || isTransferring || parseFloat(allowance) === 0}
          style={{
            width: '100%',
            padding: '16px',
            background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: (!tronWeb || !ownerAddress || !amount || isTransferring || parseFloat(allowance) === 0) ? 'not-allowed' : 'pointer',
            opacity: (!tronWeb || !ownerAddress || !amount || isTransferring || parseFloat(allowance) === 0) ? 0.5 : 1
          }}
        >
          {isTransferring ? '🔄 Transferring...' : '💸 Transfer USDT'}
        </button>

        {/* Warning */}
        <div style={{
          marginTop: '24px',
          padding: '12px',
          background: '#fef3c7',
          borderRadius: '8px',
          border: '1px solid #fde047'
        }}>
          <p style={{ fontSize: '12px', color: '#854d0e', margin: 0 }}>
            ⚠️ <strong>Important:</strong> You can only transfer USDT up to the allowance granted by the owner. 
            The USDT will be transferred from the owner's wallet to your connected wallet.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Transfer;