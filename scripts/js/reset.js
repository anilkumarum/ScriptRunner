globalThis.$ = (selector, scope) => (scope || document).querySelector(selector);
globalThis.$on = (target, type, /** @type {Function} */ callback) => target.addEventListener(type, callback);

//dispatch new event
globalThis.fireEvent = (target, eventName, detail) =>
	target.dispatchEvent(detail ? new CustomEvent(eventName, { detail }) : new CustomEvent(eventName));

/**@type {chrome.storage.LocalStorageArea['get']} */
globalThis.getStore = chrome.storage.local.get.bind(chrome.storage.local);
/**@type {chrome.storage.LocalStorageArea['set']} */
globalThis.setStore = chrome.storage.local.set.bind(chrome.storage.local);

const snackbar = document.getElementById("snackbar");
globalThis.toast = (msg) => {
	snackbar.hidden = false;
	snackbar.innerText = msg;
	setTimeout(() => (snackbar.hidden = true), 4100);
};
