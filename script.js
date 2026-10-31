
// Simple dynamic typing effect for the header status
document.addEventListener("DOMContentLoaded", () => {
    const statusBar = document.querySelector(".status-bar");
    const originalText = statusBar.innerHTML;
    
    // Add a subtle flicker effect to the terminal text
    setInterval(() => {
        if(Math.random() > 0.8) {
            statusBar.style.opacity = 0.8;
            setTimeout(() => statusBar.style.opacity = 1, 50);
        }
    }, 1000);
});
