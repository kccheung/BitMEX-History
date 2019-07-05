//
// Developed by Tooraj Enayati
// Copying and distribution is promitted as long as credits are given
// Donation are greatly appreciated
//         BTC: 3QSSMwKuoS4wRJQCNofnqBVitpheBDPx8w
//         ETH: 0x5d883ef2ddac91034186b732cd1126cdb5d2c0f4
//         LTC: MBsbj8q38seA3Pk6tZk1WY7DkFRf2Yf6x1
// Twitter: @tooraj_enayati
// Telegram: ToorajEnayati
// Email: tooraj@isc.com.au
// Discord: tooraj#7318
//
//--------------------
// How to Use instructions:
//
// This script will add a menu item to your Google Sheet to get BitMEX account history.
// You can select the menu option to download your history as many time as you want.
//--------------------
// How to Setup Instructions:
//
// Create sheet called "Settings"
// Add a row for each bot with the following headings - currently rows 1-2 and columns 1-5 are all ignored and only columns 6 & 7 are used.
//
// Configuration
// Name<tab>Description<tab>Exchange<tab>Currency<tab>Download Limit<tab>API Key<tab>API Secret
// BOT1<tab>Short Bot<tab>BitMEX<tab>XBT<tab>100<tab><your key><tab><your secret>
// BOT2<tab>Long Bot<tab>BitMEX<tab>XBT<tab>100<tab><your key><tab><your secret>
//
// Use the Tool > Script Editor for you Google Sheet to add all of this to the editor, the save it.
// Save it all, the close and reopen you Google Sheet. You will be prompted to give the scrip run permissions.
// Once the permissions are granted, you should see see a "Get BitMEX History" menu option - USE IT :)
//--------------------
// Future enhancements:
// 1) Call the BitMEXGetHistory() for each bot/row
// 2) Use the "Download Limit" column for getting the history for more than 100
// 3) Use the "Currency" column for getting the history for other currencies
// 4) Use the "Exchange" column for getting the history from other exchanges
//
function onOpen() {
    createMenu();
}


function createMenu() {
    var ui = SpreadsheetApp.getUi();
    ui.createMenu('BitMEX Helper')
        .addItem('Download Trade History', 'getTradingHistory')
        .addItem('Download Funding History', 'getFundingHistory')
        .addItem('About', 'about')
        .addToUi();
}


function getTradingHistory() {
    // Read the settings for each bot and call bmxGetTradingHistory() for each one
    //
    // sheetConf: The name of the configuration sheet to read from
    //
    var ss = SpreadsheetApp.getActive();
    var notBlank = true;
    var i = 3;
    var settingSheet = ss.getSheetByName("Settings");

    // backup previous row on "total" sheet first
    var totalSheet = ss.getSheetByName("total");
    totalSheet.insertRowAfter(2);
    totalSheet.getRange("2:2").copyTo(totalSheet.getRange(3, 1), { contentsOnly: true });

    // For each bot listed in settings; get the API keys from the sheet
    while (notBlank) {
        var botName = settingSheet.getRange(i, 1).getValue();
        var limit = settingSheet.getRange(i, 5).getValue();
        var sLimit = Utilities.formatString('%d', limit);
        var key = settingSheet.getRange(i, 6).getValue();
        var secret = settingSheet.getRange(i, 7).getValue();
        var destName = settingSheet.getRange(i, 8).getValue();
        if (botName !== "") {
            bmxGetTradingHistory(sLimit, key, secret, destName);
            i++;
        } else {
            notBlank = false;
        }
    }

    totalSheet.getRange("A2").setValue(Utilities.formatDate(new Date(), "GMT+8", "yyyy-MM-dd HH:mm:ss"));
}

function getFundingHistory() {
    // Read the settings for each bot and call bmxGetFundingHistory() for each one
    //
    // sheetConf: The name of the configuration sheet to read from
    //
    var ss = SpreadsheetApp.getActive();
    var settingSheet = ss.getSheetByName("Settings");

    // get the first API keys from the sheet
    var limit = settingSheet.getRange(3, 5).getValue();
    var sLimit = Utilities.formatString('%d', limit);
    var key = settingSheet.getRange(3, 6).getValue();
    var secret = settingSheet.getRange(3, 7).getValue();
    bmxGetFundingHistory(sLimit, key, secret, "ETHUSD_funding");
}

//
// Reads the wallet history
// apiKey: the cell coordinate for reading the API key
// apiSecret: the cell coordinate for reading the API secret
// destSheet: The name of the configuration sheet to read from and write to
//
/**
 * @param {BigInteger} downLimit
 * @param {string} apiKey
 * @param {string} apiSecret
 * @param {string} destSheet
 */
function bmxGetTradingHistory(downLimit, apiKey, apiSecret, destSheet) {
    const COLUMN_INDEX = 5; // TODO: set your sheet filter here
    // Constrcut the URL https://www.bitmex.com/api/v1/user/walletHistory?currency=XBt&count=100
    var dataSet = bmxFetch(apiKey, apiSecret, "/api/v1/user/walletHistory?currency=XBt&count=", downLimit);

    // Logger.log(dataSet);
    var rows = [];
    var data;
    var tempDate;

    // write the data in rows
    for (var i = 0; i < dataSet.length; i++) {
        data = dataSet[i];
        if (data.transactTime !== null) {
            tempDate = data.transactTime.replace("T", " ");
            tempDate = tempDate.replace("Z", "");
        } else {
            tempDate = "null"
        }
        rows.push([tempDate, data.transactType, data.amount, data.fee, data.address, data.transactStatus, data.walletBalance]);
    }

    var ss = SpreadsheetApp.getActive();
    var theSheet = ss.getSheetByName(destSheet);
    var header = [];
    header.push(["transactTime", "transactType", "amount", "fee", "address", "transactStatus", "walletBalance"]);
    var cells = theSheet.getRange(1, 1, header.length, 7);
    cells.setValues(header);
    var cells = theSheet.getRange(2, 1, rows.length + 3, 7); // clear more rows first
    cells.clearContent();
    var cells = theSheet.getRange(2, 1, rows.length, 7);
    cells.setValues(rows);
    refreshFilter(destSheet, COLUMN_INDEX);
}


//
// Reads the wallet history
// apiKey: the cell coordinate for reading the API key
// apiSecret: the cell coordinate for reading the API secret
// destSheet: The name of the configuration sheet to read from and write to
//
/**
 * @param {BigInteger} downLimit
 * @param {string} apiKey
 * @param {string} apiSecret
 * @param {string} destSheet
 */
function bmxGetFundingHistory(downLimit, apiKey, apiSecret, destSheet) {
    const COLUMN_INDEX = 5; // TODO: set your sheet filter here
    // Constrcut the URL https://www.bitmex.com/api/v1/user/walletHistory?currency=XBt&count=100
    var dataSet = bmxFetch(apiKey, apiSecret, "/api/v1/funding?symbol=ETH&reverse=true&count=", downLimit);

    // Logger.log(dataSet);
    var rows = [];
    var data;
    var tempDate;

    // write the data in rows
    for (var i = 0; i < dataSet.length; i++) {
        data = dataSet[i];
        if (data.timestamp !== null) {
            tempDate = data.timestamp.replace("T", " ");
            tempDate = tempDate.replace("Z", "");
        } else {
            tempDate = "null"
        }
        rows.push([tempDate, data.symbol, data.fundingInterval, data.fundingRate, data.fundingRateDaily]);
    }

    var ss = SpreadsheetApp.getActive();
    var currentSheet = ss.getSheetByName(destSheet);
    // var header = [];
    // header.push(["transactTime", "transactType", "amount", "fee", "address", "transactStatus", "walletBalance"]);
    // var cell = ss.getSheetByName(destSheet).getRange(1, 1, header.length, 7);
    // cell.setValues(header);
    var cell = ss.getSheetByName(destSheet).getRange(2, 1, rows.length, 5);
    cell.setValues(rows);
}


/**
 * @param {string} destSheet
 * @param {number} columnIndex
 */
function refreshFilter(destSheet, columnIndex) {
    var ss = SpreadsheetApp.getActive();
    var currentSheet = ss.getSheetByName(destSheet);
    var filter = currentSheet.getFilter();
    if (filter) {
        var criteria = filter.getColumnFilterCriteria(columnIndex);
        if (criteria) {
            filter.setColumnFilterCriteria(columnIndex, criteria)
        }
    }
}

function about() {
    // Display a modeless dialog box with custom HtmlService content.
    var htmlOutput = HtmlService
        .createHtmlOutput('<font face="verdana"><p><b>Developed by Tooraj Enayati</b></p>' +
            '<p>Copying and distribution is promitted as long as credits are given</p>' +
            '<p><b>Donation are greatly appreciated</b></p>' +
            '<p>BTC: 3QSSMwKuoS4wRJQCNofnqBVitpheBDPx8w<br>' +
            'ETH: 0x5d883ef2ddac91034186b732cd1126cdb5d2c0f4<br>' +
            'LTC: MBsbj8q38seA3Pk6tZk1WY7DkFRf2Yf6x1</p>' +
            '<p><b>Twitter</b>: @tooraj_enayati<br>' +
            '<b>Telegram</b>: ToorajEnayati<br>' +
            '<b>Email</b>: tooraj@isc.com.au<br>' +
            '<b>Discord</b>: tooraj#7318</p></font>')
        .setWidth(450)
        .setHeight(350);
    SpreadsheetApp.getUi().showModelessDialog(htmlOutput, 'BitMEX History Downloader');
}