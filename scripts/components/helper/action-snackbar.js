export class ActionSnackbar extends HTMLElement {
	constructor() {
		super();
	}

	/**@public @param {number} actionId*/
	show(actionId) {
		return new Promise((resolve, reject) => {
			$on(this.undoBtn, "click", () => {
				clearTimeout(actionId);
				reject();
				this.remove();
			});

			const timeoutID = setTimeout(resolve, 5000);
			$on(this.undoBtn.nextElementSibling, "click", () => {
				clearTimeout(timeoutID);
				resolve();
				this.remove();
			});
		});
	}

	render() {
		return `<div class="info-msg">Script deleted</div>
		<button class="undo-btn">Undo</button>
		<sr-icon ico="close"></sr-icon>`;
	}

	connectedCallback() {
		this.innerHTML = this.render();
		this.hidden = true;
		this.undoBtn = this.children[1];
	}
}

customElements.define("action-snackbar", ActionSnackbar);
