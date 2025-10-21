import yfinance as yf
from datetime import datetime

ticker = yf.Ticker('BTC-USD')
hist = ticker.history(period='5d')
print('📅 Most recent BTC-USD data from yfinance:')
print(f'Latest date: {hist.index[-1]}')
print(f'Latest price: ${hist["Close"].iloc[-1]:.2f}')
print(f'Data points in last 5 days: {len(hist)}')
print(f'Current time: {datetime.now()}')