// Solana blockchain integration for gaming features
class SolanaGameIntegration {
    constructor() {
        this.connection = null;
        this.programId = null; // Would be actual program ID in production
    }
    
    async initialize() {
        this.connection = walletManager.connection;
    }
    
    async saveScoreOnChain(score) {
        if (!walletManager.isConnected) {
            walletManager.showMessage('Please connect your wallet first', 'error');
            return;
        }
        
        try {
            walletManager.showMessage('Saving score on-chain...', 'info');
            
            // Create a simple transaction to demonstrate on-chain interaction
            // In a real implementation, this would call a custom program
            const transaction = new solanaWeb3.Transaction();
            
            // Add a memo instruction with the score
            const memoInstruction = new solanaWeb3.TransactionInstruction({
                keys: [{ pubkey: walletManager.publicKey, isSigner: true, isWritable: false }],
                programId: new solanaWeb3.PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
                data: new TextEncoder().encode(`SolPlay Game Score: ${score} - ${new Date().toISOString()}`)
            });
            
            transaction.add(memoInstruction);
            
            // Get recent blockhash
            const { blockhash } = await this.connection.getLatestBlockhash();
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = walletManager.publicKey;
            
            // Send transaction
            const signature = await walletManager.sendTransaction(transaction);
            
            walletManager.showMessage(`Score saved! Transaction: ${signature.slice(0, 8)}...`, 'success');
            
            // Update balance after transaction
            setTimeout(() => {
                walletManager.updateBalance();
            }, 2000);
            
        } catch (error) {
            console.error('Error saving score:', error);
            walletManager.showMessage('Failed to save score: ' + error.message, 'error');
        }
    }
    
    async mintAchievementNFT() {
        if (!walletManager.isConnected) {
            walletManager.showMessage('Please connect your wallet first', 'error');
            return;
        }
        
        if (clickGame.score < 10) {
            walletManager.showMessage('You need at least 10 points to mint an achievement NFT!', 'error');
            return;
        }
        
        try {
            walletManager.showMessage('Minting achievement NFT...', 'info');
            
            // In a real implementation, this would interact with Metaplex or custom NFT program
            // For demo purposes, we'll create a transaction with metadata
            const transaction = new solanaWeb3.Transaction();
            
            // Add a memo with NFT metadata
            const nftMetadata = {
                name: 'SolPlay Achievement',
                description: `Scored ${clickGame.score} points in SolPlay Demo Game`,
                image: 'https://example.com/achievement.png',
                attributes: [
                    { trait_type: 'Score', value: clickGame.score },
                    { trait_type: 'Game', value: 'Click Challenge' },
                    { trait_type: 'Date', value: new Date().toISOString() }
                ]
            };
            
            const memoInstruction = new solanaWeb3.TransactionInstruction({
                keys: [{ pubkey: walletManager.publicKey, isSigner: true, isWritable: false }],
                programId: new solanaWeb3.PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
                data: new TextEncoder().encode(`NFT Mint: ${JSON.stringify(nftMetadata)}`)
            });
            
            transaction.add(memoInstruction);
            
            // Get recent blockhash
            const { blockhash } = await this.connection.getLatestBlockhash();
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = walletManager.publicKey;
            
            // Send transaction
            const signature = await walletManager.sendTransaction(transaction);
            
            walletManager.showMessage(`🎉 Achievement NFT minted! Tx: ${signature.slice(0, 8)}...`, 'success');
            
        } catch (error) {
            console.error('Error minting NFT:', error);
            walletManager.showMessage('Failed to mint NFT: ' + error.message, 'error');
        }
    }
    
    async createGameToken() {
        if (!walletManager.isConnected) {
            walletManager.showMessage('Please connect your wallet first', 'error');
            return;
        }
        
        try {
            walletManager.showMessage('Creating game token...', 'info');
            
            // In a real implementation, this would create an SPL token
            // For demo purposes, we'll simulate token creation
            const transaction = new solanaWeb3.Transaction();
            
            const tokenInfo = {
                name: 'SolPlay Coins',
                symbol: 'SPC',
                decimals: 9,
                supply: 1000000,
                description: 'In-game currency for SolPlay ecosystem'
            };
            
            const memoInstruction = new solanaWeb3.TransactionInstruction({
                keys: [{ pubkey: walletManager.publicKey, isSigner: true, isWritable: false }],
                programId: new solanaWeb3.PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
                data: new TextEncoder().encode(`Token Creation: ${JSON.stringify(tokenInfo)}`)
            });
            
            transaction.add(memoInstruction);
            
            // Get recent blockhash
            const { blockhash } = await this.connection.getLatestBlockhash();
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = walletManager.publicKey;
            
            // Send transaction
            const signature = await walletManager.sendTransaction(transaction);
            
            walletManager.showMessage(`💰 Game token created! Tx: ${signature.slice(0, 8)}...`, 'success');
            
            // Simulate distributing tokens based on score
            if (clickGame.score > 0) {
                const tokensEarned = clickGame.score * 10;
                walletManager.showMessage(`You earned ${tokensEarned} SPC tokens!`, 'success');
            }
            
        } catch (error) {
            console.error('Error creating token:', error);
            walletManager.showMessage('Failed to create token: ' + error.message, 'error');
        }
    }
    
    // Utility function to get transaction explorer URL
    getExplorerUrl(signature) {
        return `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
    }
}

// Global Solana integration instance
window.solanaIntegration = new SolanaGameIntegration();