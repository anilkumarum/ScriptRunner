const mode = { mode: "readwrite" };
const readOnly = { mode: "read" };
export const checkReadAccess = async (fileHandle) => (await fileHandle.queryPermission(readOnly)) === "granted";
export const checkAccess = async (fileHandle) => (await fileHandle.queryPermission(mode)) === "granted";
export const reqReadAccess = async (fileHandle) => (await fileHandle.requestPermission(readOnly)) === "granted";

/**@param {FileSystemDirectoryHandle} dirHandle*/
export async function getAllFilHandlesInDir(dirHandle) {
	/**@type {Object<string,FileSystemFileHandle>} */
	const fileHandles = {};
	const promises = [];
	/**@param {FileSystemDirectoryHandle} dirHandle, * @param {string} dirPath*/
	async function addNotesFromDir(dirHandle, dirPath) {
		// @ts-ignore
		for await (const entity of dirHandle.values()) {
			if (entity.kind === "directory") promises.push(addNotesFromDir(entity, entity.name + "/"));
			else if (entity.name.endsWith(".js")) fileHandles[dirPath + entity.name] = entity;
		}
	}
	promises.push(addNotesFromDir(dirHandle, ""));
	await Promise.all(promises);
	await new Promise((r) => setTimeout(r, 1000));
	return fileHandles;
}

/**@param {FileSystemFileHandle} fileHandle, @returns {Promise<ReadableStream<Uint8Array>>}*/
export async function getFileReadStream(fileHandle) {
	try {
		if ((await fileHandle["requestPermission"]({ mode: "read" })) !== "granted") return;
		const file = await fileHandle.getFile();
		if (file.type !== "text/javascript") return;
		return file.stream();
	} catch (error) {}
}
