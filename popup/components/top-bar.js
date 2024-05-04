import { html } from "../js/om.event.js";
import { getAllUserScripts, getMatchUserScripts } from "../../scripts/db/userscript-db.js";
import { registerUserScript } from "../../scripts/js/register-userscript.js";
// @ts-ignore
import topbarCss from "../style/top-bar.css" assert { type: "css" };

export class TopBar extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this.shadowRoot.adoptedStyleSheets = [topbarCss];
	}

	addScript() {
		this.openScriptManager();
	}

	async toggleScript({ target }) {
		const isEnable = target.checked;
		this.nextElementSibling["inert"] = !isEnable;
		const userScripts = await getAllUserScripts();
		if (isEnable) userScripts.forEach((userScript) => registerUserScript(userScript));
		else {
			const userScriptIds = userScripts.map((script) => script.id);
			await chrome.userScripts.unregister({ ids: userScriptIds });
		}
		const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
		chrome.tabs.reload(tab.id);
		chrome.storage.sync.set({ userScriptEnable: isEnable });
	}

	async openScriptManager() {
		const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
		chrome.storage.session.set({ lastTabUrl: tab.url });
		const url = "/scripts/index.html#add-script";
		chrome.tabs.create({ url, index: tab.index + 1 });
	}

	render() {
		return html`<span
				style="font-weight: 500"
				title="Click to open script Manager"
				@click=${this.openScriptManager}>
				ScriptRunner
			</span>
			<button @click=${this.addScript.bind(this)}><sr-icon ico="plus" title="script name"></sr-icon> Add</button>
			<label class="switch" style="margin-left: auto">
				<input type="checkbox" @change=${this.toggleScript.bind(this)} />
				<span class="slider"></span>
			</label>`;
	}

	connectedCallback() {
		this.shadowRoot.replaceChildren(this.render());
		chrome.storage.sync.get("userScriptEnable").then(({ userScriptEnable }) => {
			$("input", this.shadowRoot).checked = userScriptEnable;
		});
	}
}

customElements.define("top-bar", TopBar);
