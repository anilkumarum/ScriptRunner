export class BracketNotation extends HTMLElement {
	constructor(bracket) {
		super();
		this.appendChild(new Text(bracket));
	}

	connectedCallback() {}
}

customElements.define("bracket-notation", BracketNotation);
