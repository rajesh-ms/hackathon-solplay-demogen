// Main application initialization and event handlers
document.addEventListener('DOMContentLoaded', async function() {
    console.log('SolPlay Demo initializing...');
    
    // Initialize all components
    await walletManager.initialize();
    await solanaIntegration.initialize();
    
    // Set up event listeners
    setupEventListeners();
    
    console.log('SolPlay Demo ready!');
});

function setupEventListeners() {
    // Wallet connection
    document.getElementById('connectWallet').addEventListener('click', async () => {
        await walletManager.connectWallet();
    });
    
    // Game controls
    document.getElementById('startGame').addEventListener('click', () => {
        clickGame.startGame();
    });
    
    document.getElementById('resetGame').addEventListener('click', () => {
        clickGame.resetGame();
    });
    
    // Blockchain interactions
    document.getElementById('saveScore').addEventListener('click', async () => {
        await solanaIntegration.saveScoreOnChain(clickGame.score);
    });
    
    document.getElementById('mintNFT').addEventListener('click', async () => {
        await solanaIntegration.mintAchievementNFT();
    });
    
    document.getElementById('createToken').addEventListener('click', async () => {
        await solanaIntegration.createGameToken();
    });
    
    // Handle wallet disconnect
    if (window.solana) {
        window.solana.on('disconnect', () => {
            walletManager.isConnected = false;
            walletManager.publicKey = null;
            
            // Reset UI
            document.getElementById('connectWallet').textContent = 'Connect Wallet';
            document.getElementById('connectWallet').disabled = false;
            document.getElementById('walletInfo').classList.add('hidden');
            
            // Disable wallet-dependent features
            document.getElementById('saveScore').disabled = true;
            document.getElementById('mintNFT').disabled = true;
            document.getElementById('createToken').disabled = true;
            
            walletManager.showMessage('Wallet disconnected', 'info');
        });
    }
}

// Add some demo data and tips
function showDemoInfo() {
    const tips = [
        "💡 This demo uses Solana devnet for safe testing",
        "🎮 Score 10+ points to unlock NFT minting",
        "💰 Game tokens are distributed based on your score",
        "🔗 All transactions are recorded on the blockchain",
        "🚀 Perfect for hackathon showcases!"
    ];
    
    console.log('=== SolPlay Demo Tips ===');
    tips.forEach(tip => console.log(tip));
}

// Show demo info when page loads
setTimeout(showDemoInfo, 2000);