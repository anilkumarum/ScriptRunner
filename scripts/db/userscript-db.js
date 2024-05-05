import { updateUserScript, updateUserScript2 } from "../js/register-userscript.js";
import { UserScript } from "./Userscript.js";
import { Store, connect } from "./db.js";

/**@returns {Promise<UserScript[]>} */
export async function getAllUserScripts() {
	return new Promise((resolve, reject) => {
		connect().then((db) => {
			const store = db.transaction(Store.UserScripts, "readonly").objectStore(Store.UserScripts);
			const fetchQuery = store.getAll();
			fetchQuery.onsuccess = ({ target }) => resolve(target["result"]);
			fetchQuery.onerror = (e) => reject(e);
			db.close();
		});
	});
}

/**@returns {Promise<UserScript[]>} */
export async function getMatchUserScripts(url) {
	return new Promise((resolve, reject) => {
		connect().then((db) => {
			const userScripts = [];
			const store = db.transaction(Store.UserScripts, "readonly").objectStore(Store.UserScripts);
			const fetchCursor = store.openCursor();
			fetchCursor.onsuccess = (event) => {
				const cursor = event.target["result"];
				if (cursor) {
					const userScript = cursor.value;
					for (const page of userScript.matches) {
						const pageRx = new RegExp(page.replaceAll("*", ".*"));
						if (pageRx.test(url)) {
							userScripts.push(userScript);
							break;
						}
					}
					cursor.continue();
				} else resolve(userScripts);
			};
			fetchCursor.onerror = (e) => reject(e);
			db.close();
		});
	});
}

/**@param {UserScript} userScript*/
export async function saveUserScriptInDb(userScript) {
	return new Promise((resolve, reject) => {
		connect().then((db) => {
			const store = db.transaction(Store.UserScripts, "readwrite").objectStore(Store.UserScripts);
			const insertTask = store.add(userScript);
			insertTask.onsuccess = (e) => resolve(userScript);
			insertTask.onerror = (e) => reject(e);
			db.close();
		});
	});
}

const infoKeys = new Set(["name", "description", "version", "author", "icon", "fileModifiedAt", "updateURL"]);
export async function updateUserScriptInDb(id, key, value) {
	return new Promise((resolve, reject) => {
		connect().then((db) => {
			const store = db.transaction(Store.UserScripts, "readwrite").objectStore(Store.UserScripts);
			const fetchQuery = store.get(id);
			fetchQuery.onsuccess = ({ target }) => {
				const userScript = target["result"];
				userScript[key] = value;
				userScript.lastModifiedAt = Date.now();
				const insertTask = store.put(userScript);
				insertTask.onsuccess = (evt) => infoKeys.has(key) || updateUserScript(id, key, value).then(resolve);
				insertTask.onerror = (e) => reject(e);
			};
			fetchQuery.onerror = (e) => reject(e);
			db.close();
		});
	});
}

export async function updateUserScriptInDb2(id, userScriptProps) {
	return new Promise((resolve, reject) => {
		connect().then((db) => {
			const store = db.transaction(Store.UserScripts, "readwrite").objectStore(Store.UserScripts);
			const fetchQuery = store.get(id);
			fetchQuery.onsuccess = ({ target }) => {
				const userScript = target["result"];
				for (const key in userScriptProps) {
					if (!userScriptProps[key]) continue;
					if (key === "matches" || key === "excludeMatches") {
						userScript[key] = [...new Set([...userScript[key], ...userScriptProps[key]])];
					} else if (userScript[key] !== userScriptProps[key]) userScript[key] = userScriptProps[key];
				}
				userScript.lastModifiedAt = Date.now();
				const insertTask = store.put(userScript);
				insertTask.onsuccess = (evt) => updateUserScript2(userScript).then(resolve);
				insertTask.onerror = (e) => reject(e);
			};
			fetchQuery.onerror = (e) => reject(e);
			db.close();
		});
	});
}

export async function deleteUserScriptInDb(id) {
	return new Promise((resolve, reject) => {
		connect().then((db) => {
			const store = db.transaction(Store.UserScripts, "readwrite").objectStore(Store.UserScripts);
			const deleteQuery = store.delete(id);
			deleteQuery.onsuccess = ({ target }) => resolve(target["result"]);
			deleteQuery.onerror = (e) => reject(e);
			db.close();
		});
	});
}
