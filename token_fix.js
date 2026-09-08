// IMPROVED TOKEN DISPLAY WITH BETTER READABILITY
const tokens = data.tokens || {};
let tokensHTML = '';
const tokenColors = {
    'PIDX': { border: '#00ff88', bg: 'rgba(0,255,136,0.05)', color: '#00ff88' },
    'SGUIDE': { border: '#ff66ff', bg: 'rgba(255,102,255,0.05)', color: '#ff66ff' },
    'VDOO': { border: '#66aaff', bg: 'rgba(102,170,255,0.05)', color: '#66aaff' },
    'PENNIES': { border: '#ffaa44', bg: 'rgba(255,170,68,0.05)', color: '#ffaa44' }
};
for (const [name, info] of Object.entries(tokens)) {
    const address = info.address || '';
    const colors = tokenColors[name] || { border: '#00ffcc', bg: 'rgba(0,255,204,0.05)', color: '#00ffcc' };
    tokensHTML += `
        <div class="token-card" style="border-left: 3px solid ${colors.border}; background: ${colors.bg}; padding: 18px; margin: 15px 0; border-radius: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; margin-bottom: 12px;">
                <h3 style="color: ${colors.color}; font-size: 20px; letter-spacing: 2px; margin: 0;">${name}</h3>
                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                    <span style="background: rgba(0,255,200,0.08); padding: 2px 12px; border-radius: 12px; font-size: 11px; color: #00ffcc;">${info.layer || 'Unknown'}</span>
                    <span style="background: rgba(255,255,255,0.04); padding: 2px 12px; border-radius: 12px; font-size: 11px; color: #aaa;">${info.frequency || 0} Hz</span>
                    <span style="background: rgba(0,255,100,0.08); padding: 2px 12px; border-radius: 12px; font-size: 11px; color: #66ff66;">${info.verified ? '✅ Verified' : ''}</span>
                    <span style="background: rgba(255,100,0,0.08); padding: 2px 12px; border-radius: 12px; font-size: 11px; color: #ff8844;">${info.renounced ? '🔒 Renounced' : ''}</span>
                </div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 10px 0;">
                <div style="background: rgba(255,255,255,0.02); padding: 8px 12px; border-radius: 5px; border: 1px solid rgba(255,255,255,0.03);">
                    <span style="color: #666; font-size: 9px; text-transform: uppercase; letter-spacing: 1px; display: block;">📊 Rate</span>
                    <div style="color: #e0e0e0; font-size: 13px;">1 ETH = ${(info.rate || 0).toLocaleString()} ${name}</div>
                </div>
                <div style="background: rgba(255,255,255,0.02); padding: 8px 12px; border-radius: 5px; border: 1px solid rgba(255,255,255,0.03);">
                    <span style="color: #666; font-size: 9px; text-transform: uppercase; letter-spacing: 1px; display: block;">🌀 Layer</span>
                    <div style="color: #e0e0e0; font-size: 13px;">${info.layer || 'Unknown'} • ${info.frequency || 0} Hz</div>
                </div>
                <div style="background: rgba(255,255,255,0.02); padding: 8px 12px; border-radius: 5px; border: 1px solid rgba(255,255,255,0.03);">
                    <span style="color: #666; font-size: 9px; text-transform: uppercase; letter-spacing: 1px; display: block;">🔗 Address</span>
                    <div style="color: #888; font-size: 11px; word-break: break-all; font-family: monospace;">${address || 'Unknown'}</div>
                </div>
                <div style="background: rgba(255,255,255,0.02); padding: 8px 12px; border-radius: 5px; border: 1px solid rgba(255,255,255,0.03);">
                    <span style="color: #666; font-size: 9px; text-transform: uppercase; letter-spacing: 1px; display: block;">🔒 Security</span>
                    <div style="color: #aaa; font-size: 11px;">${(info.security || []).join(' • ')}</div>
                </div>
                <div style="background: rgba(255,255,255,0.02); padding: 8px 12px; border-radius: 5px; border: 1px solid rgba(255,255,255,0.03);">
                    <span style="color: #666; font-size: 9px; text-transform: uppercase; letter-spacing: 1px; display: block;">🔄 Spin</span>
                    <div style="color: #00ffcc; font-size: 24px;">${info.core_spin || '↻'}</div>
                </div>
                <div style="background: rgba(255,255,255,0.02); padding: 8px 12px; border-radius: 5px; border: 1px solid rgba(255,255,255,0.03);">
                    <span style="color: #666; font-size: 9px; text-transform: uppercase; letter-spacing: 1px; display: block;">🔧 Pipes</span>
                    <div style="color: #aaa; font-size: 12px;">${(info.pipes || []).join(' → ')}</div>
                </div>
            </div>
            <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.04);">
                <span style="color: #666; font-size: 9px; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">⚡ Quick Links</span>
                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                    <a href="https://app.uniswap.org/swap?outputCurrency=${address}" target="_blank" class="link-btn" style="background: rgba(255,0,122,0.08); border: 1px solid rgba(255,0,122,0.15); color: #ff66aa; padding: 4px 12px; border-radius: 4px; font-size: 10px; text-decoration: none; transition: 0.3s; font-family: monospace;">🔄 Uniswap</a>
                    <a href="https://basescan.org/address/${address}" target="_blank" class="link-btn" style="background: rgba(0,150,255,0.08); border: 1px solid rgba(0,150,255,0.15); color: #66aaff; padding: 4px 12px; border-radius: 4px; font-size: 10px; text-decoration: none; transition: 0.3s; font-family: monospace;">🔍 BaseScan</a>
                    <a href="https://sourcify.dev/contracts/${address}" target="_blank" class="link-btn" style="background: rgba(0,255,200,0.08); border: 1px solid rgba(0,255,200,0.15); color: #66ffcc; padding: 4px 12px; border-radius: 4px; font-size: 10px; text-decoration: none; transition: 0.3s; font-family: monospace;">📜 Sourcify</a>
                    <a href="https://www.geckoterminal.com/base/pools/${address}" target="_blank" class="link-btn" style="background: rgba(255,200,0,0.08); border: 1px solid rgba(255,200,0,0.15); color: #ffcc44; padding: 4px 12px; border-radius: 4px; font-size: 10px; text-decoration: none; transition: 0.3s; font-family: monospace;">📊 GeckoTerminal</a>
                    <a href="https://www.coingecko.com/en/coins/${name.toLowerCase()}" target="_blank" class="link-btn" style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); color: #888; padding: 4px 12px; border-radius: 4px; font-size: 10px; text-decoration: none; transition: 0.3s; font-family: monospace;">🪙 CoinGecko</a>
                </div>
            </div>
        </div>
    `;
}
document.getElementById('tokens').innerHTML = tokensHTML;
