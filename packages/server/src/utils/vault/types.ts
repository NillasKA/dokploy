import type { VaultProviderConfig } from "@dokploy/server/db/schema";

export interface VaultClient<
	C extends VaultProviderConfig = VaultProviderConfig,
> {
	getSecrets(config: C, refs: string[]): Promise<Record<string, string>>;
	testConnection(config: C): Promise<void>;
	listSecretNames?(config: C): Promise<string[]>;
}

export const VAULT_REQUEST_TIMEOUT_MS = 15_000;

export const withVaultRequestTimeout = async <T>(
	request: Promise<T>,
	providerName: string,
) => {
	let timeout: ReturnType<typeof setTimeout> | undefined;
	try {
		return await Promise.race([
			request,
			new Promise<never>((_, reject) => {
				timeout = setTimeout(
					() =>
						reject(
							new Error(
								`${providerName}: request timed out after ${VAULT_REQUEST_TIMEOUT_MS / 1000} seconds`,
							),
						),
					VAULT_REQUEST_TIMEOUT_MS,
				);
			}),
		]);
	} finally {
		if (timeout) clearTimeout(timeout);
	}
};

export const vaultFetch = async (url: string, init: RequestInit = {}) => {
	return await fetch(url, {
		...init,
		signal: AbortSignal.timeout(VAULT_REQUEST_TIMEOUT_MS),
	});
};
