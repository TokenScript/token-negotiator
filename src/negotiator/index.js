import { SignedDevconTicket } from './../Attestation/SignedDevonTicket';

const getTokenConfig = (tokenId) => {
  let XMLconfig = {};
  // this will come from a lookup table at a later stage.
  if (token === "devcon-ticket") {
    XMLconfig = {
      attestationOrigin: "https://stage.attestation.id",
      tokenOrigin: "https://devcontickets.herokuapp.com/outlet/",
      tokenUrlName: 'ticket',
      tokenSecretName: 'secret',
      unsignedTokenDataName: 'ticket',
      tokenIdName: 'id',
      tokenParserUrl: '',
      tokenParser: SignedDevconTicket,
      localStorageItemName: 'dcTokens'
    };
  } else {
    console.log("Negotiator: missing token script for this token");
  }
  return XMLconfig;
}

export class Negotiator {

  constructor(filter = {}, tokenId, options = { userPermissionRequired: false }) {

    if(!token) console.log("Negotiator: token is a required parameter");

    // The XML config is used to define the token configuration.
    // This includes how the ticket will confirm its vailidity and the origin
    // of where the ticket was issued from.
    let XMLconfig = getTokenConfig(tokenId);
    // When True, the negoticator will require userPermissionStatus to be true to
    // read and provide tokens to client.
    this.userPermissionRequired = options.userPermissionRequired;
    // When userPermissionRequired is false, this flag defaults to true. Where 
    // no permission (input from user) is required.
    this.userPermissionStatus = !options.userPermissionRequired ? true : undefined;
    // TODO annotate the usage of variables below.
    this.queuedCommand = false;
    this.filter = filter;
    this.debug = 0;
    this.hideTokensIframe = 1;
    this.tokenOrigin = XMLconfig.tokenOrigin;
    this.attestationOrigin = XMLconfig.attestationOrigin;
    this.tokenUrlName = XMLconfig.tokenUrlName;
    this.tokenSecretName = XMLconfig.tokenSecretName;
    this.tokenIdName = XMLconfig.tokenIdName;
    this.unsignedTokenDataName = XMLconfig.unsignedTokenDataName;
    this.tokenParser = XMLconfig.tokenParser;
    this.localStorageItemName = XMLconfig.localStorageItemName;
    this.addTokenIframe = null;

    if (options.hasOwnProperty('debug')) this.debug = options.debug;
    if (options.hasOwnProperty('attestationOrigin')) this.attestationOrigin = options.attestationOrigin;
    if (options.hasOwnProperty('tokenOrigin')) this.tokenOrigin = options.tokenOrigin;

    this.isTokenOriginWebsite = false;

    if (this.attestationOrigin) {
      // if attestationOrigin filled then token need attestaion
      let currentURL = new URL(window.location.href);

      let tokenOriginURL = new URL(this.tokenOrigin);

      if (currentURL.origin === tokenOriginURL.origin) {
        // its tokens website, where tokens saved in localStorage
        // lets chech url params and save token data to the local storage
        this.isTokenOriginWebsite = true;
        this.readMagicUrl();
      }

      this.attachPostMessageListener(event => {
        if (event.origin !== tokenOriginURL.origin) {
          return;
        }
        if (event.data.iframeCommand && event.data.iframeCommand == "closeMe" && this.addTokenIframe) {
          this.addTokenIframe.remove();
          const tokenEvent = new Event('newTokenAdded');
          document.body.dispatchEvent(tokenEvent);
        }

      })
    }

    // do we inside iframe?
    if (window !== window.parent) {
      this.debug && console.log('negotiator: its iframe, lets return tokens to the parent');

      // its iframe, listen for requests
      this.attachPostMessageListener(this.listenForParentMessages.bind(this))

      // send ready message to start interaction
      let referrer = new URL(document.referrer);
      window.parent.postMessage({ iframeCommand: "iframeReady", iframeData: '' }, referrer.origin);
    }
  }

  // Once a user has given or revoked their permission to use the token-negotiator
  setUserPermission(bool) {
    this.userPermissionStatus = bool;
  }

  // returns true / false
  getUserPermission() {
    return this.userPermissionStatus;
  }

  // TODO confirm with team if we can deprecate this method.
  // It appears to do the same task as the method getTokenInstances?
  // It seems that using one method or the other will work just fine.
  negotiate(callBack) {
    return getTokenInstances(callBack);
  }

  getTokenInstances(callBack) {
    // callback function required
    // user permission required (for now - if this is not defined it is true)
    // TODO add logic: allow always when token when origin.
    if (
      this.userPermissionStatus === false ||
      typeof callBack !== "function"
    ) {
      return false;
    }

    this.negotiateCallback = callBack;

    // console.log('attestationOrigin = '+this.attestationOrigin);
    if (this.attestationOrigin) {

      if (window.location.href === this.tokenOrigin) {
        // just read an return tokens
        let tokensOutput = this.readTokens();
        if (tokensOutput.success && !tokensOutput.noTokens) {
          let decodedTokens = this.decodeTokens(tokensOutput.tokens);
          let filteredTokens = this.filterTokens(decodedTokens);
          tokensOutput.tokens = filteredTokens;
          this.negotiateCallback(tokensOutput);
        }
      } else {
        this.queuedCommand = { parentCommand: 'tokensList', parentData: '' };
        this.createIframe()
      }
    } else {
      console.log('no attestationOrigin...');
      // TODO test token against blockchain and show tokens as usual view
    }
  }

  addTokenThroughIframe({ ticket, secret, id }) {
    // Create and append Iframe with magic link
    const magicLink = `${this.tokenOrigin}/?ticket=${ticket}&secret=${secret}&id=${id}`;
    const iframe = document.createElement('iframe');
    this.addTokenIframe = iframe;
    iframe.src = magicLink;
    iframe.style.width = '1px';
    iframe.style.height = '1px';
    iframe.style.opacity = 0;
    document.body.appendChild(iframe);
  }

  listenForParentMessages(event) {

    // listen only parent
    let referrer = new URL(document.referrer);
    if (event.origin !== referrer.origin) {
      return;
    }

    // console.log('iframe: event = ', event.data);

    // parentCommand+parentData required for interaction
    if (
      typeof event.data.parentCommand === "undefined"
      || typeof event.data.parentData === "undefined"
    ) {
      return;
    }

    // parentCommand contain command code
    let command = event.data.parentCommand;

    // parentData contains command content (token to sign or empty object)
    let data = event.data.parentData;

    console.log('iframe: command, data = ', command, data);

    switch (command) {
      case "signToken":
        // we receive decoded token, we have to find appropriate raw token
        console.log('let Auth data:', data);
        if (typeof window.Authenticator === "undefined") {
          console.log('Authenticator not defined.');
          return;
        }

        let rawTokenData = this.getRawToken(data);

        console.log('rawTokenData: ', rawTokenData);

        let base64ticket = rawTokenData.token;
        let ticketSecret = rawTokenData.secret;
        this.authenticator = new Authenticator(this);

        let tokenObj = {
          ticketBlob: base64ticket,
          ticketSecret: ticketSecret,
          attestationOrigin: this.attestationOrigin,
        };
        if (rawTokenData && rawTokenData.id) tokenObj.email = rawTokenData.id;
        if (rawTokenData && rawTokenData.magic_link) tokenObj.magicLink = rawTokenData.magic_link;

        this.authenticator.getAuthenticationBlob(tokenObj,
          res => {
            console.log('sign result:', res);
            window.parent.postMessage({ iframeCommand: "useTokenData", iframeData: { useToken: res, message: '', success: !!res } }, referrer.origin);
          });
        break;
      case "tokensList":
        // TODO update
        // console.log('let return tokens');
        this.returnTokensToParent();
        break;

      default:
    }
  }

  commandDisplayIframe() {
    let referrer = new URL(document.referrer);
    window.parent.postMessage({ iframeCommand: "iframeWrap", iframeData: 'show' }, referrer.origin);
  }

  commandHideIframe() {
    let referrer = new URL(document.referrer);
    window.parent.postMessage({ iframeCommand: "iframeWrap", iframeData: 'hide' }, referrer.origin);
  }

  returnTokensToParent() {
    let tokensOutput = this.readTokens();
    if (tokensOutput.success && !tokensOutput.noTokens) {
      let decodedTokens = this.decodeTokens(tokensOutput.tokens);
      let filteredTokens = this.filterTokens(decodedTokens);
      tokensOutput.tokens = filteredTokens;
    }
    let referrer = new URL(document.referrer);
    window.parent.postMessage({ iframeCommand: "tokensData", iframeData: tokensOutput }, referrer.origin);
  }

  readMagicUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromQuery = urlParams.get(this.tokenUrlName);
    const secretFromQuery = urlParams.get(this.tokenSecretName);
    const idFromQuery = urlParams.get(this.tokenIdName);

    if (!(tokenFromQuery && secretFromQuery)) {
      return;
    }

    // Get the current Storage Tokens
    let tokensOutput = this.readTokens();
    let tokens = [];

    let isNewQueryTicket = true;

    if (!tokensOutput.noTokens) {
      // Build new list of tickets from current and query ticket { ticket, secret }
      tokens = tokensOutput.tokens;

      tokens.map(tokenData => {
        if (tokenData.token === tokenFromQuery) {
          isNewQueryTicket = false;
        }
      });

    }

    // Add ticket if new
    // if (isNewQueryTicket && tokenFromQuery && secretFromQuery) {
    if (isNewQueryTicket) {
      tokens.push({
        token: tokenFromQuery,
        secret: secretFromQuery,
        id: idFromQuery,
        magic_link: window.location.href
      }); // new raw object
    }
    // Set New tokens list raw only, websters will be decoded each time
    localStorage.setItem(this.localStorageItemName, JSON.stringify(tokens));

    if (window !== window.parent) {
      this.debug && console.log('negotiator: its iframe, lets close it');

      // send ready message to start interaction
      let referrer = new URL(document.referrer);
      window.parent.postMessage({ iframeCommand: "closeMe" }, referrer.origin);
    }
  }

  /*
   * Return token objects satisfying the current negotiator's requirements
   */
  filterTokens(decodedTokens, filter = {}) {
    if (Object.keys(filter).length == 0) {
      filter = this.filter;
    }
    let res = [];
    if (
      decodedTokens.length
      && typeof filter === "object"
      && Object.keys(filter).length
    ) {
      let filterKeys = Object.keys(filter);
      decodedTokens.forEach(token => {
        let fitFilter = 1;
        this.debug && console.log('test token:', token);
        filterKeys.forEach(key => {
          if (token[key].toString() != filter[key].toString()) fitFilter = 0;
        })
        if (fitFilter) {
          res.push(token);
          this.debug && console.log('token fits:', token);
        }
      })
      return res;
    } else {
      return decodedTokens;
    }
  }

  compareObjects(o1, o2) {
    for (var p in o1) {
      if (o1.hasOwnProperty(p)) {
        if (o1[p].toString() !== o2[p].toString()) {
          return false;
        }
      }
    }
    for (var p in o2) {
      if (o2.hasOwnProperty(p)) {
        if (o1[p].toString() !== o2[p].toString()) {
          return false;
        }
      }
    }
    return true;
  };

  // read tokens from local storage and return as object {tokens: [], noTokens: boolean, success: boolean}
  readTokens() {
    const storageTickets = localStorage.getItem(this.localStorageItemName);
    let tokens = [];
    let output = { tokens: [], noTokens: true, success: true };
    try {
      if (storageTickets && storageTickets.length) {
        // Build new list of tickets from current and query ticket { ticket, secret }
        tokens = JSON.parse(storageTickets);
        if (tokens.length !== 0) {

          // output.tokens = tokens;
          tokens.forEach(item => {
            if (item.token && item.secret) {
              output.tokens.push(item)
              // output.tokens.push({
              //     token: item.token,
              //     secret: item.secret
              // })
            }
          })
        }
        if (output.tokens.length) {
          output.noTokens = false;
        }
      }
    } catch (e) {
      console.log('Cant parse tokens in LocalStorage');
      if (typeof callBack === "function") {
        output.success = false;
      }
    }
    return output;
  }

  getRawToken(unsignedToken) {
    let tokensOutput = this.readTokens();
    if (tokensOutput.success && !tokensOutput.noTokens) {
      let rawTokens = tokensOutput.tokens;

      let token = false;

      if (rawTokens.length) {
        rawTokens.forEach(tokenData => {
          if (tokenData.token) {

            let decodedToken = new this.tokenParser(this.base64ToUint8array(tokenData.token).buffer);
            if (decodedToken && decodedToken[this.unsignedTokenDataName]) {
              let decodedTokenData = decodedToken[this.unsignedTokenDataName];

              if (this.compareObjects(decodedTokenData, unsignedToken)) {
                token = tokenData;
              }

            }
          } else {
            console.log('empty token data received');
          }

        })
      }

      return token;
    }
  }

  listenForIframeMessages(event) {

    // console.log('listenForIframeMessages fired');

    let tokenOriginURL = new URL(this.tokenOrigin);

    // listen only tokenOriginURL
    if (event.origin !== tokenOriginURL.origin) {
      return;
    }

    // console.log('parent: event = ', event.data);

    // iframeCommand required for interaction
    if (
      typeof event.data.iframeCommand === "undefined"
      || typeof event.data.iframeData === "undefined"
    ) {
      return;
    }

    // iframeCommand contain command code

    let command = event.data.iframeCommand;

    // iframeData contains command content (tokens data, useToken , hide/display iframe)
    let data = event.data.iframeData;

    console.log('parent: command, data = ', command, data);

    switch (command) {
      case "iframeWrap":
        if (data == "show") {
          this.tokenIframeWrap.style.display = 'block';
        } else if (data == "hide") {
          this.tokenIframeWrap.style.display = 'none';
        }
        break;
      case "tokensData":
        // tokens received, disable listener
        this.detachPostMessageListener(this.listenForIframeMessages);
        // TODO remove iframeWraper
        this.tokenIframeWrap.remove();

        if (data.success && !data.noTokens) {
          data.tokens = this.filterTokens(data.tokens);
        }
        this.negotiateCallback(data);
        break;

      case "useTokenData":

        this.tokenIframeWrap.remove();

        // if (data.success) {
        //     console.log('useTokenData: ' + data.useToken)
        // } else {
        //     console.log('useTokenData error message: ' + data.message)
        // }
        console.log('this.signCallback(data)');
        this.signCallback && this.signCallback(data);
        this.signCallback = false;
        break;

      case "iframeReady":
        if (event && event.source) {
          event.source.postMessage(this.queuedCommand, event.origin);
          this.queuedCommand = '';
        }

        break;

      default:

    }


  }

  signToken(unsignedToken, signCallback) {
    console.log('signToken request for:');
    console.log(unsignedToken);
    this.signCallback = signCallback;
    // open iframe and request tokens
    this.queuedCommand = { parentCommand: 'signToken', parentData: unsignedToken };
    this.createIframe();
  }

  createIframe() {
    console.log('createIframe fired');
    // open iframe and request tokens
    this.attachPostMessageListener(this.listenForIframeMessages.bind(this));

    const iframe = document.createElement('iframe');
    this.iframe = iframe;
    iframe.src = this.tokenOrigin;
    iframe.style.width = '800px';
    iframe.style.height = '700px';
    iframe.style.maxWidth = '100%';
    iframe.style.background = '#fff';
    let iframeWrap = document.createElement('div');
    this.tokenIframeWrap = iframeWrap;
    iframeWrap.setAttribute('style', 'width:100%; min-height: 100vh; position: fixed; align-items: center; justify-content: center; display: none; top: 0; left: 0; background: #fffa');
    iframeWrap.appendChild(iframe);
    document.body.appendChild(iframeWrap);
  }

  base64ToUint8array(base64str) {
    // decode base64url to base64. it will do nothing for base64
    base64str = base64str.split('-').join('+')
      .split('_').join('/')
      .split('.').join('=');
    let res;

    if (typeof Buffer !== 'undefined') {
      res = Uint8Array.from(Buffer.from(base64str, 'base64'));
    } else {
      res = Uint8Array.from(atob(base64str), c => c.charCodeAt(0));
    }
    return res;
  }

  decodeTokens(rawTokens) {
    if (this.debug) {
      console.log('decodeTokens fired');
      console.log(rawTokens);
    }
    let decodedTokens = [];
    if (rawTokens.length) {
      rawTokens.forEach(tokenData => {
        if (tokenData.token) {
          let decodedToken = new this.tokenParser(this.base64ToUint8array(tokenData.token).buffer);
          if (decodedToken && decodedToken[this.unsignedTokenDataName]) decodedTokens.push(decodedToken[this.unsignedTokenDataName]);
        } else {
          console.log('empty token data received');
        }

      })
    }
    return decodedTokens;
  }

  attachPostMessageListener(listener) {
    if (window.addEventListener) {
      window.addEventListener("message", listener, false);
    } else {
      // IE8
      window.attachEvent("onmessage", listener);
    }
  }
  detachPostMessageListener(listener) {
    if (window.addEventListener) {
      window.removeEventListener("message", listener, false);
    } else {
      // IE8
      window.detachEvent("onmessage", listener);
    }
  }
}