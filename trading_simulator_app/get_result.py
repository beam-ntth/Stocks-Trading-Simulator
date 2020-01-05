import urllib.request
import matplotlib.pyplot as plt
import json, os, re
import numpy as np
from pandas.plotting import register_matplotlib_converters

register_matplotlib_converters()

apiKey = 'USV8FZL0BP6O47MM'

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, 'static')

class Search:
    def __init__(self, symbol, name, marketOpen, marketClose, timezone):
        self.symbol = symbol
        self.name = name
        self.marketOpen = marketOpen
        self.marketClose = marketClose
        self.timezone = timezone

def get_search_result(keyword):
    link = 'https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=' + keyword + '&apikey=' + apiKey
    data_link = urllib.request.urlopen(link)
    all_data = json.load(data_link)['bestMatches']
    print(all_data)
    all_search_object = []
    for datum in all_data:
        search_obj = Search(datum['1. symbol'], datum['2. name'], datum['5. marketOpen'], datum['6. marketClose'], datum['7. timezone'])
        all_search_object.append(search_obj)

    return all_search_object

class Result:
    def __init__(self, symbol, name, open_val, close_val):
        self.symbol = symbol
        self.name = name
        self.open_val = open_val
        self.close_val = close_val


def get_stock_graph(symbol, name):
    
    if os.path.exists('./static/images/' + symbol + '.png'):
        os.unlink('./static/images/' + symbol + '.png')
        plt.clf()

    plt.figure(figsize=(15,11), dpi=150)
    plt.title(symbol + ' - 1 week')

    link_1 = 'https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=' + symbol + '&apikey=' + apiKey

    url_link = urllib.request.urlopen(link_1)
    my_data = json.load(url_link)['Time Series (Daily)']

    all_key = []
    all_value = []
    
    for key in my_data:
        all_key.append(key)
        all_value.append(float(my_data[key]['4. close']))
    
    all_key_week = list(all_key[:7])
    all_key_week.reverse()
    all_value_week = list(all_value[:7])
    all_value_week.reverse()

    plt.grid(True)
    plt.plot(all_key_week, all_value_week, label=symbol)
    plt.legend()
    plt.savefig(STATIC_DIR + '/images/' + symbol + '.png')

    today = all_key_week[-1]
    result_obj = Result(symbol, name, float(my_data[today]['1. open']), all_value_week[-1])

    return result_obj

if __name__ == "__main__":
    get_search_result("AApl")