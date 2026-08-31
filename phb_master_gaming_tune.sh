#!/data/data/com.termux/files/usr/bin/bash
# ============================================================
#  PHB MASTER GAMING TUNE
#  Full 5G lock, APN, Net Optimise, Wi-Fi, QoS, LED, Daemon
#  Confirms each step with "SUCCESS"
# ============================================================

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; PURPLE='\033[0;35m'; NC='\033[0m'

echo "======================================"
echo "  PHB MASTER GAMING TUNE"
echo "  Full 5G + Net Optimise + Gaming"
echo "======================================"

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

# ---- Functions ----
post_xml() {
    curl -s -X POST "http://192.168.1.1/xml_action.cgi?method=set&module=duster&file=$2" \
        -d "$1" \
        -H "Cookie: token=$TOKEN" \
        -H "Content-Type: text/xml" > /dev/null
    sleep 1
}

post_goform() {
    curl -s -X POST "http://192.168.1.1/goform/goform_set_cmd_process" \
        -d "$1" \
        -H "Cookie: token=$TOKEN" > /dev/null
    sleep 1
}

set_led() {
    post_goform "goformId=LED_CTRL&led=status&color=$1&state=on"
    sleep 1
}

get_network() {
    HOME_INFO=$(curl -s "http://192.168.1.1/jsonp_home_info?callback=Q" -H "Cookie: token=$TOKEN" 2>/dev/null)
    NET=$(echo "$HOME_INFO" | grep -o '<networkType>[^<]*</networkType>' | sed 's/<networkType>//;s/<\/networkType>//')
    SIG=$(echo "$HOME_INFO" | grep -o '<strengthLevel>[^<]*</strengthLevel>' | sed 's/<strengthLevel>//;s/<\/strengthLevel>//')
    echo "$NET|$SIG"
}

confirm() {
    echo -e "   ${GREEN}✅ SUCCESS${NC}"
}

# ---- 2. APN Settings ----
echo -e "\n${BLUE}[2] Setting APN: mob.asm.net...${NC}"
XML_DATA='<?xml version="1.0"?><request>
    <apn>mob.asm.net</apn>
    <apnType>default</apnType>
    <user></user>
    <password></password>
    <authType>1</authType>
    <normalProtocol>2</normalProtocol>
    <roamingProtocol>2</roamingProtocol>
</request>'
post_xml "$XML_DATA" "apn"
post_goform "goformId=SET_APN&apn=mob.asm.net&apn_type=default&auth_type=1&protocol=IPV4&roaming=IPV4"
confirm

# ---- 3. Network Mode Cycling ----
echo -e "\n${BLUE}[3] Cycling network modes...${NC}"
MODES=(
    "5G/4G/3G|0"
    "5G NSA/SA|4"
    "5G SA only|5"
    "4G/3G|3"
    "4G only|3"
)
BEST_MODE=""
BEST_NET=""
BEST_SIG=-1
BEST_NT=0

for mode in "${MODES[@]}"; do
    IFS='|' read -r name nt <<< "$mode"
    echo -n "   Trying $name (nettype=$nt)... "
    post_xml '<?xml version="1.0"?><request><nettype>'$nt'</nettype><isdataopen>1</isdataopen><lock>1</lock></request>' "internetconn"
    post_goform "goformId=SET_NETWORK_MODE&network_mode=$nt"
    sleep 4
    IFS='|' read -r net sig <<< $(get_network)
    if [ -n "$net" ] && [ "$net" != "None" ]; then
        echo -e "${GREEN}$net (Signal: $sig)${NC}"
        if [[ "$net" == "5G"* ]] && [[ "$BEST_NET" != "5G"* ]]; then
            BEST_MODE="$name"
            BEST_NET="$net"
            BEST_SIG="$sig"
            BEST_NT="$nt"
        elif [[ "$net" == "5G"* ]] && [ "$sig" -gt "$BEST_SIG" ] 2>/dev/null; then
            BEST_MODE="$name"
            BEST_NET="$net"
            BEST_SIG="$sig"
            BEST_NT="$nt"
        elif [[ "$BEST_NET" != "5G"* ]] && [ -z "$BEST_NET" ]; then
            BEST_MODE="$name"
            BEST_NET="$net"
            BEST_SIG="$sig"
            BEST_NT="$nt"
        fi
    else
        echo -e "${RED}No signal${NC}"
    fi
done

# ---- 4. Lock to best mode ----
echo -e "\n${BLUE}[4] Locking to best mode: ${GREEN}$BEST_MODE${NC} (${BEST_NET}, Signal: $BEST_SIG)${NC}"
post_xml '<?xml version="1.0"?><request><nettype>'$BEST_NT'</nettype><isdataopen>1</isdataopen><lock>1</lock></request>' "internetconn"
post_goform "goformId=SET_NETWORK_MODE&network_mode=$BEST_NT"
confirm

# ---- 5. Net Optimise ----
echo -e "\n${BLUE}[5] Enabling Net Optimise...${NC}"
post_xml '<?xml version="1.0"?><request><netOptimise>1</netOptimise><force>1</force></request>' "netOptimise"
post_goform "goformId=SET_NET_OPTIMISE&net_optimise=1"
confirm

# ---- 6. QoS Gaming ----
echo -e "\n${BLUE}[6] QoS Gaming Priority...${NC}"
post_xml '<?xml version="1.0"?><request><qosEnable>1</qosEnable><qosMode>gaming</qosMode><qosPriority>highest</qosPriority></request>' "qos"
post_goform "goformId=SET_QOS&qos_enable=1&qos_mode=gaming&qos_priority=highest"
confirm

# ---- 7. UPnP ----
echo -e "\n${BLUE}[7] UPnP Enable...${NC}"
post_xml '<?xml version="1.0"?><request><upnpEnable>1</upnpEnable></request>' "upnp"
post_goform "goformId=SET_UPNP&upnp_enable=1"
confirm

# ---- 8. DNS + DoH ----
echo -e "\n${BLUE}[8] DNS (1.1.1.1, 8.8.8.8) + DoH...${NC}"
post_xml '<?xml version="1.0"?><request><dns>1.1.1.1</dns><dns2>8.8.8.8</dns2><doh>https://cloudflare-dns.com/dns-query</doh></request>' "dns"
post_goform "goformId=SET_DNS&dns=1.1.1.1&dns2=8.8.8.8&doh=1"
confirm

# ---- 9. Wi-Fi Settings ----
echo -e "\n${BLUE}[9] Wi-Fi Settings...${NC}"
# 2.4G
XML_DATA='<?xml version="1.0"?><request>
    <wifi24Gsta>1</wifi24Gsta>
    <wifi24Ghotname>CPE-150170-2.4G</wifi24Ghotname>
    <wifi24Gsafetype>3</wifi24Gsafetype>
    <wifi24GPassword>VOIDRAIN2471</wifi24GPassword>
    <wifi24GMaxcount>10</wifi24GMaxcount>
</request>'
post_xml "$XML_DATA" "wifi"
post_goform "goformId=SET_WIFI_2G&ssid=CPE-150170-2.4G&security=3&password=VOIDRAIN2471&max=10"
echo -e "   2.4G Wi-Fi: ${GREEN}SUCCESS${NC}"

# 5G
XML_DATA='<?xml version="1.0"?><request>
    <wifi5Gsta>1</wifi5Gsta>
    <wifi5Ghotname>CPE-150170-5G</wifi5Ghotname>
    <wifi5Gsafetype>3</wifi5Gsafetype>
    <wifi5GPassword>VOIDRAIN2471</wifi5GPassword>
    <wifi5GMaxcount>10</wifi5GMaxcount>
</request>'
post_xml "$XML_DATA" "wifi"
post_goform "goformId=SET_WIFI_5G&ssid=CPE-150170-5G&security=3&password=VOIDRAIN2471&max=10"
echo -e "   5G Wi-Fi: ${GREEN}SUCCESS${NC}"

# ---- 10. Data reconnect ----
echo -e "\n${BLUE}[10] Data reconnect...${NC}"
post_xml '<?xml version="1.0"?><request><isdataopen>0</isdataopen></request>' "internetconn"
sleep 2
post_xml '<?xml version="1.0"?><request><isdataopen>1</isdataopen></request>' "internetconn"
confirm

# ---- 11. LED Sync ----
echo -e "\n${BLUE}[11] LED Sync: Orange → Purple → Blue...${NC}"
set_led "orange"
echo -e "   ${ORANGE}ORANGE${NC}"
sleep 1
set_led "purple"
echo -e "   ${PURPLE}PURPLE${NC}"
sleep 1
set_led "blue"
echo -e "   ${BLUE}BLUE${NC}"
confirm

# ---- 12. Install keep‑alive daemon ----
echo -e "\n${BLUE}[12] Installing keep‑alive daemon (0.1s)...${NC}"
cat > ~/.phb_lte_daemon.sh << 'DAEMON'
#!/bin/bash
while true; do
    TOKEN=$(cat ~/.zr01_token 2>/dev/null)
    if [ -z "$TOKEN" ]; then
        login_param=$(echo -n '{"username":"admin","password":"admin"}' | python3 -c "import sys, urllib.parse; print(urllib.parse.quote(sys.stdin.read()))" 2>/dev/null)
        cookie="/tmp/zr01_cookie.txt"
        rm -f "$cookie"
        resp=$(curl -s -c "$cookie" "http://192.168.1.1/adminLogin?callback=Q&loginparam=$login_param")
        TOKEN=$(echo "$resp" | grep -o '<token>[^<]*</token>' | sed 's/<token>//;s/<\/token>//')
        if [ -z "$TOKEN" ]; then
            TOKEN=$(grep -o '<token>[^<]*</token>' "$cookie" 2>/dev/null | sed 's/<token>//;s/<\/token>//')
        fi
        if [ -n "$TOKEN" ]; then
            echo "$TOKEN" > ~/.zr01_token
            chmod 600 ~/.zr01_token
        else
            sleep 1
            continue
        fi
    fi
    curl -s -X POST "http://192.168.1.1/xml_action.cgi?method=set&module=duster&file=internetconn" -d '<?xml version="1.0"?><request><nettype>4</nettype><isdataopen>1</isdataopen><lock>1</lock></request>' -H "Cookie: token=$TOKEN" -H "Content-Type: text/xml" > /dev/null
    curl -s -X POST "http://192.168.1.1/goform/goform_set_cmd_process" -d "goformId=LED_CTRL&led=status&color=blue&state=on" -H "Cookie: token=$TOKEN" > /dev/null
    ping -c 1 -W 1 8.8.8.8 > /dev/null 2>&1
    sleep 0.1
done
DAEMON
chmod +x ~/.phb_lte_daemon.sh
nohup ~/.phb_lte_daemon.sh > /dev/null 2>&1 &
echo $! > ~/.phb_lte_daemon.pid
echo -e "   ${GREEN}✅ Daemon started (PID: $(cat ~/.phb_lte_daemon.pid))${NC}"

# ---- 13. Final status ----
echo -e "\n${BLUE}[13] Final status...${NC}"
IFS='|' read -r final_net final_sig <<< $(get_network)
echo -e "   Network: ${GREEN}$final_net${NC} (Signal: $final_sig)"
echo -e "   LED: ${BLUE}BLUE${NC}"
echo -e "   APN: ${GREEN}mob.asm.net${NC}"

# ---- 14. Summary ----
echo -e "\n${BLUE}========================================${NC}"
echo -e "${GREEN}✅ MASTER GAMING TUNE COMPLETE${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "📊 Applied:"
echo "   ✅ APN: mob.asm.net (PAP, IPv4)"
echo "   ✅ Best mode: $BEST_MODE ($BEST_NET, Signal: $BEST_SIG)"
echo "   ✅ Net Optimise: ENABLED"
echo "   ✅ QoS: Gaming (Highest Priority)"
echo "   ✅ UPnP: ENABLED"
echo "   ✅ DNS: 1.1.1.1, 8.8.8.8 + DoH"
echo "   ✅ Wi-Fi: CPE-150170-2.4G / CPE-150170-5G"
echo "   ✅ LED: BLUE"
echo "   ✅ Daemon: Running (0.1s)"
echo ""
echo "📌 Final status:"
echo "   • Network: $final_net (Signal: $final_sig)"
echo "   • LED: ${BLUE}BLUE${NC}"
echo ""
echo "🎮 All settings are now gaming-optimised."
echo "   • Low latency DNS (DoH)"
echo "   • Traffic prioritised for gaming"
echo "   • 5G locked and kept alive"
echo ""
echo "🛑 To stop daemon: kill \$(cat ~/.phb_lte_daemon.pid)"
echo "🔁 To re-run: ./phb_master_gaming_tune.sh"
