import { connect, Store } from "./db.js";

export class Domain {
	constructor(name, paths, scriptIds) {
		this.name = name;
		this.favIconUrl = "";
		this.paths = paths ?? [];
		this.scriptIds = scriptIds ?? [];
	}
}

/**@returns {Promise<Domain[]>} */
export async function getAllDomains() {
	return new Promise((resolve, reject) => {
		connect().then((db) => {
			const store = db.transaction(Store.Domains, "readonly").objectStore(Store.Domains);
			const fetchQuery = store.getAll();
			fetchQuery.onsuccess = ({ target }) => resolve(target["result"]);
			fetchQuery.onerror = (e) => reject(e);
			db.close();
		});
	});
}

export function saveDomainsInDb(domains) {
	return new Promise((resolve, reject) => {
		connect().then((db) => {
			const transaction = db.transaction(Store.Domains, "readwrite");
			const store = transaction.objectStore(Store.Domains);
			domains.forEach((domain) => {
				const fetchQuery = store.get(domain.name);
				fetchQuery.onsuccess = ({ target }) => {
					if (!target["result"]) store.add(domain);
					else {
						const domainObj = target["result"];
						domainObj.scriptIds.indexOf(domain.scriptIds[0]) === -1 && domainObj.scriptIds.push(domain);
						domainObj.paths = [...new Set([...domainObj.paths, ...domain.paths])];
						store.put(domainObj);
					}
				};
			});
			transaction.oncomplete = (e) => resolve(e);
			transaction.onerror = (e) => reject(e);
			db.close();
		});
	});
}
