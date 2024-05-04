import { Domain, getAllDomains, saveDomainsInDb } from "../db/domain-db.js";
import { html, map, react } from "../js/om.compact.js";
// @ts-ignore
import domainCss from "../style/domain-explorer.css" assert { type: "css" };

export class DomainItem extends HTMLElement {
	/**@param {Domain} domain*/
	constructor(domain) {
		super();
		this.domain = domain;
	}

	filterScriptBydomain() {
		fireEvent(document.body, "domainfilter", this.domain.name);
	}

	render() {
		return html`<details>
			<summary @click=${this.filterScriptBydomain.bind(this)}>
				<img src="${this.domain.favIconUrl ?? "/assets/web.svg"}" /> <span>${this.domain.name}</span>
			</summary>
			<ul>
				${this.domain.paths.map((route) => `<li>${route}</li>`).join("")}
			</ul>
		</details> `;
	}

	connectedCallback() {
		this.replaceChildren(this.render());
	}
}
customElements.define("domain-item", DomainItem);

const saveDomains = await getAllDomains();
const domainList = react(saveDomains);

export class DomainExplorer extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this.shadowRoot.adoptedStyleSheets = [domainCss];
	}

	render() {
		return html`<div>${map(domainList, (domain) => new DomainItem(domain))}</div>`;
	}

	connectedCallback() {
		this.shadowRoot.replaceChildren(this.render());
	}
}
customElements.define("domain-explorer", DomainExplorer);

export async function addDomains(pages, scriptId) {
	const domains = {};
	pages.map((page) => {
		page = page.split("://").at(-1);
		const slashIdx = page.indexOf("/");
		const domain = page.slice(0, slashIdx);
		const path = page.slice(slashIdx + 1);
		domains[domain] ??= { name: domain, paths: [], scriptIds: [scriptId] };
		domains[domain].paths.push(path);
	});
	await saveDomainsInDb(Object.values(domains));
	for (const name in domains) {
		const domain = domainList.find((domain) => domain.name === name);
		if (!domain) domainList.push(domains[name]);
	}
}
