import { UserScript } from "../db/Userscript.js";
import { getAllUserScripts } from "../db/userscript-db.js";

function getCode(code, scriptId, name = "") {
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
				saveConsoleOutput({ type: target.name, stack: argumentsList[0].toString() })
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
				excludeMatches: userScript.excludeMatches,
				js: [{ code: getCode(userScript.code, userScript.id, userScript.name) }],
			},
		]);
		await requestPermission(userScript.matches);
	} catch (error) {
		console.error(error);
	}
}

export async function updateUserScript(scriptId, key, value) {
	try {
		const [userScript] = await chrome.userScripts.getScripts({ ids: [scriptId] });
		key === "code" ? (userScript.js[0].code = getCode(value, scriptId)) : (userScript[key] = value);
		chrome.userScripts.update([userScript]);
		key === "matches" && (await requestPermission(userScript.matches));
	} catch (error) {
		console.error(error);
	}
}

export async function checkUserScriptRegister(scriptId) {
	try {
		return (await chrome.userScripts.getScripts({ ids: [scriptId] })).length > 0;
	} catch (error) {
		console.error(error);
	}
}

export async function unRegisterUserScript(scriptId) {
	try {
		await chrome.userScripts.unregister({ ids: [scriptId] });
	} catch (error) {
		console.error(error);
	}
}

export async function requestPermission(webpages) {
	const permissions = { origins: webpages };
	const hasPermission = await chrome.permissions.contains(permissions);
	if (hasPermission) return;
	const { HostPermission } = await import("../components/helper/host-permission.js");
	document.body.appendChild(new HostPermission(webpages));
}

export async function registerUserScriptOnUpdate() {
	const userScripts = await getAllUserScripts();
	userScripts.forEach(registerUserScript);
}

export function showDeveloperModeDialog() {
	const dialog = document.createElement("dialog");
	const h2 = document.createElement("h2");
	h2.textContent = "Enable developer mode";
	const p = document.createElement("p");
	p.textContent = "First enable developer mode at chrome://extensions";
	const img = new Image();
	img.src = "/icon_128.png";
	dialog.append(h2, p, img);
	document.body.appendChild(dialog);
	dialog.showModal();
}

/* 
greyBackground
https://github.com/tkent-google/*
https://stackoverflow.com/questions/*

grey color background 

document.body.style.backgroundColor = "grey" 
*/
