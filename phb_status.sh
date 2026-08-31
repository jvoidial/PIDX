#!/data/data/com.termux/files/usr/bin/bash
# Quick status check for PHB Interference Shield

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'

echo -e "${BLUE}=== PHB Interference Shield Status ===${NC}"

# Check daemon
PID_FILE="$HOME/.phb_interference_shield.pid"
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if kill -0 "$PID" 2>/dev/null; then
        echo -e "${GREEN}✅ Daemon: Running (PID: $PID)${NC}"
    else
        echo -e "${RED}❌ Daemon: Stopped${NC}"
    fi
else
    echo -e "${RED}❌ Daemon: Not found${NC}"
fi

# Check router
TOKEN=$(cat "$HOME/.zr01_token" 2>/dev/null)
if [ -n "$TOKEN" ]; then
    HOME_INFO=$(curl -s --max-time 3 "http://192.168.1.1/jsonp_home_info?callback=Q" -H "Cookie: token=$TOKEN" 2>/dev/null)
    if [ -n "$HOME_INFO" ]; then
        NET=$(echo "$HOME_INFO" | grep -o '<networkType>[^<]*</networkType>' | sed 's/<networkType>//;s/<\/networkType>//')
        echo -e "${GREEN}✅ Network: $NET${NC}"
    else
        echo -e "${RED}❌ Cannot connect to router${NC}"
    fi
else
    echo -e "${RED}❌ No token found${NC}"
fi

# Check log
LOG_FILE="$HOME/phb_interference_shield.log"
if [ -f "$LOG_FILE" ]; then
    LOG_SIZE=$(du -h "$LOG_FILE" | cut -f1)
    LAST_ENTRY=$(tail -1 "$LOG_FILE")
    echo -e "${BLUE}📊 Log: $LOG_SIZE - Last: $LAST_ENTRY${NC}"
else
    echo -e "${YELLOW}⚠️ No log file${NC}"
fi

echo -e "${BLUE}=====================================${NC}"
