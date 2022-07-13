
import { getBrowserData } from './getBrowserData';
import { keys } from 'ts-transformer-keys';
import { logger } from '@tokenscript/attestation/dist/libs/utils';


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
  imToken: boolean

  metaMaskAndroid: boolean
  alphaWalletAndroid: boolean
  mewAndroid: boolean
  imTokenAndroid: boolean
}

export const isBrowserDeviceWalletSupported = (unsupportedDeviceAndBrowserConfig:any) => {
  if(unsupportedDeviceAndBrowserConfig === undefined || unsupportedDeviceAndBrowserConfig === null) return true;
  const browserData = getBrowserData();
  let broswerIsSupported = true;
  const browserDeviceWalletSupportedMap =  ["iE", "iE9", "edge", "chrome", "phantomJS", "fireFox", "safari", "android", "iOS", "mac", "windows", "webView", "touchDevice", "metaMask", "alphaWallet", "mew", "trust", "goWallet", "status", "imToken", "metaMaskAndroid", "alphaWalletAndroid", "mewAndroid", "imTokenAndroid"];
  browserDeviceWalletSupportedMap.forEach((item) => { 
    logger(2, item, unsupportedDeviceAndBrowserConfig[item as keyof BrowserDataInterface], browserData[item as keyof BrowserDataInterface]);
    if(
      unsupportedDeviceAndBrowserConfig[item as keyof BrowserDataInterface] &&
      unsupportedDeviceAndBrowserConfig[item as keyof BrowserDataInterface] === true &&
      browserData[item as keyof BrowserDataInterface] === true
    ) {
      broswerIsSupported = false; 
    }
  });
  return broswerIsSupported;
}
