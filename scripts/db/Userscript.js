export class UserScript {
	/**
	 * @param {string} [name]
	 */
	constructor(name) {
		this.id = crypto.randomUUID();
		this.name = name ?? "";
		this.icon = null;
		this.matches = [];
		this.excludeMatches = [];
		this.description = "";
		this.world = "USER_SCRIPT";
		this.runAt = "document_idle";
		this.code = undefined;
		this.fileHandle = undefined;
		this.version = "0.1";
		this.author = "self";
		this.fileModifiedAt = undefined;
		this.lastModifiedAt = Date.now();
		this.createdAt = Date.now();
	}
}
