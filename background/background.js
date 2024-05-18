import { registerUserScriptOnUpdate } from "./register-userscript.js";

chrome.runtime.onUserScriptMessage.addListener(async (request, sender, sendResponse) => {
	const tabId = sender.tab.id.toString();
	if (request.msg === "console-output") {
		const tabConsoles = (await chrome.storage.session.get(tabId))[tabId] ?? {};
		tabConsoles[request.scriptId] ??= [];
		tabConsoles[request.scriptId].push(request.output);
		chrome.storage.session.set({ [tabId]: tabConsoles });
	} else if (request === "clear-console") chrome.storage.session.remove(tabId);
});

export const contextHandler = {
	scriptManager: (_, tab) => {
		chrome.storage.session.set({ lastTabUrl: tab.url });
		chrome.tabs.create({ url: "/scripts/index.html", index: tab.index + 1 });
	},
};
chrome.contextMenus.onClicked.addListener((info, tab) => contextHandler[info.menuItemId](info, tab));

export const setInstallation = ({ reason }) => {
	async function oneTimeInstall() {
		chrome.storage.sync.set({ userScriptEnable: true });
		chrome.tabs.create({ url: "/guide/welcome-guide.html" });
		//> uninstall survey setup
		const LAMBA_KD = crypto.randomUUID();
		chrome.storage.local.set({ extUserId: LAMBA_KD });
		const SURVEY_URL = `https://uninstall-form.pages.dev/?e=${chrome.runtime.id}&u=${LAMBA_KD}`;
		chrome.runtime.setUninstallURL(SURVEY_URL);
	}
	reason === "install" && oneTimeInstall();

	chrome.contextMenus.create({
		id: "scriptManager",
		title: "📜 " + chrome.i18n.getMessage("script_manager"),
		contexts: ["action"],
	});
	try {
		chrome.userScripts;
		chrome.userScripts?.configureWorld({ messaging: true });
	} catch {
		chrome.tabs.create({ url: "/guide/enable-developer-mode.html" });
	}
	registerUserScriptOnUpdate();
};

// installation setup
chrome.runtime.onInstalled.addListener(setInstallation);
