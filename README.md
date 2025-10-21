# Ratio Analytics

A modern web application for analyzing cryptocurrency and financial assets using advanced risk-adjusted performance metrics like Omega and Sharpe ratios across multiple timeframes.

## 🌐 Live Demo
**[View Live Application](https://sandrich.github.io/ratio-analytics/)**

## 🚀 Key Features

- **26 Major Cryptocurrencies** - Curated selection of established tokens
- **Yahoo Finance Integration** - Reliable historical data via yfinance
- **Smart Delta Updates** - Only fetches new data since last update
- **GitHub Actions Automation** - Daily data updates and deployment
- **Static Hosting Ready** - Deploy to Vercel, Netlify, or GitHub Pages
- **Efficient Data Management** - Minimal API calls with intelligent caching

## 🏗️ Architecture

### Data Strategy
1. **Daily Updates**: GitHub Actions runs Python script to fetch latest data
2. **Delta Logic**: Only downloads new days since last update
3. **Static Files**: Data stored as JSON files in `/public/data/`
4. **Frontend**: React app loads static JSON files directly

### Data Source
- **Yahoo Finance** via `yfinance` Python library
  - ✅ Free and reliable
  - ✅ Comprehensive OHLCV data
  - ✅ No API key required
  - ✅ Historical data going back years

### Supported Cryptocurrencies
Currently tracking 26 major tokens:
- **Major**: BTC, ETH, BNB, XRP, SOL, ADA, DOGE
- **DeFi**: LINK, AAVE, DOT, AVAX, ATOM, NEAR
- **Layer 1**: TRX, ALGO, VET, ICP, HBAR
- **Others**: LTC, BCH, XLM, ETC, XMR, SHIB, QNT, FIL

## 🛠️ Development

### Prerequisites
```bash
# Node.js for frontend
npm install

# Python for data scripts
pip install -r scripts/requirements.txt
```

### Scripts
```bash
# Frontend development
npm run dev

# Build for production
npm run build

# Update crypto data manually
cd scripts && python download-historical-data.py
```

### Data Update Process
The Python script (`scripts/download-historical-data.py`):
1. Checks existing data files in `public/data/`
2. Determines last update date for each token
3. Fetches only new data since last update (delta)
4. Updates JSON files with new price/volume data
5. Creates/updates `index.json` with metadata

## 📊 Data Structure

Each token has its own JSON file (`public/data/{token-id}.json`):
```json
{
  "symbol": "BTC-USD",
  "crypto_id": "bitcoin",
  "name": "BTC",
  "last_updated": "2025-10-21T10:30:00",
  "data_points": 2847,
  "earliest_date": "2017-01-01T00:00:00",
  "latest_date": "2025-10-21T00:00:00",
  "prices": [[timestamp_ms, price], ...],
  "total_volumes": [[timestamp_ms, volume], ...]
}
```

## 🤖 Automation

### GitHub Actions
Two workflows handle automation:

1. **Combined Update & Deploy** (6 AM UTC daily)
   - Updates crypto data using Python script
   - Commits changes if data updated
   - Deploys to GitHub Pages automatically
   
2. **Manual Deploy** (on push to main)
   - Builds and deploys to GitHub Pages
   - Useful for code changes

### Setup Automation
No setup required! Workflows use built-in `GITHUB_TOKEN` permissions.

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── CryptoAnalyzer.tsx      # Main analyzer component
│   ├── TokenDataTable.tsx      # Overall rankings table
│   ├── OmegaRatioTable.tsx     # Omega ratio analysis
│   └── SharpeRatioTable.tsx    # Sharpe ratio analysis
├── types/              # TypeScript definitions
├── utils/              # Utility functions
└── App.tsx            # Main application

scripts/
├── download-historical-data.py  # Data fetching script
└── requirements.txt            # Python dependencies

public/
└── data/              # Generated crypto data (JSON files)
    ├── bitcoin.json
    ├── ethereum.json
    └── index.json     # Metadata and token list

.github/workflows/     # GitHub Actions automation
├── update-crypto-data.yml
├── deploy-vercel.yml
└── update-and-deploy.yml
```

## 🚀 Deployment

### GitHub Pages (Automatic)
1. Enable GitHub Pages in repository settings
2. Set source to "GitHub Actions"
3. Workflows handle everything automatically:
   - Daily data updates at 6 AM UTC
   - Automatic deployment when data changes
   - No manual intervention needed!

### Manual Deployment
For other hosting providers:
1. Update data: `cd scripts && python download-historical-data.py`
2. Build: `npm run build`
3. Deploy `dist/` folder to any static host

### Environment Setup
No environment variables, API keys, or secrets required!

## 🔧 Customization

### Adding New Tokens
1. Add Yahoo Finance symbol to `CRYPTO_SYMBOLS` in `download-historical-data.py`
2. Add mapping to `SYMBOL_TO_ID` dictionary
3. Run data update script
4. Token will appear in frontend automatically

### Adjusting Update Schedule
Modify cron schedule in `.github/workflows/update-and-deploy.yml`:
```yaml
schedule:
  - cron: '0 6 * * *'  # Daily at 6 AM UTC
```

## 📈 Performance Metrics

### Efficiency Benefits
- **Smart Updates**: Only fetches new days, not full history
- **Static Files**: No runtime API calls needed
- **Cached Data**: Reuses existing historical data
- **Minimal Bandwidth**: JSON files are compact and cacheable

### Scalability
- **1000 users**: Still only 1 daily API update
- **No Rate Limits**: Users load static files
- **Fast Loading**: Pre-calculated data, no computation needed

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Test data updates: `cd scripts && python download-historical-data.py`
4. Test frontend: `npm run dev`
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.