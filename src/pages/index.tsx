import { GetPublicKey } from "@/components/GetPublicKey";
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
  const watchedAccountId = watch("accountId");

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
    <main className="flex min-h-screen flex-col p-10 bg-gray-50 gap-8">
      <div className="flex justify-end items-center space-x-4">
        <div className="mt-2">
          <Switch.Group>
            <Switch.Label className="mr-4">
              Current Network: {currentNetwork}
            </Switch.Label>
          </Switch.Group>
        </div>
      </div>

      <div className="flex justify-center w-full px-10">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="w-full max-w-xl gap-4 p-6 bg-white shadow-md rounded-md flex flex-col"
        >
          <h1 className="text-lg font-bold">Create new multisig wallet</h1>
          <div>Funding account:</div>
          {!accountId ? (
            <button
              onClick={handleSignIn}
              className={`bg-green-500 text-center text-white py-2 px-4 rounded`}
            >
              Sign in your NEAR account
            </button>
          ) : (
            <button
              onClick={handleSignOut}
              className="bg-orange-500 text-center text-white py-2 px-4 rounded"
            >
              Sign Out
            </button>
          )}
          {accountId ? <div>Currently connected to: {accountId}</div> : null}
          <div className="flex flex-col">
            <label htmlFor="accountId" className="mb-1 text-gray-600">
              Multisig account ID:
            </label>
            <input
              id="accountId"
              {...register("accountId", {
                required: "Account ID is required",
                pattern: {
                  value: /^[a-z]+$/,
                  message: "Account ID can only contain letters (a-z)",
                },
              })}
              className="border rounded p-2"
            />
            {errors.accountId && (
              <span className="text-red-500 mt-1">
                {errors.accountId.message}
              </span>
            )}
            {watchedAccountId && !errors.accountId ? (
              <div>
                AccountID preview: {watchedAccountId}.multisignature.near
              </div>
            ) : null}
          </div>
          <div className="flex flex-col">
            <label htmlFor="threshold" className="mb-1 text-gray-600">
              Number of confirmations required:
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
              Members:
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
                  placeholder="Enter the Ledger public key for each member, separated by a comma or a new line."
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
          <button
            type="submit"
            className={`bg-green-500 text-white py-2 px-4 rounded ${
              !accountId ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={!accountId}
          >
            Create Multisig Wallet
          </button>
          {!accountId && (
            <span className="text-red-500 mt-2">
              Please sign in to create a multisig wallet.
            </span>
          )}
        </form>
      </div>
      <div className="flex justify-center w-full px-10">
        <div className="w-full max-w-xl gap-4 p-6 bg-white shadow-md rounded-md flex flex-col">
          <GetPublicKey />
        </div>
      </div>
    </main>
  );
}
