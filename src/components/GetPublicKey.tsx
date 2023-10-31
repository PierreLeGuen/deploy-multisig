import { LedgerClient } from "@/lib/LedgerClient";
import { useState } from "react";

export const GetPublicKey = () => {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [derivationPath, setDerivationPath] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const baseDerivationPath = "44'/397'/0'/0'/";
  const endDerivationPath = "'";

  const formatDerivationPath = (path: number) => {
    return baseDerivationPath + path + endDerivationPath;
  };

  const fn = async () => {
    setIsLoading(true);
    setError(null);
    const ledger = new LedgerClient();
    try {
      await ledger.connect();
      const pk = await ledger.getPublicKey({
        derivationPath: formatDerivationPath(derivationPath),
      });
      setPublicKey(pk);
    } catch (err) {
      setError("Failed to retrieve public key: " + (err as Error).message);
    } finally {
      await ledger.disconnect();
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-lg font-bold">Find your Ledger public key</h1>
      <div className="flex flex-row mb-4 items-center">
        <label className="mr-2">Specify HD Path:</label>
        <input
          type="text"
          placeholder="44'/397'/0'/0'/"
          value={baseDerivationPath + derivationPath + endDerivationPath}
          readOnly
          className="border p-2 flex-grow"
        />
        <input
          type="number"
          placeholder="1"
          value={derivationPath}
          onChange={(e) => setDerivationPath(parseInt(e.target.value))}
          className="border p-2 ml-2"
        />
      </div>
      <div className="mb-4">
        Enter your preferred HD path, then get the public key associated with
        this derivation path.
      </div>
      <button
        onClick={fn}
        className="bg-blue-500 text-white p-2 rounded"
        disabled={isLoading}
      >
        {isLoading ? "Loading..." : "Get Ledger public key"}
      </button>
      {error && <div className="text-red-500 mt-2">{error}</div>}
      {publicKey && <div className="mt-2">Public Key: {publicKey}</div>}
    </div>
  );
};
