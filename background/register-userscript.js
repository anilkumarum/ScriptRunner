import { UserScript } from "../scripts/db/Userscript.js";
import { Store, connect } from "../scripts/db/db.js";

function getCode(code, scriptId, name) {
	return `const scriptUrlRx =  new RegExp("chrome-extension://${chrome.runtime.id}/[^:]+","g")
	async function saveConsoleOutput(output) {
	 	await chrome.runtime.sendMessage({ msg: "console-output", scriptId: "${scriptId}", output });
	}
	async function userScriptError(error) {
		const stack = error.stack.replaceAll(scriptUrlRx, "${name}");
		saveConsoleOutput({ type: "error", stack: stack })
	}
	 const consoleFuncs = ["log", "warn", "error"];
	consoleFuncs.forEach((funcName) => {
		const defineHandler = {
			apply: function (target, thisArg, argumentsList) {
				saveConsoleOutput({ type: target.name, stack: argumentsList[0] })
				return target.call(thisArg, ...argumentsList);
			},
		};
		const defineProxy = new Proxy(console[funcName], defineHandler);
		console[funcName] = defineProxy;
	}); 
	addEventListener("pageswap", () => chrome.runtime.sendMessage("clear-console"));
	try { ${code}} catch (err) {userScriptError(err)}`;
}

/**@param {UserScript} userScript*/
export async function registerUserScript(userScript) {
	try {
		await chrome.userScripts.register([
			{
				id: userScript.id,
				matches: userScript.matches,
				js: [{ code: getCode(userScript.code, userScript.id, userScript.name) }],
			},
		]);
	} catch (error) {
		console.error(error);
	}
}

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

export async function registerUserScriptOnUpdate() {
	const userScripts = await getAllUserScripts();
	userScripts.forEach(registerUserScript);
}
