export class UserScriptMetaData {
	constructor() {
		this.name = null;
		this.description = null;
		this.version = null;
		this.author = null;
		this.icon = null;
		this.runAt = null;
		this.matches = [];
		this.excludeMatches = [];
	}
}

const fixValues = {
	"document-idle": "document_idle",
	"document-start": "document_start",
	"document-end": "document_end",
};

/**@param {string} codeText*/
export function parseUserScriptMeta(codeText) {
	const userScriptRx = new RegExp(/==UserScript==(.*)==\/UserScript==/, "gs");
	const scriptInfo = userScriptRx.exec(codeText);
	if (!scriptInfo) return { code: codeText.trim() };

	const userScriptProps = getUserScriptProps(scriptInfo[1]);
	const codeStartIdx = scriptInfo.index + scriptInfo[0].length;
	const code = codeText.slice(codeStartIdx).trim();
	return { code, userScriptProps };
}

export function getUserScriptProps(propsText) {
	const propRx = new RegExp(/@([^\s]+) (.*)$/, "gm");
	const propsIterator = propsText.matchAll(propRx);
	const userScriptProps = new UserScriptMetaData();

	for (const match of propsIterator) {
		const key = match[1];
		const value = match[2].trim();
		if (key === "match") userScriptProps.matches.push(value);
		else if (key === "exclude") userScriptProps.excludeMatches.push(value);
		else if (key === "run-at") userScriptProps.runAt = fixValues[value] ?? value;
		else if (userScriptProps[key] !== undefined) userScriptProps[key] = value;
	}
	return userScriptProps;
}
