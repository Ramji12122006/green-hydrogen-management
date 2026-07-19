/* ==========================================================================
   Green Hydrogen Management System - Main Logic Script
   Handles auth, local state, hash routing, simulations, and graphics
   ========================================================================== */

// --- Central State Object ---
let state = {
  user: null,
  energyPool: 0.0,
  totalEnergyIn: 0.0,
  hydrogenProduced: 0.0,
  totalProduced: 0.0,
  hydrogenStored: 0.0,
  hydrogenTransported: 0.0,
  logs: []
};

// --- Active Inputs & Selection States ---
let currentEnergySource = 'Solar';
let currentEnergyEfficiency = 0.90;
let currentTransportMethod = 'Pipeline';
let currentTransportCapacity = 250;
let activeAuthTab = 'login';

// --- Default Demo Credentials ---
const DEFAULT_USER = { username: 'admin', password: 'admin123' };

// ==========================================================================
// 1. Initial State Loading & Storage Functions
// ==========================================================================
function loadState() {
  const savedState = localStorage.getItem('ghms_state');
  if (savedState) {
    try {
      state = JSON.parse(savedState);
    } catch (e) {
      console.error("Error parsing saved state:", e);
      resetState(false);
    }
  } else {
    // Initial default state
    state.user = null;
    state.energyPool = 0.0;
    state.totalEnergyIn = 0.0;
    state.hydrogenProduced = 0.0;
    state.totalProduced = 0.0;
    state.hydrogenStored = 0.0;
    state.hydrogenTransported = 0.0;
    state.logs = [
      {
        timestamp: new Date().toLocaleTimeString(),
        type: 'SYSTEM',
        message: 'Green Hydrogen System initialized in standby mode.',
        status: 'system'
      }
    ];
    saveState();
  }
}

function saveState() {
  localStorage.setItem('ghms_state', JSON.stringify(state));
  updateUI();
}

function resetState(interactive = true) {
  if (interactive && !confirm("Are you sure you want to reset all simulation data? This will clear logs and counters.")) {
    return;
  }
  
  state.energyPool = 0.0;
  state.totalEnergyIn = 0.0;
  state.hydrogenProduced = 0.0;
  state.totalProduced = 0.0;
  state.hydrogenStored = 0.0;
  state.hydrogenTransported = 0.0;
  state.logs = [
    {
      timestamp: new Date().toLocaleTimeString(),
      type: 'SYSTEM',
      message: 'System state reset to factory defaults by operator.',
      status: 'system'
    }
  ];
  
  saveState();
  addLogMessage('SYSTEM', 'System parameters reset to zero.', 'system');
}

// ==========================================================================
// 2. Authentication Logic
// ==========================================================================
function switchAuthTab(tab) {
  activeAuthTab = tab;
  document.getElementById('tab-login').classList.toggle('active', tab === 'login');
  document.getElementById('tab-register').classList.toggle('active', tab === 'register');
  document.getElementById('auth-submit-btn').innerText = tab === 'login' ? 'Access Command Center' : 'Register Operator Account';
  document.getElementById('auth-error-box').style.display = 'none';
}

function togglePasswordVisibility() {
  const pwdInput = document.getElementById('auth-password');
  const icon = document.getElementById('password-toggle-icon');
  if (pwdInput.type === 'password') {
    pwdInput.type = 'text';
    icon.setAttribute('data-lucide', 'eye-off');
  } else {
    pwdInput.type = 'password';
    icon.setAttribute('data-lucide', 'eye');
  }
  lucide.createIcons();
}

function handleAuthSubmit(e) {
  e.preventDefault();
  const usernameInput = document.getElementById('auth-username').value.trim();
  const passwordInput = document.getElementById('auth-password').value;
  const errorBox = document.getElementById('auth-error-box');
  const errorMsg = document.getElementById('auth-error-msg');
  
  if (activeAuthTab === 'login') {
    // Validate credentials
    let registeredUsers = JSON.parse(localStorage.getItem('ghms_registered_users')) || [];
    const foundUser = registeredUsers.find(u => u.username.toLowerCase() === usernameInput.toLowerCase() && u.password === passwordInput);
    
    const isAdmin = usernameInput.toLowerCase() === DEFAULT_USER.username && passwordInput === DEFAULT_USER.password;
    
    if (isAdmin || foundUser) {
      state.user = { username: usernameInput };
      saveState();
      addLogMessage('SYSTEM', `Operator '${usernameInput}' authenticated and signed in.`, 'system');
      window.location.hash = '#/';
      // Clear forms
      document.getElementById('auth-form').reset();
    } else {
      errorBox.style.display = 'flex';
      errorMsg.innerText = 'Invalid username or password.';
    }
  } else {
    // Register
    if (usernameInput.length < 3) {
      errorBox.style.display = 'flex';
      errorMsg.innerText = 'Username must be at least 3 characters.';
      return;
    }
    if (passwordInput.length < 6) {
      errorBox.style.display = 'flex';
      errorMsg.innerText = 'Password must be at least 6 characters.';
      return;
    }
    
    let registeredUsers = JSON.parse(localStorage.getItem('ghms_registered_users')) || [];
    const userExists = registeredUsers.some(u => u.username.toLowerCase() === usernameInput.toLowerCase()) || usernameInput.toLowerCase() === 'admin';
    
    if (userExists) {
      errorBox.style.display = 'flex';
      errorMsg.innerText = 'Username already registered.';
    } else {
      registeredUsers.push({ username: usernameInput, password: passwordInput });
      localStorage.setItem('ghms_registered_users', JSON.stringify(registeredUsers));
      alert('Operator registration successful! Please sign in.');
      switchAuthTab('login');
    }
  }
}

function handleLogout() {
  if (confirm("Are you sure you want to sign out?")) {
    addLogMessage('SYSTEM', `Operator '${state.user ? state.user.username : 'Unknown'}' signed out.`, 'system');
    state.user = null;
    saveState();
    window.location.hash = '#/login';
  }
}

// ==========================================================================
// 3. Client Side Routing (Hash Router)
// ==========================================================================
const routes = {
  '#/login': { id: 'login-panel', title: 'Authentication' },
  '#/': { id: 'view-dashboard', title: 'Dashboard Control' },
  '#/energy': { id: 'view-energy', title: 'Renewable Grid Ingestion' },
  '#/electrolysis': { id: 'view-electrolysis', title: 'Electrolysis Hub' },
  '#/storage': { id: 'view-storage', title: 'Hydrogen Storage Facility' },
  '#/transport': { id: 'view-transport', title: 'Distribution Logistics Network' },
  '#/analytics': { id: 'view-analytics', title: 'Sustainability Ledger & Analytics' }
};

function router() {
  const hash = window.location.hash || '#/';
  
  // Guard Clauses: redirection if not logged in
  if (!state.user && hash !== '#/login') {
    window.location.hash = '#/login';
    return;
  }
  if (state.user && hash === '#/login') {
    window.location.hash = '#/';
    return;
  }
  
  const currentRoute = routes[hash];
  if (!currentRoute) {
    window.location.hash = '#/';
    return;
  }

  // Switch panels
  if (hash === '#/login') {
    document.getElementById('login-panel').style.display = 'flex';
    document.getElementById('app-panel').style.display = 'none';
  } else {
    document.getElementById('login-panel').style.display = 'none';
    document.getElementById('app-panel').style.display = 'flex';
    
    // Hide all views, display current view
    document.querySelectorAll('.view-panel').forEach(panel => {
      panel.classList.remove('active');
    });
    const targetPanel = document.getElementById(currentRoute.id);
    if (targetPanel) {
      targetPanel.classList.add('active');
    }
    
    // Update Header View Title
    document.getElementById('current-view-title').innerText = currentRoute.title;
    
    // Highlight sidebar item
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
    });
    
    let sidebarId = 'nav-' + hash.replace('#/', '');
    if (hash === '#/') sidebarId = 'nav-dashboard';
    
    const activeSidebarItem = document.getElementById(sidebarId);
    if (activeSidebarItem) {
      activeSidebarItem.classList.add('active');
    }
  }
  
  updateUI();
  lucide.createIcons();
}

window.addEventListener('hashchange', router);
window.addEventListener('load', () => {
  loadState();
  router();
});

// ==========================================================================
// 4. Ingestion Grid Page Operations (Energy Input)
// ==========================================================================
function selectEnergySource(source, efficiency) {
  currentEnergySource = source;
  currentEnergyEfficiency = efficiency;
  
  // Update UI selection classes
  document.querySelectorAll('.source-card').forEach(card => {
    card.classList.remove('selected');
  });
  
  const selectedCard = document.getElementById('src-' + source.toLowerCase());
  if (selectedCard) {
    selectedCard.classList.add('selected');
  }
  
  calculateEnergyPreview();
}

function syncSliderToInput(val) {
  document.getElementById('energy-quantity').value = val;
  calculateEnergyPreview();
}

function calculateEnergyPreview() {
  const qty = parseFloat(document.getElementById('energy-quantity').value) || 0;
  const netEnergy = qty * currentEnergyEfficiency;
  const potentialH2 = netEnergy / 50.0;
  const potentialCO2 = potentialH2 * 10.0;
  
  document.getElementById('preview-source-name').innerText = currentEnergySource;
  document.getElementById('preview-net-energy').innerText = netEnergy.toFixed(2) + ' kWh';
  document.getElementById('preview-potential-h2').innerText = potentialH2.toFixed(2) + ' kg';
  document.getElementById('preview-potential-co2').innerText = potentialCO2.toFixed(2) + ' kg';
}

function handleEnergyInput(e) {
  e.preventDefault();
  const inputQty = parseFloat(document.getElementById('energy-quantity').value);
  if (isNaN(inputQty) || inputQty <= 0) return;
  
  const netEnergy = inputQty * currentEnergyEfficiency;
  state.energyPool += netEnergy;
  state.totalEnergyIn += netEnergy;
  
  addLogMessage('ENERGY', `Grid Ingest: +${netEnergy.toFixed(2)} kWh clean power added from ${currentEnergySource} source.`, 'info');
  saveState();
  
  // Reset Form
  document.getElementById('energy-quantity').value = '500';
  document.getElementById('energy-slider').value = '500';
  calculateEnergyPreview();
  
  alert(`Injected ${netEnergy.toFixed(2)} kWh clean energy into the pool grid!`);
  window.location.hash = '#/';
}

// ==========================================================================
// 5. Electrolysis Simulation Hub
// ==========================================================================
let electrolysisInterval = null;
function triggerElectrolysis() {
  const energyPool = state.energyPool;
  if (energyPool <= 0) {
    alert("Grid Energy Pool is empty. Please add renewable energy from the Energy Grid page.");
    return;
  }
  
  const btn = document.getElementById('btn-run-electrolysis');
  btn.disabled = true;
  btn.classList.add('running');
  btn.innerHTML = `<i data-lucide="loader" class="spin-animation"></i> Simulating Split...`;
  lucide.createIcons();
  
  document.getElementById('reactor-glow').classList.add('active');
  
  // Start Bubbles Rise Animation
  const o2Container = document.getElementById('bubble-container-oxygen');
  const h2Container = document.getElementById('bubble-container-hydrogen');
  
  o2Container.innerHTML = '';
  h2Container.innerHTML = '';
  
  // Spawn bubble particles
  let bubbleTimer = setInterval(() => {
    // Oxygen bubbles
    let bubbleO = document.createElement('div');
    bubbleO.className = 'bubble';
    let sizeO = Math.random() * 8 + 4;
    bubbleO.style.width = sizeO + 'px';
    bubbleO.style.height = sizeO + 'px';
    bubbleO.style.left = Math.random() * 80 + 10 + '%';
    bubbleO.style.animationDuration = Math.random() * 1.5 + 1.5 + 's';
    o2Container.appendChild(bubbleO);
    
    // Hydrogen bubbles (Cathode produces double the volume of gas!)
    for (let i = 0; i < 2; i++) {
      let bubbleH = document.createElement('div');
      bubbleH.className = 'bubble';
      let sizeH = Math.random() * 8 + 4;
      bubbleH.style.width = sizeH + 'px';
      bubbleH.style.height = sizeH + 'px';
      bubbleH.style.left = Math.random() * 80 + 10 + '%';
      bubbleH.style.animationDuration = Math.random() * 1.5 + 1.5 + 's';
      h2Container.appendChild(bubbleH);
    }
  }, 100);

  // Complete Simulation in 3.5 seconds
  setTimeout(() => {
    clearInterval(bubbleTimer);
    document.getElementById('reactor-glow').classList.remove('active');
    
    // Math logic
    const h2Produced = energyPool / 50.0;
    state.energyPool = 0.0; // Consume energy pool
    state.hydrogenProduced += h2Produced;
    state.totalProduced += h2Produced;
    
    addLogMessage('PRODUCTION', `Electrolysis Completed: Processed ${energyPool.toFixed(2)} kWh to generate ${h2Produced.toFixed(2)} kg of Green Hydrogen.`, 'success');
    saveState();
    
    btn.disabled = false;
    btn.classList.remove('running');
    btn.innerHTML = `<i data-lucide="zap"></i> Initiate Electrolysis Process`;
    lucide.createIcons();
    
    // Visual indicators
    o2Container.innerHTML = '';
    h2Container.innerHTML = '';
    
    alert(`Successfully processed energy pool! Synthesized ${h2Produced.toFixed(2)} kg Green Hydrogen.`);
    window.location.hash = '#/';
  }, 3500);
}

// ==========================================================================
// 6. Compressor & Storage Management
// ==========================================================================
function setStorageMax() {
  document.getElementById('storage-quantity').value = state.hydrogenProduced.toFixed(2);
}

function handleStoreHydrogen(e) {
  e.preventDefault();
  const quantityToStore = parseFloat(document.getElementById('storage-quantity').value);
  if (isNaN(quantityToStore) || quantityToStore <= 0) return;
  
  if (quantityToStore > state.hydrogenProduced) {
    alert(`Insufficient unstored hydrogen. You only have ${state.hydrogenProduced.toFixed(2)} kg available.`);
    return;
  }
  
  const currentTotalStored = state.hydrogenStored;
  if (currentTotalStored + quantityToStore > 100.0) {
    alert(`Storage capacity overflow! The storage system can only hold 100.00 kg. You currently have ${currentTotalStored.toFixed(2)} kg stored.`);
    return;
  }
  
  state.hydrogenProduced -= quantityToStore;
  state.hydrogenStored += quantityToStore;
  
  addLogMessage('STORAGE', `Compressor Ingest: +${quantityToStore.toFixed(2)} kg compressed and stored.`, 'success');
  saveState();
  
  document.getElementById('storage-input-form').reset();
  alert(`Successfully stored ${quantityToStore.toFixed(2)} kg H2 in tanks A & B.`);
  window.location.hash = '#/';
}

// ==========================================================================
// 7. Logistics & Transport network
// ==========================================================================
function selectTransportMethod(method, capacity) {
  currentTransportMethod = method;
  currentTransportCapacity = capacity;
  
  document.querySelectorAll('.method-btn').forEach(btn => {
    btn.classList.remove('selected');
  });
  
  let searchId = 'method-pipeline';
  if (method === 'Liquid Tanker') searchId = 'method-tanker';
  if (method === 'Tube Trailer') searchId = 'method-trailer';
  
  const btn = document.getElementById(searchId);
  if (btn) btn.classList.add('selected');
}

function setTransportMax() {
  document.getElementById('transport-quantity').value = state.hydrogenStored.toFixed(2);
}

function handleTransportHydrogen(e) {
  e.preventDefault();
  const qty = parseFloat(document.getElementById('transport-quantity').value);
  if (isNaN(qty) || qty <= 0) return;
  
  if (qty > state.hydrogenStored) {
    alert(`Insufficient stored hydrogen in tanks. You only have ${state.hydrogenStored.toFixed(2)} kg stored.`);
    return;
  }
  
  // Disable button to prevent double trigger
  const btn = document.getElementById('btn-dispatch-transport');
  btn.disabled = true;
  
  // Set icons & values for animation
  const vehicle = document.getElementById('animated-vehicle');
  const path = document.getElementById('map-route-active');
  const vIcon = document.getElementById('vehicle-icon');
  
  // Icon selector
  let dataIcon = 'git-commit';
  if (currentTransportMethod === 'Liquid Tanker') dataIcon = 'truck';
  if (currentTransportMethod === 'Tube Trailer') dataIcon = 'train';
  
  vIcon.setAttribute('data-lucide', dataIcon);
  lucide.createIcons();
  
  // Reset paths
  path.classList.remove('animating');
  vehicle.classList.remove('dispatching');
  void path.offsetWidth; // Force Reflow
  
  // Trigger animation classes
  path.classList.add('animating');
  vehicle.classList.add('dispatching');
  
  addLogMessage('LOGISTICS', `Dispatching shipment: ${qty.toFixed(2)} kg H₂ loaded via ${currentTransportMethod} transfer grid.`, 'warning');
  
  setTimeout(() => {
    // Process math after transport completes (3 seconds)
    state.hydrogenStored -= qty;
    state.hydrogenTransported += qty;
    
    addLogMessage('LOGISTICS', `Shipment arrived: Delivered ${qty.toFixed(2)} kg H₂ to Industrial Terminal grid.`, 'success');
    saveState();
    
    btn.disabled = false;
    path.classList.remove('animating');
    vehicle.classList.remove('dispatching');
    
    document.getElementById('transport-input-form').reset();
    alert(`Transport complete! Successfully delivered ${qty.toFixed(2)} kg H2.`);
    window.location.hash = '#/';
  }, 3000);
}

// ==========================================================================
// 8. Analytics & Report Ledger
// ==========================================================================
function exportLogToCSV() {
  if (state.logs.length === 0) {
    alert("History log ledger is empty.");
    return;
  }
  
  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += "Timestamp,Operation,Log Details,Status\n";
  
  state.logs.forEach(log => {
    let row = `"${log.timestamp}","${log.type}","${log.message.replace(/"/g, '""')}","${log.status}"`;
    csvContent += row + "\n";
  });
  
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `ghms_system_report_${Date.now()}.csv`);
  document.body.appendChild(link);
  
  link.click();
  document.body.removeChild(link);
  addLogMessage('SYSTEM', 'Sustainability CSV report generated and downloaded.', 'system');
}

function confirmResetSystem() {
  resetState(true);
}

// Helper to push history logs
function addLogMessage(type, message, status) {
  state.logs.unshift({
    timestamp: new Date().toLocaleTimeString(),
    type: type,
    message: message,
    status: status
  });
  // Cap at 100 entries for stability
  if (state.logs.length > 100) {
    state.logs.pop();
  }
}

// ==========================================================================
// 9. Central UI Renderer & State Synchronization
// ==========================================================================
function updateUI() {
  const isAuth = !!state.user;
  
  if (!isAuth) return; // Login view controls itself
  
  // Set profile details
  const name = state.user.username;
  document.getElementById('profile-name').innerText = name;
  document.getElementById('profile-avatar').innerText = name.substring(0, 2).toUpperCase();
  document.getElementById('dashboard-user').innerText = name;
  
  // Dashboard Metrics Update
  document.getElementById('kpi-energy').innerText = state.energyPool.toFixed(2) + ' kWh';
  document.getElementById('kpi-hydrogen').innerText = state.hydrogenProduced.toFixed(2) + ' kg';
  document.getElementById('kpi-stored').innerText = state.hydrogenStored.toFixed(2) + ' kg';
  document.getElementById('kpi-transported').innerText = state.hydrogenTransported.toFixed(2) + ' kg';
  
  // Global CO2 Calculations (1 kg Hydrogen = 10 kg CO2 Saved)
  const co2Saved = state.totalProduced * 10.0;
  const treesPlanted = co2Saved / 22.0; // 22kg CO2 absorbed per tree per year
  const dieselMiles = co2Saved / 0.35; // 0.35kg CO2 per mile emissions
  
  document.getElementById('dashboard-co2-saved').innerText = co2Saved.toFixed(2) + ' kg';
  document.getElementById('analytics-co2-saved').innerText = co2Saved.toFixed(2) + ' kg';
  document.getElementById('analytics-trees-planted').innerText = treesPlanted.toFixed(1);
  document.getElementById('analytics-cars-off').innerText = dieselMiles.toFixed(0);
  
  // Capacity Gauge Ring Animation
  const totalStored = state.hydrogenStored;
  const percentage = Math.min((totalStored / 100.0) * 100, 100);
  document.getElementById('capacity-percentage').innerText = Math.round(percentage) + '%';
  document.getElementById('gauge-stored-val').innerText = totalStored.toFixed(1);
  
  // Calculate SVG gauge stroke-dashoffset (Radius = 90, Circ = 565.48)
  const strokeOffset = 565.48 - (565.48 * percentage) / 100;
  document.getElementById('capacity-gauge-fill').style.strokeDashoffset = strokeOffset;
  
  // Render Recent Activity Logs Feed (Dashboard View)
  const activityFeed = document.getElementById('dashboard-activity-feed');
  activityFeed.innerHTML = '';
  
  // Show up to 5 items in recent list
  const recentLogs = state.logs.slice(0, 5);
  if (recentLogs.length === 0) {
    activityFeed.innerHTML = '<div style="color:var(--text-muted); text-align:center; padding:1rem;">No recent activities.</div>';
  } else {
    recentLogs.forEach(log => {
      let icon = 'check';
      let badgeClass = 'system';
      if (log.type === 'ENERGY') { icon = 'plug'; badgeClass = 'add'; }
      else if (log.type === 'PRODUCTION') { icon = 'atom'; badgeClass = 'produce'; }
      else if (log.type === 'STORAGE') { icon = 'container'; badgeClass = 'store'; }
      else if (log.type === 'LOGISTICS') { icon = 'navigation'; badgeClass = 'transport'; }
      
      let item = document.createElement('div');
      item.className = 'activity-item';
      item.innerHTML = `
        <div class="activity-badge ${badgeClass}"><i data-lucide="${icon}" style="width:14px; height:14px;"></i></div>
        <div class="activity-body">
          <div class="activity-msg">${log.message}</div>
          <div class="activity-time">${log.timestamp}</div>
        </div>
      `;
      activityFeed.appendChild(item);
    });
  }
  
  // Sync page specific elements:
  // Energy Page available limits
  const qtyInput = document.getElementById('energy-quantity');
  if (qtyInput && qtyInput.value === '') {
    qtyInput.value = '500';
    calculateEnergyPreview();
  }
  
  // Electrolysis page energy indicators
  const poolBar = document.getElementById('electrolysis-pool-bar');
  if (poolBar) {
    document.getElementById('electrolysis-pool-value').innerText = state.energyPool.toFixed(2) + ' kWh';
    // Let's cap the visual scaling of the bar at 2000 kWh
    const barWidthPercentage = Math.min((state.energyPool / 2000) * 100, 100);
    poolBar.style.width = barWidthPercentage + '%';
  }
  
  // Storage Page available indicator
  const storeIndicator = document.getElementById('storage-unstored-val');
  if (storeIndicator) {
    storeIndicator.innerText = state.hydrogenProduced.toFixed(2) + ' kg';
    
    // Tank A and B filling (Capacity = 50kg each)
    let tankAVal = Math.min(state.hydrogenStored, 50.0);
    let tankBVal = Math.max(state.hydrogenStored - 50.0, 0.0);
    
    document.getElementById('tank-a-label').innerText = tankAVal.toFixed(2) + ' kg H₂';
    document.getElementById('tank-b-label').innerText = tankBVal.toFixed(2) + ' kg H₂';
    
    // Tank Heights
    document.getElementById('tank-a-fill').style.height = (tankAVal / 50.0) * 100 + '%';
    document.getElementById('tank-b-fill').style.height = (tankBVal / 50.0) * 100 + '%';
    
    // Tank press & temp simulations
    let pressA = (tankAVal / 50.0) * 350.0;
    let tempA = 15.0 + (tankAVal / 50.0) * 12.0;
    document.getElementById('tank-a-pressure').innerText = pressA.toFixed(1) + ' bar';
    document.getElementById('tank-a-temp').innerText = tempA.toFixed(1) + ' °C';
    
    let pressB = (tankBVal / 50.0) * 350.0;
    let tempB = 15.0 + (tankBVal / 50.0) * 12.0;
    document.getElementById('tank-b-pressure').innerText = pressB.toFixed(1) + ' bar';
    document.getElementById('tank-b-temp').innerText = tempB.toFixed(1) + ' °C';
  }
  
  // Transport page limits
  const transportIndicator = document.getElementById('transport-stored-val');
  if (transportIndicator) {
    transportIndicator.innerText = state.hydrogenStored.toFixed(2) + ' kg';
  }
  
  // Analytics ledger list
  const logTbody = document.getElementById('analytics-log-tbody');
  if (logTbody) {
    logTbody.innerHTML = '';
    if (state.logs.length === 0) {
      logTbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted);">No records registered.</td></tr>`;
    } else {
      state.logs.forEach(log => {
        let typeBadge = 'system';
        if (log.type === 'ENERGY') typeBadge = 'info';
        if (log.type === 'PRODUCTION') typeBadge = 'success';
        if (log.type === 'STORAGE') typeBadge = 'success';
        if (log.type === 'LOGISTICS') typeBadge = 'warning';
        
        let tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${log.timestamp}</td>
          <td><span class="badge ${typeBadge}">${log.type}</span></td>
          <td>${log.message}</td>
          <td><span class="badge ${log.status === 'system' ? 'system' : log.status === 'success' ? 'success' : log.status === 'info' ? 'info' : 'warning'}">${log.status.toUpperCase()}</span></td>
        `;
        logTbody.appendChild(tr);
      });
    }
  }
}
