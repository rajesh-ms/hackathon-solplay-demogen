// Simple click game implementation
class ClickGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.score = 0;
        this.isPlaying = false;
        this.target = { x: 0, y: 0, radius: 30 };
        this.gameStartTime = 0;
        this.gameduration = 30000; // 30 seconds
        this.animationId = null;
        
        this.setupEventListeners();
        this.resetTarget();
        this.draw();
    }
    
    setupEventListeners() {
        this.canvas.addEventListener('click', (e) => {
            if (!this.isPlaying) return;
            
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            this.handleClick(x, y);
        });
    }
    
    startGame() {
        this.score = 0;
        this.isPlaying = true;
        this.gameStartTime = Date.now();
        this.updateScore();
        this.resetTarget();
        this.gameLoop();
        
        walletManager.showMessage('Game started! Click the yellow circles!', 'info');
        
        // End game after duration
        setTimeout(() => {
            this.endGame();
        }, this.gameduration);
    }
    
    endGame() {
        this.isPlaying = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        walletManager.showMessage(`Game over! Final score: ${this.score}`, 'info');
        
        // Check for achievements
        if (this.score >= 10) {
            walletManager.showMessage('🏆 Achievement unlocked! You can now mint an NFT!', 'success');
        }
        
        if (this.score >= 20) {
            walletManager.showMessage('💰 High score! You earned bonus game tokens!', 'success');
        }
    }
    
    resetGame() {
        this.score = 0;
        this.isPlaying = false;
        this.updateScore();
        this.resetTarget();
        this.draw();
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }
    
    handleClick(x, y) {
        const distance = Math.sqrt(
            Math.pow(x - this.target.x, 2) + Math.pow(y - this.target.y, 2)
        );
        
        if (distance <= this.target.radius) {
            this.score++;
            this.updateScore();
            this.resetTarget();
            
            // Add visual feedback
            this.showHitEffect(x, y);
        }
    }
    
    showHitEffect(x, y) {
        // Simple hit effect - change target color briefly
        this.ctx.fillStyle = '#FF6B6B';
        this.ctx.beginPath();
        this.ctx.arc(x, y, 20, 0, 2 * Math.PI);
        this.ctx.fill();
        
        setTimeout(() => {
            this.draw();
        }, 100);
    }
    
    resetTarget() {
        this.target.x = Math.random() * (this.canvas.width - 2 * this.target.radius) + this.target.radius;
        this.target.y = Math.random() * (this.canvas.height - 2 * this.target.radius) + this.target.radius;
    }
    
    updateScore() {
        document.getElementById('score').textContent = this.score;
    }
    
    gameLoop() {
        if (!this.isPlaying) return;
        
        this.draw();
        
        // Move target occasionally for more challenge
        if (Math.random() < 0.02) {
            this.resetTarget();
        }
        
        this.animationId = requestAnimationFrame(() => this.gameLoop());
    }
    
    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw target
        this.ctx.fillStyle = '#FFD700';
        this.ctx.beginPath();
        this.ctx.arc(this.target.x, this.target.y, this.target.radius, 0, 2 * Math.PI);
        this.ctx.fill();
        
        // Draw target border
        this.ctx.strokeStyle = '#FFA500';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
        
        // Draw crosshair on target
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(this.target.x - 10, this.target.y);
        this.ctx.lineTo(this.target.x + 10, this.target.y);
        this.ctx.moveTo(this.target.x, this.target.y - 10);
        this.ctx.lineTo(this.target.x, this.target.y + 10);
        this.ctx.stroke();
        
        // Draw game info if playing
        if (this.isPlaying) {
            const timeLeft = Math.max(0, this.gameDuration - (Date.now() - this.gameStartTime));
            this.ctx.fillStyle = '#FFF';
            this.ctx.font = '16px Arial';
            this.ctx.fillText(`Time: ${Math.ceil(timeLeft / 1000)}s`, 10, 25);
        } else {
            // Draw instructions
            this.ctx.fillStyle = '#FFF';
            this.ctx.font = '18px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Click "Start Game" to begin!', this.canvas.width / 2, this.canvas.height / 2 - 30);
            this.ctx.font = '14px Arial';
            this.ctx.fillText('Click the yellow targets to score points', this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.textAlign = 'left';
        }
    }
}

// Global game instance
window.clickGame = new ClickGame();