# Green Hydrogen Management System (GHMS)

GHMS is a premium, high-fidelity, web-based simulation and management system for monitoring green hydrogen production, storage, logistics, and environmental impact. Built with a modern, futuristic dark-mode glassmorphic interface, it provides a comprehensive 6-view control panel following standard web development best practices.

## 🚀 Key Features

1. **Secure Login Portal**
   - Sleek auth simulation with route guards and session management.
   - Demo credentials: User: `admin` | Pass: `admin123` (or register a custom local account).

2. **Operations Dashboard**
   - High-level KPIs tracking energy consumption, hydrogen produced/stored/transported, and carbon footprint.
   - Dynamic SVG-based real-time storage gauge and energy distribution metrics.

3. **Renewable Energy Grid**
   - Input forms for multi-source renewable energy (Solar, Wind, Hydro, Geothermal).
   - Real-time conversion estimation previews.

4. **Electrolysis Hub**
   - Visual simulation of water electrolysis (splitting water into hydrogen and oxygen).
   - Dynamic HTML5 bubble animations representing hydrogen release.
   - Uses the standard estimation: **50 kWh of energy per 1 kg of Hydrogen produced**.

5. **Storage Facility**
   - Monitoring system showing pressure, temperature, and current status of storage tanks.
   - Fill-level UI gauges responding dynamically to inputs.

6. **Logistics & Distribution**
   - Simulates hydrogen dispatch across Pipeline, Liquid Tankers, or Tube Trailers.
   - Restricts dispatches to stored amounts and animates shipping status.

7. **Sustainability & Analytics**
   - Environmental reports: Estimated CO2 saved calculated at **10.00 kg CO2 saved per 1.00 kg Green Hydrogen**.
   - Calculates tree planting and diesel car equivalent metrics.
   - Exportable transaction logs (CSV download).

---

## 🛠️ Technology Stack

- **Frontend**: Clean Semantic HTML5 & Modern CSS3 (Grid, Flexbox, Variable-driven theming).
- **Interactivity**: Vanilla JavaScript (ES6+ Module pattern, custom client-side router, localStorage integration).
- **Runtimes**: Serverless client-side architecture (runs locally on any browser, option to run with Python server).

---

## 💻 How to Run Locally

Since this project relies on vanilla code and browser standard APIs, there are no dependencies to install. 

### Method 1: Python Dev Server (Recommended)
Open your terminal inside this directory and run:
```bash
python -m http.server 8000
```
Then navigate to `http://localhost:8000` in your web browser.

### Method 2: Direct File Open
Double click the `index.html` file to open it directly in your browser.
*(Note: Some features like hash-routing might show differences depending on browser security settings, so running a server is recommended)*
