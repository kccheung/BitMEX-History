//
// Helper function to fetch bitmex RESTful api
// apiKey: the cell coordinate for reading the API key
// apiSecret: the cell coordinate for reading the API secret
// destSheet: The name of the configuration sheet to read from and write to
//
/**
 * @param {string} apiKey
 * @param {string} apiSecret
 * @param {string} endpoint
 * @param {BigInteger} downLimit
 */
function bmxFetch(apiKey, apiSecret, endpoint, downLimit) {
    // Constrcut the URL https://www.bitmex.com/api/v1/user/walletHistory?currency=XBt&count=100
    var webSite = "https://www.bitmex.com";
    // var path = "/api/v1/user/walletHistory?currency=XBt&count=" + downLimit;
    var path = endpoint + downLimit;
    var url = webSite + path;

    // Construct the signature
    var nonce = Number(new Date().getTime()).toFixed(0);
    var string = 'GET' + path + nonce;
    var sKey = Utilities.computeHmacSha256Signature(string, apiSecret);
    sKey = sKey.map(function(e) {
        var v = (e < 0 ? e + 256 : e).toString(16);
        return v.length == 1 ? "0" + v : v;
    }).join("");

    // Construct the header details
    var params = {
        'method': 'GET',
        'headers': {
            'api-signature': sKey,
            'api-key': apiKey,
            'api-nonce': nonce
        },
        'muteHttpExceptions': true
    };

    // Send the request to the BitMEX API and receive the user data.
    var response = UrlFetchApp.fetch(url, params);
    var dataAll = JSON.parse(response.getContentText());

    return dataAll;
}