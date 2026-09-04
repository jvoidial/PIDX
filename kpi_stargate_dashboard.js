// SPIRIT GUIDE - KPI PORTAL & STARGATE DASHBOARD INTEGRATION
// Integrates real-time KPI data from spirit_guide_full_sync.json

class KPIPortalStargate {
    constructor() {
        this.apiUrl = 'https://jvoidial.github.io/spirit-guide-token/spirit_guide_full_sync.json';
        this.portals = {
            quantum: { frequency: 0.618, status: 'ACTIVE', element: null },
            resonance: { frequency: 1.618, status: 'ACTIVE', element: null },
            coherence: { frequency: 2.618, status: 'ACTIVE', element: null },
            divine: { frequency: 3.618, status: 'ACTIVE', element: null }
        };
        this.kpiMetrics = {};
        this.updateInterval = 30000;
    }

    async fetchData() {
        try {
            const response = await fetch(this.apiUrl);
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching KPI data:', error);
            return null;
        }
    }

    extractKPIData(data) {
        if (!data) return null;

        const metrics = {
            coherence: data.acoustic_protocol?.resonance_parameters?.coherence_boost || 0.610,
            persistence: data.acoustic_protocol?.resonance_parameters?.persistence_gain || 5.837,
            resonance: data.quantum_ease_flow?.resonance || 288,
            voxels: data.phb_topologies?.voxels?.frequency || 3.618,
            quantum_ease: data.quantum_ease_flow?.quantum_ease || 81,
            kpi: 0,
            threshold: 3564
        };

        const decay = 0.0110;
        metrics.kpi = (metrics.persistence * metrics.coherence * metrics.resonance * metrics.voxels) / (decay * 1000000);

        return metrics;
    }

    updatePortals(metrics) {
        if (!metrics) return;

        for (const [name, portal] of Object.entries(this.portals)) {
            portal.status = metrics.kpi > 100 ? 'ACTIVE' : 'PROCESSING';
            portal.metrics = metrics;
            
            const portalElement = document.getElementById(`portal-${name}`);
            if (portalElement) {
                portalElement.innerHTML = `
                    <div class="portal-card ${portal.status.toLowerCase()}">
                        <h3>${name.toUpperCase()} PORTAL</h3>
                        <p>Frequency: ${portal.frequency} Hz</p>
                        <p>Status: ${portal.status}</p>
                        <p>Gateway: stargate_${name}</p>
                        <p>KPI: ${metrics.kpi.toFixed(4)}</p>
                    </div>
                `;
            }
        }

        const stargateElement = document.getElementById('stargate-status');
        if (stargateElement) {
            stargateElement.innerHTML = `
                <div class="stargate-active">
                    🌐 STARGATE: ACTIVE
                    <br>Gateways: ${Object.keys(this.portals).length} portals
                    <br>Frequencies: ${Object.values(this.portals).map(p => p.frequency).join(', ')} Hz
                </div>
            `;
        }
    }

    updateDashboard() {
        console.log('🔄 Updating KPI Portal & Stargate dashboard...');
        this.fetchData().then(data => {
            const metrics = this.extractKPIData(data);
            if (metrics) {
                this.kpiMetrics = metrics;
                this.updatePortals(metrics);
                this.updateKPIChart(metrics);
                console.log('✅ Dashboard updated at', new Date().toLocaleTimeString());
            }
        });
    }

    updateKPIChart(metrics) {
        const kpiElement = document.getElementById('kpi-display');
        if (kpiElement) {
            kpiElement.innerHTML = `
                <div class="kpi-metrics">
                    <p>🔹 KPI: ${metrics.kpi.toFixed(4)}</p>
                    <p>🔹 Coherence: ${metrics.coherence}</p>
                    <p>🔹 Persistence: ${metrics.persistence}</p>
                    <p>🔹 Resonance: ${metrics.resonance}</p>
                    <p>🔹 Voxels: ${metrics.voxels}</p>
                    <p>🔹 Quantum Ease: ${metrics.quantum_ease}%</p>
                    <p>🔹 Threshold: ${metrics.threshold}</p>
                </div>
            `;
        }
    }

    init() {
        console.log('🌀 Initializing KPI Portal & Stargate...');
        this.createDashboardContainers();
        this.updateDashboard();
        setInterval(() => this.updateDashboard(), this.updateInterval);
        console.log('✅ KPI Portal & Stargate initialized');
    }

    createDashboardContainers() {
        const containers = {
            portals: 'kpi-portals-container',
            stargate: 'stargate-container',
            kpi: 'kpi-display-container'
        };

        if (!document.getElementById(containers.portals)) {
            const portalDiv = document.createElement('div');
            portalDiv.id = containers.portals;
            portalDiv.innerHTML = `
                <h2>🌀 KPI PORTALS</h2>
                <div id="portal-quantum"></div>
                <div id="portal-resonance"></div>
                <div id="portal-coherence"></div>
                <div id="portal-divine"></div>
            `;
            document.body.appendChild(portalDiv);
        }

        if (!document.getElementById(containers.stargate)) {
            const stargateDiv = document.createElement('div');
            stargateDiv.id = containers.stargate;
            stargateDiv.innerHTML = `<h2>🌐 STARGATE</h2><div id="stargate-status"></div>`;
            document.body.appendChild(stargateDiv);
        }

        if (!document.getElementById(containers.kpi)) {
            const kpiDiv = document.createElement('div');
            kpiDiv.id = containers.kpi;
            kpiDiv.innerHTML = `<h2>📊 KPI METRICS</h2><div id="kpi-display"></div>`;
            document.body.appendChild(kpiDiv);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const dashboard = new KPIPortalStargate();
    dashboard.init();
});

window.KPIPortalStargate = KPIPortalStargate;
