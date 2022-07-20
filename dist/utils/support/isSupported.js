import { getBrowserData } from './getBrowserData';
export var isUserAgentSupported = function (unsupportedDeviceAndBrowserConfig) {
    if (unsupportedDeviceAndBrowserConfig === undefined || unsupportedDeviceAndBrowserConfig === null)
        return true;
    var browserData = getBrowserData();
    var broswerIsSupported = true;
    var browserDeviceWalletSupportedMap = ["iE", "iE9", "edge", "chrome", "phantomJS", "fireFox", "safari", "android", "iOS", "mac", "windows", "webView", "touchDevice", "metaMask", "alphaWallet", "mew", "trust", "goWallet", "status", "imToken", "metaMaskAndroid", "alphaWalletAndroid", "mewAndroid", "imTokenAndroid"];
    browserDeviceWalletSupportedMap.forEach(function (item) {
        if (unsupportedDeviceAndBrowserConfig[item] &&
            unsupportedDeviceAndBrowserConfig[item] === true &&
            browserData[item] === true) {
            broswerIsSupported = false;
        }
    });
    return broswerIsSupported;
};
export var unSupportedUserAgents = ["iE", "iE9"];
//# sourceMappingURL=isSupported.js.map