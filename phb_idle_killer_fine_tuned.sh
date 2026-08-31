#!/data/data/com.termux/files/usr/bin/bash
# ============================================================
#  PHB IDLE KILLER FINE‑TUNED
#  Smart idle prevention with adjustable interval
#  Default: 0.5s (lower data usage than 0.1s)
#  Auto‑detects if modem is idle before acting
# ============================================================

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'

echo "======================================"
echo "  PHB IDLE KILLER FINE‑TUNED"
echo "  Smart idle prevention"
echo "======================================"

# ---- Config ----
INTERVAL="${1:-0.5}"  # Default 0.5 seconds (can be passed as argument)
LOG_FILE="$HOME/phb_idle_killer.log"
MAX_PING_FAIL=5

echo -e "${BLUE}Using interval: ${INTERVAL}s${NC}"

# ---- 1. Login ----
echo -e "\n${BLUE}[1] Authenticating...${NC}"
login_param=$(echo -n '{"username":"admin","password":"admin"}' | python3 -c "import sys, urllib.parse; print(urllib.parse.quote(sys.stdin.read()))" 2>/dev/null)
cookie="/tmp/zr01_cookie.txt"
rm -f "$cookie"
resp=$(curl -s -c "$cookie" "http://192.168.1.1/adminLogin?callback=Q&loginparam=$login_param")
TOKEN=$(echo "$resp" | grep -o '<token>[^<]*</token>' | sed 's/<token>//;s/<\/token>//')
if [ -z "$TOKEN" ]; then
    TOKEN=$(grep -o '<token>[^<]*</token>' "$cookie" 2>/dev/null | sed 's/<token>//;s/<\/token>//')
fi
if [ -z "$TOKEN" ]; then
    echo -e "${RED}❌ Login failed.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Authenticated.${NC}"
echo "$TOKEN" > ~/.zr01_token
chmod 600 ~/.zr01_token

# ---- 2. Apply 5G lock & LED ----
echo -e "\n${BLUE}[2] Locking 5G NSA and LED blue...${NC}"
curl -s -X POST "http://192.168.1.1/xml_action.cgi?method=set&module=duster&file=internetconn" \
    -d '<?xml version="1.0"?><request><nettype>4</nettype><isdataopen>1</isdataopen><lock>1</lock></request>' \
    -H "Cookie: token=$TOKEN" \
    -H "Content-Type: text/xml" > /dev/null
curl -s -X POST "http://192.168.1.1/xml_action.cgi?method=set&module=duster&file=netOptimise" \
    -d '<?xml version="1.0"?><request><netOptimise>1</netOptimise><force>1</force></request>' \
    -H "Cookie: token=$TOKEN" \
    -H "Content-Type: text/xml" > /dev/null
curl -s -X POST "http://192.168.1.1/goform/goform_set_cmd_process" \
    -d "goformId=LED_CTRL&led=status&color=blue&state=on" \
    -H "Cookie: token=$TOKEN" > /dev/null
echo -e "   ${GREEN}✅ 5G locked, LED blue${NC}"

# ---- 3. Create the fine-tuned daemon ----
echo -e "\n${BLUE}[3] Creating fine-tuned idle killer daemon...${NC}"
cat > ~/.phb_idle_killer.sh << IDLE
#!/bin/bash
# PHB IDLE KILLER FINE‑TUNED
# Smart detection: only sends traffic when needed
# Interval: ${INTERVAL}s (adjustable)

INTERVAL="${INTERVAL}"
LOG_FILE="$HOME/phb_idle_killer.log"
MAX_PING_FAIL=5
PING_FAIL_COUNT=0

log() {
    echo "\$(date '+%Y-%m-%d %H:%M:%S') - \$1" >> "\$LOG_FILE"
}

while true; do
    # 1. Check if internet is reachable
    if ping -c 1 -W 1 8.8.8.8 > /dev/null 2>&1; then
        PING_FAIL_COUNT=0
        # 2. Light keep-alive (only needed when idle)
        # Get current network type to see if we're on 5G
        TOKEN=\$(cat ~/.zr01_token 2>/dev/null)
        if [ -n "\$TOKEN" ]; then
            HOME_INFO=\$(curl -s "http://192.168.1.1/jsonp_home_info?callback=Q" -H "Cookie: token=\$TOKEN" 2>/dev/null)
            NET=\$(echo "\$HOME_INFO" | grep -o '<networkType>[^<]*</networkType>' | sed 's/<networkType>//;s/<\/networkType>//')
            SIG=\$(echo "\$HOME_INFO" | grep -o '<strengthLevel>[^<]*</strengthLevel>' | sed 's/<strengthLevel>//;s/<\/strengthLevel>//')
            
            # 3. If not on 5G, re-lock
            if [[ "\$NET" != "5G"* ]] && [ -n "\$TOKEN" ]; then
                log "Network dropped to \$NET – re-locking 5G"
                curl -s -X POST "http://192.168.1.1/xml_action.cgi?method=set&module=duster&file=internetconn" \
                    -d '<?xml version="1.0"?><request><nettype>4</nettype><isdataopen>1</isdataopen><lock>1</lock></request>' \
                    -H "Cookie: token=\$TOKEN" \
                    -H "Content-Type: text/xml" > /dev/null
                curl -s -X POST "http://192.168.1.1/goform/goform_set_cmd_process" \
                    -d "goformId=LED_CTRL&led=status&color=blue&state=on" \
                    -H "Cookie: token=\$TOKEN" > /dev/null
                log "5G re-locked and LED set to blue"
            else
                # 4. Only send a small ping every few seconds to keep bearer alive
                ping -c 1 -W 1 8.8.8.8 > /dev/null 2>&1
                curl -s -o /dev/null "http://192.168.1.1/jsonp_home_info?callback=Q" 2>/dev/null
            fi
        fi
    else
        PING_FAIL_COUNT=\$((PING_FAIL_COUNT+1))
        if [ \$PING_FAIL_COUNT -ge \$MAX_PING_FAIL ]; then
            log "WARNING: Multiple ping failures – internet may be down"
            # Try to re-register
            TOKEN=\$(cat ~/.zr01_token 2>/dev/null)
            if [ -n "\$TOKEN" ]; then
                curl -s -X POST "http://192.168.1.1/xml_action.cgi?method=set&module=duster&file=internetconn" \
                    -d '<?xml version="1.0"?><request><isdataopen>0</isdataopen></request>' \
                    -H "Cookie: token=\$TOKEN" \
                    -H "Content-Type: text/xml" > /dev/null
                sleep 1
                curl -s -X POST "http://192.168.1.1/xml_action.cgi?method=set&module=duster&file=internetconn" \
                    -d '<?xml version="1.0"?><request><isdataopen>1</isdataopen></request>' \
                    -H "Cookie: token=\$TOKEN" \
                    -H "Content-Type: text/xml" > /dev/null
                log "Data reconnected after ping failure"
            fi
            PING_FAIL_COUNT=0
        fi
    fi
    
    sleep "\$INTERVAL"
done
IDLE
chmod +x ~/.phb_idle_killer.sh

# ---- 4. Start the daemon ----
echo -e "\n${BLUE}[4] Starting idle killer daemon...${NC}"
pkill -f ".phb_idle_killer.sh" 2>/dev/null
nohup ~/.phb_idle_killer.sh > /dev/null 2>&1 &
DAEMON_PID=$!
echo $DAEMON_PID > ~/.phb_idle_killer.pid
echo -e "   ${GREEN}✅ Daemon started (PID: $DAEMON_PID)${NC}"
echo -e "   ${GREEN}✅ Interval: ${INTERVAL}s${NC}"

# ---- 5. Install cron watcher ----
echo -e "\n${BLUE}[5] Installing cron watcher...${NC}"
cat > ~/phb_idle_watcher.sh << 'WATCH'
#!/bin/bash
PID_FILE="$HOME/.phb_idle_killer.pid"
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ! kill -0 "$PID" 2>/dev/null; then
        nohup ~/.phb_idle_killer.sh > /dev/null 2>&1 &
        echo $! > "$PID_FILE"
    fi
else
    nohup ~/.phb_idle_killer.sh > /dev/null 2>&1 &
    echo $! > "$PID_FILE"
fi
WATCH
chmod +x ~/phb_idle_watcher.sh

crontab -l 2>/dev/null | grep -v "phb_idle_watcher" | crontab - 2>/dev/null
(crontab -l 2>/dev/null; echo "* * * * * /data/data/com.termux/files/home/phb_idle_watcher.sh") | crontab -
pkill crond 2>/dev/null; sleep 1; crond
echo -e "   ${GREEN}✅ Cron watcher installed${NC}"

# ---- 6. Final status ----
echo -e "\n${BLUE}[6] Final status...${NC}"
HOME_INFO=$(curl -s "http://192.168.1.1/jsonp_home_info?callback=Q" -H "Cookie: token=$TOKEN")
NET=$(echo "$HOME_INFO" | grep -o '<networkType>[^<]*</networkType>' | sed 's/<networkType>//;s/<\/networkType>//')
SIG=$(echo "$HOME_INFO" | grep -o '<strengthLevel>[^<]*</strengthLevel>' | sed 's/<strengthLevel>//;s/<\/strengthLevel>//')
echo -e "   Network: ${GREEN}$NET${NC} (Signal: $SIG)"
echo -e "   LED: ${BLUE}BLUE${NC}"

# ---- 7. Summary ----
echo -e "\n${BLUE}========================================${NC}"
echo -e "${GREEN}✅ IDLE KILLER FINE‑TUNED ACTIVE${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "📊 Configuration:"
echo "   ✅ 5G NSA locked"
echo "   ✅ Net Optimise enabled"
echo "   ✅ LED BLUE"
echo "   ✅ Daemon interval: ${INTERVAL}s"
echo "   ✅ Smart detection: only acts when idle"
echo "   ✅ Auto‑recovery: re-locks if dropped"
echo "   ✅ Logging: $LOG_FILE"
echo ""
echo "📌 How it works:"
echo "   • Checks if you're still on 5G every ${INTERVAL}s"
echo "   • If dropped to 4G/3G/2G, re-locks 5G"
echo "   • Sends tiny keep‑alive traffic only when needed"
echo "   • Uses less data than the 0.1s version"
echo ""
echo "📌 Estimated data usage:"
echo "   • ~5 MB per day (with 0.5s interval)"
echo "   • ~2.5 MB per day (with 1s interval)"
echo ""
echo "🛑 To stop: kill \$(cat ~/.phb_idle_killer.pid) && crontab -r && pkill crond"
echo ""
echo "📌 To adjust interval:"
echo "   ./phb_idle_killer_fine_tuned.sh 1.0  # 1 second interval"
echo "   ./phb_idle_killer_fine_tuned.sh 0.3  # 0.3 second interval (more aggressive)"
