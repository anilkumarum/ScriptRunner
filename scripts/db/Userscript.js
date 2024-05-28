export class UserScript {
	/**@param {string} [name] */
	constructor(name) {
		this.id = crypto.randomUUID();
		this.name = name ?? "";
		this.icon = null;
		this.matches = [];
		this.excludeMatches = [];
		this.description = "";
		/**@type {chrome.userScripts.ExecutionWorld} */
		this.world = "USER_SCRIPT";
		/**@type {chrome.userScripts.RunAt} */
		this.runAt = "document_idle";
		this.code = undefined;
		/**@type {FileSystemFileHandle}*/
		this.fileHandle = undefined;
		this.version = "0.1";
		this.author = "self";
		this.updateURL = undefined;
		this.fileModifiedAt = undefined;
		this.lastModifiedAt = Date.now();
		this.createdAt = Date.now();
	}
}
