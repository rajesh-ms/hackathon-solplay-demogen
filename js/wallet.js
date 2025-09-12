// Wallet connection and management
class WalletManager {
    constructor() {
        this.connection = null;
        this.wallet = null;
        this.publicKey = null;
        this.isConnected = false;
    }
    
    async initialize() {
        // Initialize Solana connection (using devnet for demo)
        this.connection = new solanaWeb3.Connection(
            'https://api.devnet.solana.com',
            'confirmed'
        );
        
        console.log('Wallet manager initialized');
    }
    
    async connectWallet() {
        try {
            // Check if Phantom wallet is available
            if (window.solana && window.solana.isPhantom) {
                const response = await window.solana.connect();
                this.publicKey = response.publicKey;
                this.isConnected = true;
                
                // Update UI
                this.updateWalletUI();
                
                // Get balance
                await this.updateBalance();
                
                return true;
            } else {
                this.showMessage('Phantom wallet not found. Please install Phantom wallet.', 'error');
                return false;
            }
        } catch (error) {
            console.error('Error connecting wallet:', error);
            this.showMessage('Failed to connect wallet: ' + error.message, 'error');
            return false;
        }
    }
    
    async updateBalance() {
        if (!this.isConnected || !this.publicKey) return;
        
        try {
            const balance = await this.connection.getBalance(this.publicKey);
            const solBalance = balance / solanaWeb3.LAMPORTS_PER_SOL;
            
            document.getElementById('walletBalance').textContent = solBalance.toFixed(4);
        } catch (error) {
            console.error('Error getting balance:', error);
        }
    }
    
    updateWalletUI() {
        const connectBtn = document.getElementById('connectWallet');
        const walletInfo = document.getElementById('walletInfo');
        const walletAddress = document.getElementById('walletAddress');
        
        if (this.isConnected && this.publicKey) {
            connectBtn.textContent = 'Wallet Connected';
            connectBtn.disabled = true;
            walletInfo.classList.remove('hidden');
            
            // Show shortened address
            const address = this.publicKey.toString();
            walletAddress.textContent = address.slice(0, 4) + '...' + address.slice(-4);
            
            // Enable wallet-dependent features
            this.enableWalletFeatures();
        }
    }
    
    enableWalletFeatures() {
        const saveScoreBtn = document.getElementById('saveScore');
        const mintNFTBtn = document.getElementById('mintNFT');
        const createTokenBtn = document.getElementById('createToken');
        
        saveScoreBtn.disabled = false;
        mintNFTBtn.disabled = false;
        createTokenBtn.disabled = false;
    }
    
    showMessage(message, type = 'info') {
        const statusDiv = document.getElementById('statusMessage');
        statusDiv.textContent = message;
        statusDiv.className = `status-message ${type}`;
        statusDiv.classList.remove('hidden');
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            statusDiv.classList.add('hidden');
        }, 5000);
    }
    
    async sendTransaction(transaction) {
        if (!this.isConnected || !window.solana) {
            throw new Error('Wallet not connected');
        }
        
        try {
            const { signature } = await window.solana.signAndSendTransaction(transaction);
            await this.connection.confirmTransaction(signature);
            return signature;
        } catch (error) {
            console.error('Transaction failed:', error);
            throw error;
        }
    }
}

// Global wallet manager instance
window.walletManager = new WalletManager();