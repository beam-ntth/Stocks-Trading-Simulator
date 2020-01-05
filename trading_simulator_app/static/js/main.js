/**
 * Global elements of the app
 */

const elements = {
    searchButton: document.querySelector('.search-button'),
    searchField: document.querySelector('.search__company'),
    searchResult: document.querySelector('.search-result-container'),
    clearSearch: document.querySelector('.clear-button'),
    favoriteField: document.querySelector('.favorite-container'),
    resultField: document.querySelector('.result-container'),
    refreshButton: document.querySelector('.refresh-button'),
    lastUpdated: document.querySelector('.last__updated'),
    buyButton: document.querySelector('.buy-btn'),
    sellButton: document.querySelector('.sell-btn'),
    amountField: document.querySelector('.stock__amount'),
    historyButton: document.querySelector('.history-btn')
};

const apiKey = 'USV8FZL0BP6O47MM'

const state = {};

/***********************************************************************************/

/**
 * SEARCH MODEL
 */
class Search {
    constructor(query) {
        this.query = query;
    }

    async getResults() {
        try {
            const result = await fetch(`https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${this.query}&apikey=${apiKey}`);
            const data = await result.json();
            this.result = data.bestMatches;

        } catch (error) {
            alert(error);
        }
    }
}

/**
 * SEARCH VIEW
 */

const getSearch = () => {
    return elements.searchField.value;
}

// Clear all search results
const clearResult = () => {
    elements.searchResult.innerHTML = '';
}

// Clear query in the url
const clearQuery = () => {
    window.location.href = window.location.href.split('?')[0];
}


/**
 * SEARCH CONTROLLER
 */

elements.clearSearch.addEventListener('click', e => {
    e.preventDefault();
    clearResult();
})

elements.searchButton.addEventListener('click', e => {
    e.preventDefault();
    const keyword = getSearch();
    if (window.location.pathname === `/search/`) {
        window.location.href = `?company=${keyword}`;
    } else if (window.location.pathname === '') {
        window.location.href = `/search/?company=${keyword}`;
    } else {
        window.history.replaceState({}, document.title, '');
        window.location.href = `/search/?company=${keyword}`;
    }
    // window.history.replaceState({}, document.title, `/search/?company=${keyword}`)
    
})

/***********************************************************************************/

/**
 * FAVORITE MODEL
 */

class Favorite {
    constructor() {
        this.favs = [];
    }

    addFav(symbol, name, close, diff) {
        const fav = {symbol, name, close, diff};
        this.favs.push(fav);

        this.persistData();

        return fav;
    }

    isFaved (symbol) {
        return this.favs.findIndex(el => el.symbol === symbol) !== -1;
    }

    deleteFav(symbol) {
        const index = this.favs.findIndex(el => el.symbol === symbol);
        this.favs.splice(index, 1);

        this.persistData();
    }

    getNumFavs() {
        return this.favs.length;
    }

    persistData() {
        localStorage.setItem('favs',  JSON.stringify(this.favs));
    }

    readStorage() {
        const storage = JSON.parse(localStorage.getItem('favs'));

        if (storage) {
            this.favs = storage;
        }
    }
}

/**
 * FAVORITE VIEW
 */
// href="/detail/?company=${fav.symbol}"

const renderFavs = fav => {
    const markup = `
    <a class="row p-2 select align-items-center fav__link" data-symbol=${fav.symbol} data-name=${fav.name}>
        <div class="col-5">
            <div class="row">${fav.symbol}</div>
            <div class="row">${fav.name}</div>
        </div>
        <div class="col-5">${fav.close} <span class="${fav.diff >= 0 ? 'text-success' : 'text-danger'}">${fav.diff >= 0 ? '+' : '-'}${Math.abs(fav.diff)}</span> 
        </div>
        <div class="col-2 remove delete-btn">
            <span><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-x-circle"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg></span>
        </div>    
    </a>
    `
    elements.favoriteField.insertAdjacentHTML('beforeend', markup);
}

const deleteFav = symbol => {
    const elem = document.querySelector(`.fav__link[data-symbol*="${symbol}"]`);
    if (elem) {
        elem.parentElement.removeChild(elem);
    }
}

/**
 * FAVORITE CONTROLLER
 */

const controlAddFav = async (symbol, name) => {
    // If there is no favorite object yet -> create one
    if (!state.favs) state.favs = new Favorite();

    // Price of each stocks at open, close, and the difference
    let open = -1;
    let close = -1;
    let diff = -1;
    
    // Get JSON result of the paricular stock
    try {
        const result = await fetch(`https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${apiKey}`);
        const data = await result.json();
        
        // Format current date
        const today = new Date();
        const date = today.getDate();
        const month = today.getMonth();
        const year = today.getFullYear();
        const query_date = `${year}-${month < 10 ? '0' : ''}${month + 1}-${date < 10 ? '0' : ''}${date-2}`
        const time_day_data = data["Time Series (Daily)"][query_date];

        // Get the open, close, diff prices
        open = parseFloat(time_day_data["1. open"])
        close = parseFloat(time_day_data["4. close"])
        diff = (close-open).toFixed(2);

    } catch (error) {
        alert(error);
    }

    // Add favorite to the state
    const newFav = state.favs.addFav(
        symbol,
        name,
        close,
        diff
    );

    // Add favorite to UI list
    renderFavs(newFav)
};

const controlDeleteFav = (symbol) => {
    // Remove fav from the state
    state.favs.deleteFav(symbol);

    // Remove fav from UI list
    deleteFav(symbol);
}

/**
 * FAVOURITE USER INTERACTION
 */

// User click add button
const add_buttons = document.querySelectorAll('.add-btn')
for (const button of add_buttons) {
    button.addEventListener('click', e => {
        e.preventDefault();
        const btn = e.target.closest('.row');
        controlAddFav(btn.dataset.symbol, btn.dataset.name);
    })
}

/**
 * DETAILS VIEW
 */

const renderDetails = (object) => {
    const markup = `
    <div class="row">
        <span class="title m-3">${object.symbol} <span class="subtitle">${object.name} </span></span>
        <span class="ml-auto m-3"><span class="market"><b>At Open</b> - </span>${(parseFloat(object.close) - parseFloat(object.diff)).toFixed(2)}<span class="market"> | <b>At Close</b></span> - ${object.close}</span>
    </div>
    <div class="row my-3">
        <div class="col-2"></div>
        <div class="col-8">
            <img class="img-fluid" src="../../static/images/${object.symbol}.png">
        </div>
        <div class="col-2"></div>
    </div>
    <div class="row m-3 align-items-center smaller-title">
        <div class="col-2 text-left">Currently Holding</div>
        <div class="col-1 text-left">2000</div>
        <div class="col-2">shares with AAPL</div> 
        <div class="col-6"></div>
    </div>
    <div class="row m-3 align-items-center">
        <div class="col-2 text-left smaller-title">Buy or Sell:</div>
        <div class="col-4"><input class="form-control" type="number" placeholder="Ex: 2000"></div>
        <div class="col-4">
            <button class="btn btn-success mx-2"> BUY </button>
            <button class="btn btn-danger mx-2"> SELL </button>
        </div>
    </div>
    `
    elements.resultField.insertAdjacentHTML('beforeend', markup);
}

// User click delete button
document.querySelector('.favorite-container').addEventListener('click', e => {
    e.preventDefault();
    if (e.target.closest('.delete-btn')) {
        const btn = e.target.closest('.row')
        controlDeleteFav(btn.dataset.symbol);
    } else {
        const btn = e.target.closest('.fav__link')
        // const found_obj = state.favs.favs.find(el => el.symbol === btn.dataset.symbol);
        window.location.href = `/render_detail/?symbol=${btn.dataset.symbol}&name=${btn.dataset.name}`;
    }
})

// Restore favorites on page load
window.addEventListener('load', () => {
    state.favs = new Favorite();
    
    // Restore favs
    state.favs.readStorage();

    // Render the existing favs
    state.favs.favs.forEach(fav => renderFavs(fav));

    // Render last updated date
    elements.lastUpdated.textContent = localStorage.getItem('last_updated_date');
});

/***********************************************************************************/

/**
 * REFRESH MODEL
 */
const get_new_data = async (symbol) => {
    try {
        const result = await fetch(`https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${apiKey}`);
        const data = await result.json();
    } catch (error) {
        alert(error);
    }
};

/**
 * REFRESH BUTTON
 */

elements.refreshButton.addEventListener('click', async (e) => {
    e.preventDefault();
    elements.favoriteField.innerHTML = '';
    const today = new Date();
    const date = today.getDate();
    const month = today.getMonth();
    const year = today.getFullYear();
    const query_date = `${year}-${month < 10 ? '0' : ''}${month + 1}-${date < 10 ? '0' : ''}${date-2}`;

    for (const obj of state.favs.favs) {
        // Price of each stocks at open, close, and the difference
        let open = -1;
        let close = -1;
        let diff = -1;
        
        // Get JSON result of the paricular stock
        try {
            const result = await fetch(`https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${obj.symbol}&apikey=${apiKey}`);
            const data = await result.json();
            
            // Format current date
            const time_day_data = data["Time Series (Daily)"][query_date];

            // Get the open, close, diff prices
            open = parseFloat(time_day_data["1. open"])
            close = parseFloat(time_day_data["4. close"])
            diff = (close-open).toFixed(2);

        } catch (error) {
            alert(error);
        }
        
        const newFav = {
            symbol: obj.symbol,
            name: obj.name,
            close: close,
            diff: diff
        };

        // Add favorite to UI list
        renderFavs(newFav)
    }

    let last_updated_date = `Last Updated: ${month < 10 ? '0' : ''}${month + 1}/${date < 10 ? '0' : ''}${date}/${year}`
    elements.lastUpdated.textContent = last_updated_date;
    localStorage.setItem('last_updated_date', last_updated_date)
    localStorage.setItem('favs',  JSON.stringify(this.favs.favs));
})

/**
 * BUY BUTTON
 */

elements.buyButton.addEventListener('click', e => {
    e.preventDefault();
    const btn = e.target.closest('.row');
    const symbol = btn.dataset.symbol;
    const name = btn.dataset.name;
    const close = btn.dataset.close;
    const amount = elements.amountField.value;
    window.location.href = `/buy/?symbol=${symbol}&name=${name}&bought=${amount}&close=${close}`
});

/**
 * SELL BUTTON
 */

elements.sellButton.addEventListener('click', e => {
    e.preventDefault();
    const btn = e.target.closest('.row')
    const symbol = btn.dataset.symbol;
    const name = btn.dataset.name;
    const close = btn.dataset.close;
    const amount = elements.amountField.value;
    window.location.href = `/sell/?symbol=${symbol}&name=${name}&sold=${amount}&close=${close}`
})

/**
 * HISTORY BUTTON
 */

// elements.historyButton.addEventListener('click', e => {
//     e.preventDefault();
//     window.location.href = '/transaction-history/';
// });