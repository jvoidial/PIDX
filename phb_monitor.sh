#!/data/data/com.termux/files/usr/bin/bash
# ============================================================
#  PHB Interference Shield - Live Monitor Dashboard
#  Real-time monitoring for Suncomm CPE Router
# ============================================================

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; PURPLE='\033[0;35m'; CYAN='\033[0;36m'; NC='\033[0m'
LOG_FILE="$HOME/phb_interference_shield.log"
PID_FILE="$HOME/.phb_interference_shield.pid"
TOKEN_FILE="$HOME/.zr01_token"

# Clear screen and hide cursor
clear
tput civis

cleanup() {
    tput cnorm  # Show cursor
    echo -e "\n${GREEN}Monitor stopped.${NC}"
    exit 0
}
trap cleanup INT TERM

while true; do
    # Move to home position
    tput cup 0 0
    
    echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║     PHB INTERFERENCE SHIELD - LIVE MONITOR v1.0       ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    # Check daemon status
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if kill -0 "$PID" 2>/dev/null; then
            echo -e "${GREEN}● Daemon Status: RUNNING${NC} (PID: $PID)"
        else
            echo -e "${RED}● Daemon Status: STOPPED${NC}"
        fi
    else
        echo -e "${RED}● Daemon Status: NOT FOUND${NC}"
    fi
    
    # Get current router status
    TOKEN=$(cat "$TOKEN_FILE" 2>/dev/null)
    if [ -n "$TOKEN" ]; then
        HOME_INFO=$(curl -s --max-time 3 "http://192.168.1.1/jsonp_home_info?callback=Q" -H "Cookie: token=$TOKEN" 2>/dev/null)
        
        if [ -n "$HOME_INFO" ]; then
            NET=$(echo "$HOME_INFO" | grep -o '<networkType>[^<]*</networkType>' | sed 's/<networkType>//;s/<\/networkType>//')
            SIG=$(echo "$HOME_INFO" | grep -o '<strengthLevel>[^<]*</strengthLevel>' | sed 's/<strengthLevel>//;s/<\/strengthLevel>//')
            BAND=$(echo "$HOME_INFO" | grep -o '<band>[^<]*</band>' | sed 's/<band>//;s/<\/band>//')
            PCI=$(echo "$HOME_INFO" | grep -o '<pci>[^<]*</pci>' | sed 's/<pci>//;s/<\/pci>//')
            CELL=$(echo "$HOME_INFO" | grep -o '<cellId>[^<]*</cellId>' | sed 's/<cellId>//;s/<\/cellId>//')
            
            echo -e "${CYAN}┌─── Router Status ───┐${NC}"
            echo -e "${CYAN}│${NC} Network: ${GREEN}$NET${NC}"
            echo -e "${CYAN}│${NC} Signal: ${GREEN}$SIG/5${NC}"
            echo -e "${CYAN}│${NC} Band: ${GREEN}$BAND${NC}"
            echo -e "${CYAN}│${NC} PCI: ${GREEN}$PCI${NC}"
            echo -e "${CYAN}│${NC} Cell ID: ${GREEN}$CELL${NC}"
            echo -e "${CYAN}└─────────────────────┘${NC}"
        fi
    fi
    
    echo ""
    echo -e "${YELLOW}┌─── Interference Log (Last 10 Events) ───┐${NC}"
    if [ -f "$LOG_FILE" ]; then
        tail -10 "$LOG_FILE" | while IFS= read -r line; do
            if [[ "$line" == *"⚠️"* ]] || [[ "$line" == *"EMERGENCY"* ]]; then
                echo -e "${RED}$line${NC}"
            elif [[ "$line" == *"✅"* ]]; then
                echo -e "${GREEN}$line${NC}"
            else
                echo -e "${NC}$line${NC}"
            fi
        done
    else
        echo -e "${YELLOW}No log file found${NC}"
    fi
    echo -e "${YELLOW}└────────────────────────────────────────────┘${NC}"
    
    echo ""
    echo -e "${PURPLE}┌─── Statistics ───┐${NC}"
    
    # Count interference events
    INTERFERENCE_COUNT=$(grep -c "⚠️ Interference detected" "$LOG_FILE" 2>/dev/null || echo "0")
    RECOVERY_COUNT=$(grep -c "EMERGENCY RECOVERY" "$LOG_FILE" 2>/dev/null || echo "0")
    SUCCESS_COUNT=$(grep -c "✅ Signal recovered" "$LOG_FILE" 2>/dev/null || echo "0")
    
    echo -e "${PURPLE}│${NC} Interference Events: ${RED}$INTERFERENCE_COUNT${NC}"
    echo -e "${PURPLE}│${NC} Emergency Recoveries: ${YELLOW}$RECOVERY_COUNT${NC}"
    echo -e "${PURPLE}│${NC} Successful Recoveries: ${GREEN}$SUCCESS_COUNT${NC}"
    echo -e "${PURPLE}└──────────────────┘${NC}"
    
    echo ""
    echo -e "${BLUE}Press Ctrl+C to exit${NC}"
    echo -e "${CYAN}Refreshing every 2 seconds...${NC}"
    
    sleep 2
done
