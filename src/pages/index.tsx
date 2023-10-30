import { useWalletSelector } from "@/contexts/WalletSelectorContext";
import { Switch } from "@headlessui/react";
import { NetworkId } from "@near-wallet-selector/core";
import { parseNearAmount } from "near-api-js/lib/utils/format";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

type MultisigForm = {
  accountId: string;
  threshold: number;
  signers: string[];
};

export default function Home() {
  const { selector, modal, accounts, accountId, setNetwork } =
    useWalletSelector();
  const {
    control,
    handleSubmit,
    register,
    setError,
    formState: { errors },
    watch,
  } = useForm<MultisigForm>();

  // State for current network
  const [currentNetwork, setCurrentNetwork] = useState("mainnet");
  const [rawSigners, setRawSigners] = useState("");

  const handleSignIn = () => {
    setNetwork(currentNetwork as NetworkId);
    modal.show();
  };

  const handleSignOut = async () => {
    if (!accountId) return;
    const w = await selector.wallet();
    await w.signOut();
  };

  const onSwitchNetwork = async (network: string) => {
    await handleSignOut();
    setCurrentNetwork(network);
  };

  const onSubmit = (data: MultisigForm) => {
    if (data.signers.length < data.threshold) {
      setError("signers", {
        type: "manual",
        message:
          "Number of signers must be equal or greater than the threshold.",
      });
      return;
    }
    createMultisigWithFactory(data);
  };

  const createMultisigWithFactory = async (data: MultisigForm) => {
    const factory =
      currentNetwork === "testnet"
        ? "multisignature.testnet"
        : "multisignature.near";
    const wallet = await selector.wallet();
    const threshold = new Number(data.threshold);
    await wallet.signAndSendTransactions({
      transactions: [
        {
          receiverId: factory,
          actions: [
            {
              type: "FunctionCall",
              params: {
                methodName: "create",
                args: {
                  name: data.accountId,
                  members: data.signers,
                  num_confirmations: threshold,
                },
                gas: "300000000000000",
                deposit: parseNearAmount("5")!,
              },
            },
          ],
        },
      ],
    });
  };

  return (
    <main className="flex min-h-screen flex-col p-10 bg-gray-50">
      <div className="flex justify-end items-center space-x-4">
        {!accountId ? (
          <div
            onClick={handleSignIn}
            className="bg-blue-500 text-white py-1 px-3 rounded"
          >
            Sign In
          </div>
        ) : (
          <div
            onClick={handleSignOut}
            className="bg-red-500 text-white py-1 px-3 rounded"
          >
            Sign Out
          </div>
        )}

        <div className="mt-2">
          <Switch.Group>
            <Switch.Label className="mr-4">
              Current Network: {currentNetwork}
            </Switch.Label>
            {/* <Switch
              checked={currentNetwork === "testnet"}
              onChange={() =>
                onSwitchNetwork(
                  currentNetwork === "testnet" ? "mainnet" : "testnet"
                )
              }
              className={`${
                currentNetwork === "testnet" ? "bg-blue-600" : "bg-gray-200"
              } 
                relative inline-flex items-center h-6 rounded-full w-11`}
            >
              <span className="sr-only">Toggle Network</span>
              <span
                className={`${
                  currentNetwork === "testnet"
                    ? "translate-x-6"
                    : "translate-x-1"
                } 
                inline-block w-4 h-4 transform bg-white rounded-full`}
              />
            </Switch> */}
          </Switch.Group>
        </div>
      </div>

      <div className="mt-8 flex justify-center w-full px-10">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="w-full max-w-md gap-4 p-6 bg-white shadow-md rounded-md flex flex-col"
        >
          <div className="flex flex-col">
            <label htmlFor="accountId" className="mb-1 text-gray-600">
              Account ID:
            </label>
            <input
              id="accountId"
              {...register("accountId")}
              required
              className="border rounded p-2"
            />
          </div>

          <div className="flex flex-col">
            <label htmlFor="threshold" className="mb-1 text-gray-600">
              Threshold:
            </label>
            <input
              id="threshold"
              type="number"
              {...register("threshold")}
              required
              className="border rounded p-2"
            />
          </div>

          <div className="flex flex-col">
            <label htmlFor="signers" className="mb-1 text-gray-600">
              Signers:
            </label>
            <Controller
              name="signers"
              control={control}
              defaultValue={[]}
              rules={{
                validate: (value) =>
                  (value && value.length >= (watch("threshold") || 0)) ||
                  "Number of signers must be equal or greater than the threshold.",
              }}
              render={({ field }) => (
                <textarea
                  {...field}
                  value={rawSigners} // Set the raw value here
                  rows={4}
                  className="border rounded p-2"
                  placeholder="Enter signers separated by comma or new line"
                  onChange={(e) => {
                    setRawSigners(e.target.value); // Update the raw value
                    const signers = [
                      ...new Set(
                        e.target.value
                          .split(/,\s*|\n+/)
                          .map((signer) => signer.trim())
                          .filter(Boolean)
                      ),
                    ];
                    field.onChange(signers); // Set the processed value for the form
                  }}
                />
              )}
            />
            {errors.signers && (
              <span className="text-red-500 mt-1">
                {errors.signers.message}
              </span>
            )}
          </div>

          <div className="mt-4">
            <button
              type="submit"
              className="bg-green-500 text-white py-2 px-4 rounded"
            >
              Create Multisig Wallet
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
