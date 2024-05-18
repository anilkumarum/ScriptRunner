export class HighlightSpan extends HTMLSpanElement {
	constructor(text, className) {
		super();
		this.appendChild(new Text(text));
		this.className = className;
	}

	connectedCallback() {}
}

customElements.define("highlight-span", HighlightSpan, { extends: "span" });
