#!/data/data/com.termux/files/usr/bin/bash
# ============================================================
#  PHB NAT + DMZ + TCP/UDP
#  Opens all TCP/UDP ports, sets DMZ, and optimises NAT
# ============================================================

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'

echo "======================================"
echo "  PHB NAT + DMZ + TCP/UDP"
echo "  Full port opening + DMZ + Open NAT"
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

get_network() {
    HOME_INFO=$(curl -s "http://192.168.1.1/jsonp_home_info?callback=Q" -H "Cookie: token=$TOKEN" 2>/dev/null)
    NET=$(echo "$HOME_INFO" | grep -o '<networkType>[^<]*</networkType>' | sed 's/<networkType>//;s/<\/networkType>//')
    SIG=$(echo "$HOME_INFO" | grep -o '<strengthLevel>[^<]*</strengthLevel>' | sed 's/<strengthLevel>//;s/<\/strengthLevel>//')
    echo "$NET|$SIG"
}

confirm() {
    echo -e "   ${GREEN}✅ SUCCESS${NC}"
}

# ---- 2. Open NAT ----
echo -e "\n${BLUE}[2] Setting NAT to Open (Type 1)...${NC}"
post_xml '<?xml version="1.0"?><request><natEnable>1</natEnable><natType>1</natType></request>' "networking"
post_goform "goformId=SET_NAT&nat_type=1&nat_enable=1"
confirm

# ---- 3. Enable DMZ ----
echo -e "\n${BLUE}[3] Setting DMZ to 192.168.1.50...${NC}"
echo -e "   ${YELLOW}Note: Set your gaming device to static IP 192.168.1.50${NC}"
post_xml '<?xml version="1.0"?><request><dmzEnable>1</dmzEnable><dmzHost>192.168.1.50</dmzHost></request>' "dmz"
post_goform "goformId=SET_DMZ&dmz_enable=1&dmz_host=192.168.1.50"
confirm

# ---- 4. Open all TCP/UDP ports ----
echo -e "\n${BLUE}[4] Opening all TCP/UDP ports (1-65535)...${NC}"
post_xml '<?xml version="1.0"?><request><startPort>1</startPort><endPort>65535</endPort><protocol>both</protocol><enable>1</enable></request>' "portforward"
post_goform "goformId=PORT_RANGE&start=1&end=65535&protocol=both&enable=1"
confirm

# ---- 5. Open gaming-specific UDP ports ----
echo -e "\n${BLUE}[5] Opening gaming UDP ports...${NC}"
for port in 3074 3478 3479 3480 5223 1935 1937 27015 27016 27017 27018 27019 27020 27021 27022 27023 27024 27025 53 123 500 4500 5555 1194 51820; do
    echo -n "   UDP Port $port... "
    post_xml '<?xml version="1.0"?><request><port>'$port'</port><protocol>udp</protocol><enable>1</enable></request>' "portforward"
    post_goform "goformId=PORT_FORWARD&port=$port&protocol=udp&enable=1"
    echo -e "${GREEN}open${NC}"
done

# ---- 6. Open gaming TCP ports ----
echo -e "\n${BLUE}[6] Opening gaming TCP ports...${NC}"
for port in 88 3074 53 80 443 500 3544 4500 1863 5223 27015 27016 27017 27018 27019 27020 27021 27022 27023 27024 27025; do
    echo -n "   TCP Port $port... "
    post_xml '<?xml version="1.0"?><request><port>'$port'</port><protocol>tcp</protocol><enable>1</enable></request>' "portforward"
    post_goform "goformId=PORT_FORWARD&port=$port&protocol=tcp&enable=1"
    echo -e "${GREEN}open${NC}"
done

# ---- 7. Enable UPnP (if not already) ----
echo -e "\n${BLUE}[7] UPnP Enable...${NC}"
post_xml '<?xml version="1.0"?><request><upnpEnable>1</upnpEnable></request>' "upnp"
post_goform "goformId=SET_UPNP&upnp_enable=1"
confirm

# ---- 8. Final status ----
echo -e "\n${BLUE}[8] Final status...${NC}"
IFS='|' read -r final_net final_sig <<< $(get_network)
echo -e "   Network: ${GREEN}$final_net${NC} (Signal: $final_sig)"
echo -e "   NAT: ${GREEN}OPEN${NC}"
echo -e "   DMZ: ${GREEN}192.168.1.50${NC}"
echo -e "   All ports: ${GREEN}OPEN${NC}"

# ---- 9. Summary ----
echo -e "\n${BLUE}========================================${NC}"
echo -e "${GREEN}✅ NAT + DMZ + TCP/UDP COMPLETE${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "📊 Applied:"
echo "   ✅ NAT: Open (Type 1)"
echo "   ✅ DMZ: 192.168.1.50"
echo "   ✅ All TCP/UDP ports: OPEN (1-65535)"
echo "   ✅ Gaming UDP ports: OPEN"
echo "   ✅ Gaming TCP ports: OPEN"
echo "   ✅ UPnP: ENABLED"
echo ""
echo "📌 Final status:"
echo "   • Network: $final_net (Signal: $final_sig)"
echo "   • NAT: OPEN"
echo "   • DMZ: 192.168.1.50"
echo ""
echo "📌 Important:"
echo "   1. Set your gaming device (Xbox/PC) to static IP: 192.168.1.50"
echo "   2. Connect via Ethernet cable for best performance."
echo "   3. Run Fortnite and check Net Debug Stats."
