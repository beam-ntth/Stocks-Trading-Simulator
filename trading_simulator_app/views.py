from django.shortcuts import render
from trading_simulator_app.models import Stock, Buy, Sell
from . import get_result
from datetime import date
from .models import Stock, Buy, Sell
import sys, urllib.request, json

# Configure Settings

import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'stocks_trading_simulator.settings')

import django
django.setup()

# Create your views here.
# Main Page
all_elements = {}

apiKey = 'USV8FZL0BP6O47MM'

def index(request):
    current_money_holding = 0
    current_diff = 0
    all_current_stocks = []
    date_today = str(date.today())
    stock_list = Stock.objects.filter()
    for stock in stock_list:
        all_current_stocks.append(str(stock.symbol))

    for stock in all_current_stocks:
        total_holding = get_total_num_stocks(stock)

        link_1 = 'https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=' + stock + '&apikey=' + apiKey
        url_link = urllib.request.urlopen(link_1)

        # Change to date_today after finished developing
        today_data = json.load(url_link)['Time Series (Daily)']["2020-01-03"]
        open_val = today_data["1. open"]
        close_val = today_data["4. close"]
        diff_val = float(close_val) - float(open_val)
        current_money_holding += int(total_holding) * float(close_val)
        current_diff += int(total_holding) * diff_val

    current_money_holding = '{:,.2f}'.format(current_money_holding)
    sign = 'pos' if current_diff >= 0 else 'neg'
    current_diff = '{:,.2f}'.format(abs(current_diff))
    all_elements['current'] = current_money_holding
    all_elements['diff'] = current_diff
    all_elements['sign'] = sign
    all_elements['searches'] = []
    return render(request, 'trading_simulator_app/index.html', context=all_elements)

def search(request):
    try:
        query = request.GET['company']
        search_dict = get_result.get_search_result(query)
    except:
        search_dict = []

    all_elements['searches'] = search_dict
    return render(request, 'trading_simulator_app/index.html', context=all_elements)

# Update the amount of stocks that user bought
def buy_stocks(request):
    # Get symbol and name of stock
    symbol = request.GET['symbol']
    name = request.GET['name']
    bought = request.GET['bought']
    close_price = request.GET['close']
    date_today = str(date.today())

    # Add stock symbol into database if not existed
    stock = Stock.objects.get_or_create(symbol=symbol, name=name)[0]
    stock.save()
    
    # Add new transaction
    buy = Buy.objects.create(symbol=stock, number_bought=bought, price_bought=close_price, date_bought=date_today)

    return render(request, 'trading_simulator_app/index.html', context=all_elements)

# Update the amount of stocks that user sold
def sold_stocks(request):
    # Get symbol and name of stock
    symbol = request.GET['symbol']
    name = request.GET['name']
    sold = request.GET['sold']
    close_price = request.GET['close']
    date_today = str(date.today())

    # Add stock symbol into database if not existed
    stock = Stock.objects.get_or_create(symbol=symbol, name=name)[0]
    stock.save()

    # Add new transaction
    sold = Sell.objects.create(symbol=stock, number_sold=sold, price_sold=close_price, date_sold=date_today)

    return render(request, 'trading_simulator_app/index.html', context=all_elements)

# Update the price of all stocks when user click refresh button
def refresh(request):
    return render(request, 'trading_simulator_app/index.html')

# Redirected to history page
def history(request):
    stock_objects = Stock.objects.filter()
    buy_objects = Buy.objects.filter()
    sell_objects = Sell.objects.filter()
    
    history_elements = {'stock' : stock_objects, 'buy' : buy_objects, 'sell' : sell_objects}
    return render(request, 'trading_simulator_app/history.html', context=history_elements)

# Show the stats of the particular stock
def render_detail(request):
    # Get symbol and
    symbol = request.GET['symbol']
    name = request.GET['name']

    # Get graph
    result_dict = get_result.get_stock_graph(symbol, name)

    total_stock = get_total_num_stocks(symbol)
    total_stock = format(total_stock, ",d")
    all_elements['result'] = result_dict
    all_elements['holding'] = total_stock
    return render(request, 'trading_simulator_app/index.html', context=all_elements)

def get_total_num_stocks (symbol):
    # Get number of stocks from database
    buy_amount = 0
    sell_amount = 0
    buy_list = None
    sell_list = None

    try:
        buy_list = Buy.objects.filter()
    except:
        print("Can't access buy")
        print(sys.exc_info())

    try:
        sell_list = Sell.objects.filter()
    except:
        print("Can't access sell")
        print(sys.exc_info())

    if buy_list != None:
        for buy in buy_list:
            if str(buy.symbol) == symbol:
                buy_amount += buy.number_bought

    if sell_list != None:
        for sell in sell_list:
            if str(sell.symbol) == symbol:
                sell_amount += sell.number_sold

    total_stock = buy_amount - sell_amount
    return total_stock