import { html } from "../../../popup/js/om.event.js";
// @ts-ignore
import hostCss from "../../style/host-permission.css" assert { type: "css" };
document.adoptedStyleSheets.push(hostCss);

export class HostPermission extends HTMLDialogElement {
	constructor(webpages) {
		super();
		this.webpages = webpages;
	}

	async requestPermission(allPages) {
		const permissions = { origins: allPages ? ["<all_urls>"] : this.webpages };
		const granted = await chrome.permissions.request(permissions);
		if (!granted) return toast("permission denied");
		this.remove();
		const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
		tab.url.startsWith("http") && chrome.tabs.reload(tab.id);
	}

	render() {
		return html`<h2>Webpage Permission Required</h2>
			<p>Permission required to inject userScript</p>
			<ol>
				${this.webpages.map((page) => `<li >${page}</li>`).join("")}
			</ol>
			<button @click=${this.requestPermission.bind(this, false)}>Grant Permission for Above webpages</button>
			<button style="--btn-clr:orange" @click=${this.requestPermission.bind(this, true)}>
				Grant Permission for All webpages
			</button>`;
	}

	connectedCallback() {
		this.id = "host-permission";
		this.replaceChildren(this.render());
		this.showModal();
	}
}

customElements.define("host-permission", HostPermission, { extends: "dialog" });
