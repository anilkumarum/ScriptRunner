export class ReportBug extends HTMLDialogElement {
	constructor(error) {
		super();
		this.error = error;
		this.gmailUrl = "https://mail.google.com/mail/u/0/";
		this.mailTo = "coderrailhelp@gmail.com";
		this.extName = "scriptRunner";
	}

	async reportBug() {
		const stack = this.error.stack?.replaceAll("\n", "");
		const url = `${this.gmailUrl}?to=${this.mailTo}&su=${this.error.message}&body=Error:%20${this.error.message}%0AStack:%20${stack}%0AExtensionId:%20${chrome.runtime.id}%0AExtension%20Name:%20${this.extName}%0ABrowser%20Info:%20${navigator.userAgent}&fs=1&tf=cm`;
		await chrome.tabs.create({ url });
	}

	render() {
		return `<h2>😪 Sorry, Something went wrong 🐛</h2>
			<p style="max-width: 50ch;overflow-wrap: break-word;">❌ ${this.error.message
				.replaceAll("<", "&lt;")
				.replaceAll(">", "&gt;")}</p>
			<button style="font-size: 1rem;margin-inline: auto;display: block;">🐞 Report Bug</button>
			<div style="text-align:center;font-size:x-small;">Just one click</div>`;
	}

	connectedCallback() {
		this.id = "report-bug";
		this.innerHTML = this.render();
		this.showModal();
		this.lastElementChild.addEventListener("click", this.reportBug.bind(this));
	}
}

customElements.define("report-bug", ReportBug, { extends: "dialog" });
