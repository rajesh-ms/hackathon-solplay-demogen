// Mock Solana Web3.js for demo purposes
// This simulates the Solana Web3.js API without external dependencies

window.solanaWeb3 = {
    Connection: class Connection {
        constructor(endpoint, commitment) {
            this.endpoint = endpoint;
            this.commitment = commitment;
            console.log(`Connected to ${endpoint} with ${commitment} commitment`);
        }
        
        async getBalance(publicKey) {
            // Simulate getting balance
            await this.delay(500);
            return Math.floor(Math.random() * 5000000000); // Random lamports
        }
        
        async getLatestBlockhash() {
            await this.delay(300);
            return {
                blockhash: this.generateRandomHash(),
                lastValidBlockHeight: 200000000 + Math.floor(Math.random() * 1000000)
            };
        }
        
        async confirmTransaction(signature) {
            await this.delay(1000);
            return { value: { err: null } };
        }
        
        delay(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
        
        generateRandomHash() {
            return Array.from({ length: 44 }, () => 
                'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'[
                    Math.floor(Math.random() * 62)
                ]
            ).join('');
        }
    },
    
    PublicKey: class PublicKey {
        constructor(key) {
            this.key = typeof key === 'string' ? key : this.generateRandomKey();
        }
        
        toString() {
            return this.key;
        }
        
        generateRandomKey() {
            return Array.from({ length: 44 }, () => 
                'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'[
                    Math.floor(Math.random() * 62)
                ]
            ).join('');
        }
    },
    
    Transaction: class Transaction {
        constructor() {
            this.instructions = [];
            this.recentBlockhash = null;
            this.feePayer = null;
        }
        
        add(instruction) {
            this.instructions.push(instruction);
            return this;
        }
    },
    
    TransactionInstruction: class TransactionInstruction {
        constructor({ keys, programId, data }) {
            this.keys = keys;
            this.programId = programId;
            this.data = data;
        }
    },
    
    LAMPORTS_PER_SOL: 1000000000
};

// Mock Phantom wallet
window.solana = {
    isPhantom: true,
    isConnected: false,
    publicKey: null,
    
    async connect() {
        await this.delay(800);
        this.isConnected = true;
        this.publicKey = new solanaWeb3.PublicKey();
        console.log('Mock wallet connected:', this.publicKey.toString());
        return { publicKey: this.publicKey };
    },
    
    async disconnect() {
        this.isConnected = false;
        this.publicKey = null;
        console.log('Mock wallet disconnected');
    },
    
    async signAndSendTransaction(transaction) {
        await this.delay(1200);
        const signature = this.generateSignature();
        console.log('Mock transaction sent:', signature);
        return { signature };
    },
    
    on(event, callback) {
        // Mock event listener
        console.log(`Mock wallet listener added for: ${event}`);
    },
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
    
    generateSignature() {
        return Array.from({ length: 88 }, () => 
            'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'[
                Math.floor(Math.random() * 62)
            ]
        ).join('');
    }
};

console.log('Mock Solana Web3.js and Phantom wallet loaded for demo');