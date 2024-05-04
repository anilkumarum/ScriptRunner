import icons from "/assets/icons.json" assert { type: "json" };

class ScriptRunnerIcon extends HTMLElement {
	constructor() {
		super();
	}

	get checked() {
		return this._internals.states.has("--checked");
	}

	set checked(flag) {
		if (flag) {
			this._internals.states.add("--checked");
		} else {
			this._internals.states.delete("--checked");
		}
	}

	render(path) {
		return `<svg  viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg">${icons[path]}</svg>`;
	}

	connectedCallback() {
		this.innerHTML = this.render(this.getAttribute("ico"));
		if (this.hasAttribute("checked")) {
			this._internals = this.attachInternals();
			this.addEventListener("click", this.#onClick.bind(this));
			this.#onClick();
		}
	}

	#onClick() {
		this.checked = !this.checked;
		this.dispatchEvent(new Event("change"));
	}
}

customElements?.define("sr-icon", ScriptRunnerIcon);
