export const Store = {
	UserScripts: "UserScripts",
	Domains: "Domains",
	Folders: "Folders",
};

function onupgradeneeded({ target }) {
	const scriptStore = target.result.createObjectStore(Store.UserScripts, { keyPath: "id" });

	target.result.createObjectStore(Store.Domains, { keyPath: "name" });
	target.result.createObjectStore(Store.Folders);
}

/**@returns {Promise<IDBDatabase>} */
export function connect() {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open("userScripts", 1);
		request.onupgradeneeded = onupgradeneeded;
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
		request.onblocked = () => console.warn("Pending until unblocked");
	});
}
