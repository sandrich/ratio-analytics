#!/usr/bin/env python3
"""
Simple Crypto Data Updater
- If no data exists: Downloads complete historical data
- If data exists: Only fetches delta (new days since last update)
- Frontend just loads the static JSON files
"""

import yfinance as yf
import json
import os
from datetime import datetime, timedelta
import pandas as pd

# Available crypto symbols from our test
CRYPTO_SYMBOLS = [
    'BTC-USD', 'ETH-USD', 'BNB-USD', 'XRP-USD', 'SOL-USD', 'ADA-USD', 
    'DOGE-USD', 'TRX-USD', 'LINK-USD', 'DOT-USD', 'LTC-USD', 'BCH-USD',
    'XLM-USD', 'ETC-USD', 'XMR-USD', 'AVAX-USD', 'SHIB-USD', 'ATOM-USD',
    'NEAR-USD', 'ALGO-USD', 'VET-USD', 'ICP-USD', 'HBAR-USD', 'QNT-USD',
    'FIL-USD', 'AAVE-USD'
]

# Mapping Yahoo symbols to crypto IDs (for file naming)
SYMBOL_TO_ID = {
    'BTC-USD': 'bitcoin', 'ETH-USD': 'ethereum', 'BNB-USD': 'binancecoin',
    'XRP-USD': 'xrp', 'SOL-USD': 'solana', 'ADA-USD': 'cardano',
    'DOGE-USD': 'dogecoin', 'TRX-USD': 'tron', 'LINK-USD': 'chainlink',
    'DOT-USD': 'polkadot', 'LTC-USD': 'litecoin', 'BCH-USD': 'bitcoin-cash',
    'XLM-USD': 'stellar', 'ETC-USD': 'ethereum-classic', 'XMR-USD': 'monero',
    'AVAX-USD': 'avalanche', 'SHIB-USD': 'shiba-inu', 'ATOM-USD': 'cosmos',
    'NEAR-USD': 'near', 'ALGO-USD': 'algorand', 'VET-USD': 'vechain',
    'ICP-USD': 'internet-computer', 'HBAR-USD': 'hedera', 'QNT-USD': 'quant',
    'FIL-USD': 'filecoin', 'AAVE-USD': 'aave'
}

def load_existing_data(crypto_id):
    """Load existing data file if it exists"""
    filename = f"public/data/{crypto_id}.json"
    if os.path.exists(filename):
        try:
            with open(filename, 'r') as f:
                return json.load(f)
        except:
            return None
    return None

def get_last_date_from_data(data):
    """Get the last date from existing price data"""
    if not data or not data.get('prices'):
        return None
    
    # Get last timestamp and convert to datetime
    last_timestamp_ms = data['prices'][-1][0]
    return datetime.fromtimestamp(last_timestamp_ms / 1000)

def update_crypto_data():
    """Update crypto data - full download or delta only"""
    
    # Create directory
    os.makedirs('public/data', exist_ok=True)
    
    print("🚀 Starting crypto data update...")
    print(f"📊 Processing {len(CRYPTO_SYMBOLS)} cryptocurrencies")
    print("=" * 60)
    
    successful_updates = []
    failed_updates = []
    
    for i, symbol in enumerate(CRYPTO_SYMBOLS, 1):
        try:
            crypto_id = SYMBOL_TO_ID[symbol]
            print(f"[{i:2d}/{len(CRYPTO_SYMBOLS)}] Processing {symbol} ({crypto_id})...", end=" ")
            
            # Check if we have existing data
            existing_data = load_existing_data(crypto_id)
            
            if existing_data:
                # Delta update: only fetch new data
                last_date = get_last_date_from_data(existing_data)
                if last_date:
                    # Compare dates only (ignore time) to handle timezone issues
                    today = datetime.now().date()
                    last_data_date = last_date.date()
                    days_since = (today - last_data_date).days
                    
                    if days_since == 0:
                        print(f"✅ Up to date ({last_data_date})")
                        successful_updates.append(symbol)
                        continue
                    
                    print(f"📈 Fetching {days_since} new days...", end=" ")
                    
                    # Fetch only recent data
                    ticker = yf.Ticker(symbol)
                    start_date = last_date + timedelta(days=1)
                    new_hist = ticker.history(start=start_date)
                    
                    if len(new_hist) == 0:
                        print("✅ No new data")
                        successful_updates.append(symbol)
                        continue
                    
                    # Append new data to existing
                    for date, row in new_hist.iterrows():
                        timestamp_ms = int(date.timestamp() * 1000)
                        price = float(row['Close'])
                        volume = float(row['Volume']) if pd.notna(row['Volume']) else 0
                        
                        existing_data["prices"].append([timestamp_ms, price])
                        existing_data["total_volumes"].append([timestamp_ms, volume])
                    
                    # Update metadata
                    existing_data["last_updated"] = datetime.now().isoformat()
                    existing_data["data_points"] = len(existing_data["prices"])
                    existing_data["latest_date"] = new_hist.index[-1].isoformat()
                    
                    data_to_save = existing_data
                    print(f"✅ Added {len(new_hist)} days")
                else:
                    # Corrupted existing data, do full download
                    print("🔄 Corrupted data, full download...", end=" ")
                    ticker = yf.Ticker(symbol)
                    hist = ticker.history(period="max")
                    data_to_save = create_full_data_structure(symbol, hist)
                    print(f"✅ {len(hist)} days")
            else:
                # Full download: no existing data
                print("📥 Full download...", end=" ")
                ticker = yf.Ticker(symbol)
                hist = ticker.history(period="max")
                
                if len(hist) == 0:
                    print("❌ No data available")
                    failed_updates.append(symbol)
                    continue
                
                data_to_save = create_full_data_structure(symbol, hist)
                print(f"✅ {len(hist)} days")
            
            # Save updated data
            filename = f"public/data/{crypto_id}.json"
            with open(filename, 'w') as f:
                json.dump(data_to_save, f, separators=(',', ':'))
            
            successful_updates.append(symbol)
            
        except Exception as e:
            print(f"❌ Error: {str(e)[:50]}")
            failed_updates.append(symbol)
    
    print("=" * 60)
    print(f"📊 UPDATE COMPLETE")
    print(f"✅ Successful: {len(successful_updates)} tokens")
    print(f"❌ Failed: {len(failed_updates)} tokens")
    
    if failed_updates:
        print(f"Failed tokens: {', '.join(failed_updates)}")
    
    # Create simple index
    index_data = {
        "last_updated": datetime.now().isoformat(),
        "total_tokens": len(successful_updates),
        "available_tokens": [SYMBOL_TO_ID[s] for s in successful_updates],
        "data_source": "Yahoo Finance"
    }
    
    with open('public/data/index.json', 'w') as f:
        json.dump(index_data, f, indent=2)
    
    print(f"📁 Data saved to public/data/")
    return successful_updates

def create_full_data_structure(symbol, hist):
    """Create the full data structure for a symbol"""
    data = {
        "symbol": symbol,
        "crypto_id": SYMBOL_TO_ID[symbol],
        "name": symbol.replace('-USD', ''),
        "last_updated": datetime.now().isoformat(),
        "data_points": len(hist),
        "earliest_date": hist.index[0].isoformat(),
        "latest_date": hist.index[-1].isoformat(),
        "prices": [],
        "total_volumes": []
    }
    
    # Convert price data: [timestamp_ms, price]
    for date, row in hist.iterrows():
        timestamp_ms = int(date.timestamp() * 1000)
        price = float(row['Close'])
        volume = float(row['Volume']) if pd.notna(row['Volume']) else 0
        
        data["prices"].append([timestamp_ms, price])
        data["total_volumes"].append([timestamp_ms, volume])
    
    return data

if __name__ == "__main__":
    update_crypto_data()