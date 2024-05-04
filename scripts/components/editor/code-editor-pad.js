import { parseUserScriptMeta } from "../../js/parseUserScript.js";

export class CodeEditorPad extends HTMLElement {
	constructor(userScript) {
		super();
		this.userScript = userScript;
	}

	/**@param {string} codeText*/
	set code(codeText) {
		const { code, userScriptProps } = parseUserScriptMeta(codeText);
		this.replaceChildren(code);
		this.userScript.code = code;
		userScriptProps && this.setuserScriptProps(userScriptProps);
	}

	setuserScriptProps(userScriptProps) {
		for (const key in userScriptProps) {
			if (!userScriptProps[key]) continue;
			if (key === "matches" || key === "excludeMatches") this.userScript[key].push(...userScriptProps[key]);
			else this.userScript[key] = userScriptProps[key];
		}
	}

	dropPasteHandler(event) {
		const codeText = event.dataTransfer.getData("text/plain");
		if (!codeText) return;
		const { code, userScriptProps } = parseUserScriptMeta(codeText);
		this.userScript.code = code;
		this.append(code);
		userScriptProps && this.setuserScriptProps(userScriptProps);
		event.preventDefault();
	}

	inputHandler = {
		insertFromPaste: this.dropPasteHandler.bind(this),
		insertFromDrop: this.dropPasteHandler.bind(this),
	};

	updateCode({ target }) {
		this.userScript.code = target.innerText.trim();
	}

	connectedCallback() {
		this.setAttribute("contenteditable", "true");
		this.setAttribute("spellcheck", "false");
		this.userScript.code && this.append(this.userScript.code);
		$on(this, "beforeinput", (event) => this.inputHandler[event.inputType]?.(event));
		$on(this, "blur", (event) => this.inputHandler[event.inputType]?.(event));
	}
}

customElements.define("code-editor-pad", CodeEditorPad);
