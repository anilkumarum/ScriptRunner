import { setCaretAt } from "../utils/helper.js";

export class CodeLine extends HTMLElement {
	constructor(text, active = true) {
		super();
		text && this.appendChild(new Text(text));
		this._internals = this.attachInternals();
		this.active = active;
	}

	/**@param {boolean} flag*/
	set active(flag) {
		// @ts-ignore
		flag ? this._internals.states.add("--active") : this._internals.states.delete("--active");
	}

	connectedCallback() {
		this.active && setCaretAt(this, 0);
	}
}

customElements.define("code-line", CodeLine);
