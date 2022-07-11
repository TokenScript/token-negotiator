
import { getBrowserData } from './getBrowserData';

interface BrowserDataInterface {
  iE: boolean
  iE9: boolean
  edge: boolean
  chrome: boolean
  phantomJS: boolean
  fireFox: boolean
  safari: boolean
  android: boolean
  iOS: boolean
  mac: boolean
  windows: boolean
  webView: boolean
  touchDevice: boolean
  metaMask: boolean
  alphaWallet: boolean
  mew: boolean
  trust: boolean
  goWallet: boolean
  status: boolean
  isImToken: boolean
}

export const isBrowserDeviceWalletSupported = (unsupportedDeviceAndBrowserConfig:any) => {
  if(unsupportedDeviceAndBrowserConfig === undefined || unsupportedDeviceAndBrowserConfig === null) return true;
  const browserData = getBrowserData();
  let broswerIsSupported = true;
  const browserDeviceWalletSupportedMap =  ["iE", "iE9", "edge", "chrome", "phantomJS", "fireFox", "safari", "android", "iOS", "mac", "windows", "touchDevice", "metaMask", "alphaWallet", "mew", "trust", "goWallet", "status", "isImToken"];
  browserDeviceWalletSupportedMap.forEach((item) => { 
    if(
      unsupportedDeviceAndBrowserConfig[item as keyof BrowserDataInterface] === true &&
      browserData[item as keyof BrowserDataInterface] === true
    ) {
      broswerIsSupported = false; 
    }
  });
  return broswerIsSupported;
}
