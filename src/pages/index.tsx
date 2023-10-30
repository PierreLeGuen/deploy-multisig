import { useWalletSelector } from "@/contexts/WalletSelectorContext";
import { parseNearAmount } from "near-api-js/lib/utils/format";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

type MultisigForm = {
  accountId: string;
  threshold: number;
  signers: string[];
};

export default function Home() {
  const { selector, modal, accounts, accountId } = useWalletSelector();
  const {
    control,
    handleSubmit,
    register,
    setError,
    formState: { errors },
    watch,
  } = useForm<MultisigForm>();

  // State for current network
  const [currentNetwork, setCurrentNetwork] = useState("testnet");

  const handleSignIn = () => {
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
                  num_confirmations: data.threshold,
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
    <main className="flex min-h-screen flex-col p-10">
      <div className="flex justify-end">
        <div className="">
          <div
            className={`flex ${!accountId ? "" : "hidden"}`}
            onClick={handleSignIn}
          >
            Sign In
          </div>
          <div
            className={`flex ${!accountId ? "hidden" : ""}`}
            onClick={handleSignOut}
          >
            Sign Out
          </div>
          {/* Network Toggle */}
          <div className="mt-2 flex flex-col">
            Current Network: {currentNetwork}
          </div>
          <div className="flex flex-col gap-1">
            Switch Network:
            <button onClick={() => onSwitchNetwork("testnet")}>Testnet</button>
            <button onClick={() => onSwitchNetwork("mainnet")}>Mainnet</button>
          </div>
        </div>
      </div>

      <div className="flex justify-center w-full px-10">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="w-full gap-3 flex flex-col"
        >
          <div>
            <label htmlFor="accountId">Account ID:</label>
            <input id="accountId" {...register("accountId")} required />
          </div>
          <div>
            <label htmlFor="threshold">Threshold:</label>
            <input
              id="threshold"
              type="number"
              {...register("threshold")}
              required
            />
          </div>
          <div>
            <label htmlFor="signers">Signers:</label>
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
                  placeholder="Enter signers separated by comma or new line"
                  onChange={(e) =>
                    field.onChange(e.target.value.split(/,\s*|\n+/))
                  }
                />
              )}
            />
            {errors.signers && <span>{errors.signers.message}</span>}
          </div>
          <div>
            <button type="submit">Create Multisig Wallet</button>
          </div>
        </form>
      </div>
    </main>
  );
}
