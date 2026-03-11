"use client";

import { Session } from "next-auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { SettingsSchema } from "@/types/settings-schema";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { settings } from "@/server/actions/settings";
import { redeemAccessCode } from "@/server/actions/redeem-code";
import { CloudinaryUploadButton } from "@/components/ui/cloudinary-upload-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import BusinessProfileForm from "@/components/dashboard/business-profile-form";
import type { BusinessProfileFormHandle } from "@/components/dashboard/business-profile-form";
import BankAccountFormDialog from "@/components/dashboard/bank-account-form-dialog";
import { deleteBankAccount } from "@/server/actions/bank-accounts";
import { Pencil, Trash2 } from "lucide-react";

const CURRENCIES = [
  { code: "CHF", label: "CHF – Franc suisse" },
  { code: "EUR", label: "EUR – Euro" },
  { code: "USD", label: "USD – US Dollar" },
  { code: "GBP", label: "GBP – British Pound" },
  { code: "CAD", label: "CAD – Canadian Dollar" },
  { code: "JPY", label: "JPY – Yen" },
];

type BusinessProfileData = {
  companyName: string | null;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  country: string | null;
  siret: string | null;
  email: string | null;
  phone: string | null;
  logoUrl: string | null;
  vatMention: string | null;
} | null;

type BankAccountData = {
  id: string;
  label: string;
  bankName: string | null;
  iban: string;
  bic: string | null;
  isDefault: boolean;
};

type SettingsCardProps = {
  session: Session;
  businessProfile: BusinessProfileData;
  bankAccounts: BankAccountData[];
  currency: string;
  hourlyRate: number;
  plan: string;
  hasStripeCustomer: boolean;
  displayClassName: string;
};

export default function SettingsCard({
  session,
  businessProfile,
  bankAccounts: initialBankAccounts,
  currency,
  hourlyRate,
  plan,
  hasStripeCustomer,
  displayClassName,
}: SettingsCardProps) {
  const t = useTranslations("dashboard");
  const shouldReduceMotion = useReducedMotion();

  const [imageUploading, setImageUploading] = useState(false);
  const [billingLoading, setBillingLoading] = useState(false);
  const businessProfileRef = useRef<BusinessProfileFormHandle>(null);

  // Bank accounts state
  const [bankAccounts, setBankAccounts] = useState(initialBankAccounts);
  const [bankDialogOpen, setBankDialogOpen] = useState(false);
  const [editingBankAccount, setEditingBankAccount] = useState<BankAccountData | null>(null);

  const refreshBankAccounts = () => {
    fetch("/api/bank-accounts")
      .then((r) => r.json())
      .then((d) => setBankAccounts(d.bankAccounts || []))
      .catch(() => null);
  };

  const { execute: execDeleteBank } = useAction(deleteBankAccount, {
    onSuccess: () => {
      toast.success(t("settingsPage.bankAccounts.deleted"));
      refreshBankAccounts();
    },
    onError: () => {
      toast.error(t("settingsPage.error"));
    },
  });

  const form = useForm<z.infer<typeof SettingsSchema>>({
    defaultValues: {
      password: undefined,
      newPassword: undefined,
      name: session.user?.name || undefined,
      email: session.user?.email || undefined,
      image: session.user?.image || undefined,
      currency: currency,
      hourlyRate: hourlyRate,
    },
  });

  const { execute, status } = useAction(settings, {
    onSuccess: (data) => {
      if (data) toast.success(t("settingsPage.success"));
      else toast.error(t("settingsPage.error"));
    },
    onError: () => {
      toast.error(t("settingsPage.error"));
    },
  });

  const [accessCode, setAccessCode] = useState("");
  const { execute: executeRedeem, status: redeemStatus } = useAction(
    redeemAccessCode,
    {
      onSuccess: (data) => {
        const result = data.data;
        if (result?.success) {
          toast.success(
            t("settingsPage.accessCode.success", { plan: result.success })
          );
          setAccessCode("");
        } else if (result?.error === "already_redeemed") {
          toast.error(t("settingsPage.accessCode.errorAlreadyRedeemed"));
        } else if (result?.error === "no_upgrade") {
          toast.error(t("settingsPage.accessCode.errorNoUpgrade"));
        } else {
          toast.error(t("settingsPage.accessCode.errorInvalid"));
        }
      },
      onError: () => {
        toast.error(t("settingsPage.accessCode.errorInvalid"));
      },
    }
  );

  const onSubmit = (values: z.infer<typeof SettingsSchema>) => {
    execute(values);
  };

  const handleSaveAll = () => {
    form.handleSubmit(onSubmit)();
    businessProfileRef.current?.submit();
  };

  const isSaving =
    status === "executing" ||
    imageUploading ||
    (businessProfileRef.current?.isExecuting ?? false);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.12,
        delayChildren: shouldReduceMotion ? 0 : 0.04,
      },
    },
  };

  const fadeUp = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 18 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
    },
  };

  const listVariants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 10 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
    },
  };

  return (
    <main className="w-full">
      <div className="relative overflow-hidden rounded-[32px] border border-line bg-white/70 p-4 shadow-[0_30px_80px_-60px_rgba(15,118,110,0.45)] sm:p-8">
        <div className="pointer-events-none absolute -top-24 right-[-6rem] h-[260px] w-[260px] rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(15,118,110,0.22),transparent_60%)] blur-2xl will-change-transform" />
        <div className="pointer-events-none absolute bottom-[-12rem] left-[-6rem] h-[320px] w-[320px] rounded-full bg-[radial-gradient(circle_at_40%_40%,rgba(249,115,22,0.22),transparent_60%)] blur-3xl will-change-transform" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(29,27,22,0.07)_1px,transparent_0)] bg-[length:18px_18px] opacity-30 will-change-transform" />

        <motion.div
          className="relative z-10 space-y-8"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {/* Header + Save button */}
          <motion.section
            variants={fadeUp}
            className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
          >
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">
                {t("eyebrow")}
              </p>
              <h1
                className={`${displayClassName} text-2xl font-semibold sm:text-3xl`}
              >
                {t("settingsPage.title")}
              </h1>
              <p className="max-w-xl text-sm text-ink-muted sm:text-base">
                {t("settingsPage.subtitle")}
              </p>
            </div>
            <button
              type="button"
              onClick={handleSaveAll}
              disabled={isSaving}
              className="self-start rounded-2xl bg-brand px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_-26px_rgba(249,115,22,0.9)] transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {t("settingsPage.submit")}
            </button>
          </motion.section>

          {/* Profile form */}
          <Form {...form}>
            <div className="space-y-8">
              <motion.section
                variants={fadeUp}
                className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]"
              >
                {/* Name + Avatar form */}
                <div className="overflow-hidden rounded-3xl border border-line bg-white/80 p-4 shadow-[0_28px_60px_-48px_rgba(249,115,22,0.35)] sm:p-6">
                  <p className="text-sm font-semibold">
                    {t("settingsPage.profile.title")}
                  </p>
                  <motion.div
                    className="mt-5 space-y-5"
                    variants={listVariants}
                  >
                    {/* Name field */}
                    <motion.div variants={itemVariants}>
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <div className="rounded-2xl border border-line bg-white/70 px-4 py-4">
                              <label className="text-xs uppercase tracking-[0.2em] text-ink-muted">
                                {t("settingsPage.profile.nameLabel")}
                              </label>
                              <FormControl>
                                <Input
                                  disabled={status === "executing"}
                                  placeholder={t(
                                    "settingsPage.profile.namePlaceholder"
                                  )}
                                  className="mt-2 border-line bg-white/60 focus:bg-white"
                                  {...field}
                                />
                              </FormControl>
                              <p className="mt-2 text-xs text-ink-muted">
                                {t("settingsPage.profile.nameHint")}
                              </p>
                              <FormMessage />
                            </div>
                          </FormItem>
                        )}
                      />
                    </motion.div>

                    {/* Avatar field */}
                    <motion.div variants={itemVariants}>
                      <FormField
                        control={form.control}
                        name="image"
                        render={({ field }) => (
                          <FormItem>
                            <div className="rounded-2xl border border-line bg-white/70 px-4 py-4">
                              <label className="text-xs uppercase tracking-[0.2em] text-ink-muted">
                                {t("settingsPage.profile.avatarLabel")}
                              </label>
                              <div className="mt-3 flex items-center gap-4">
                                {!form.getValues("image") && (
                                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-line bg-brand/10 text-lg font-bold text-brand">
                                    {session.user?.name
                                      ?.charAt(0)
                                      .toUpperCase()}
                                  </div>
                                )}
                                {form.getValues("image") && (
                                  <Image
                                    className="h-12 w-12 rounded-full object-cover"
                                    src={form.getValues("image")!}
                                    alt="user avatar"
                                    width={48}
                                    height={48}
                                    quality={100}
                                  />
                                )}
                                <CloudinaryUploadButton
                                  type="image"
                                  accept="image/*"
                                  label={t("settingsPage.profile.changeAvatar")}
                                  uploadingLabel={t("settingsPage.profile.uploading")}
                                  onUploadBegin={() =>
                                    setImageUploading(true)
                                  }
                                  onUploadError={(error) => {
                                    form.setError("image", {
                                      type: "validate",
                                      message: error.message,
                                    });
                                    setImageUploading(false);
                                  }}
                                  onUploadComplete={(result) => {
                                    form.setValue("image", result.url);
                                    setImageUploading(false);
                                  }}
                                />
                              </div>
                              <FormControl>
                                <Input
                                  type="hidden"
                                  disabled={status === "executing"}
                                  placeholder="user image"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </div>
                          </FormItem>
                        )}
                      />
                    </motion.div>
                  </motion.div>
                </div>

                {/* Account info panel */}
                <div className="overflow-hidden rounded-3xl border border-line bg-panel p-4 sm:p-6">
                  <p className="text-sm font-semibold">
                    {t("settingsPage.account.title")}
                  </p>
                  <motion.div
                    className="mt-4 space-y-3"
                    variants={listVariants}
                  >
                    <motion.div
                      variants={itemVariants}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-white/70 px-4 py-3"
                    >
                      <span className="shrink-0 text-sm text-ink-muted">
                        {t("settingsPage.account.emailLabel")}
                      </span>
                      <span className="min-w-0 truncate text-sm font-semibold">
                        {session.user?.email ?? "\u2014"}
                      </span>
                    </motion.div>

                    <motion.div
                      variants={itemVariants}
                      className="flex items-center justify-between rounded-2xl border border-line bg-white/70 px-4 py-3"
                    >
                      <span className="text-sm text-ink-muted">
                        {t("settingsPage.account.planLabel")}
                      </span>
                      <Link
                        href="/dashboard/subscription"
                        className="rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand hover:bg-brand/20 transition"
                      >
                        {plan}
                      </Link>
                    </motion.div>
                    <motion.div
                      variants={itemVariants}
                      className="rounded-2xl border border-line bg-white/70 px-4 py-3"
                    >
                      <span className="text-sm text-ink-muted">
                        {t("settingsPage.account.currencyLabel")}
                      </span>
                      <Select
                        value={form.watch("currency") || currency}
                        onValueChange={(v) => form.setValue("currency", v)}
                      >
                        <SelectTrigger className="mt-2 border-line bg-white/60">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CURRENCIES.map((c) => (
                            <SelectItem key={c.code} value={c.code}>
                              {c.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="mt-2 text-xs text-ink-muted">
                        {t("settingsPage.account.currencyHint")}
                      </p>
                    </motion.div>

                    <motion.div
                      variants={itemVariants}
                      className="rounded-2xl border border-line bg-white/70 px-4 py-3"
                    >
                      <FormField
                        control={form.control}
                        name="hourlyRate"
                        render={({ field }) => (
                          <FormItem>
                            <span className="text-sm text-ink-muted">
                              {t("settingsPage.account.hourlyRateLabel")}
                            </span>
                            <FormControl>
                              <Input
                                type="number"
                                min={0}
                                step={0.01}
                                disabled={status === "executing"}
                                placeholder="0.00"
                                className="mt-2 border-line bg-white/60 focus:bg-white"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                              />
                            </FormControl>
                            <p className="mt-2 text-xs text-ink-muted">
                              {t("settingsPage.account.hourlyRateHint")}
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </motion.div>
                  </motion.div>

                  <div className="mt-5 rounded-2xl border border-line bg-white/70 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-ink-muted">
                      {t("settingsPage.account.planHint")}
                    </p>
                  </div>

                  {hasStripeCustomer && plan !== "FREE" && (
                    <button
                      type="button"
                      disabled={billingLoading}
                      onClick={async () => {
                        setBillingLoading(true);
                        try {
                          const res = await fetch("/api/payment-dashboard", { method: "POST" });
                          const data = await res.json();
                          if (data.url) window.location.href = data.url;
                          else toast.error(data.message);
                        } catch {
                          toast.error(t("settingsPage.error"));
                        } finally {
                          setBillingLoading(false);
                        }
                      }}
                      className="mt-4 w-full rounded-2xl border border-line-strong bg-white/80 px-4 py-3 text-sm font-semibold text-ink transition hover:bg-white disabled:opacity-50"
                    >
                      {billingLoading
                        ? "..."
                        : t("settingsPage.account.manageBilling")}
                    </button>
                  )}
                </div>
              </motion.section>
            </div>
          </Form>

          {/* Access Code section */}
          <motion.section variants={fadeUp}>
            <div className="overflow-hidden rounded-3xl border border-line bg-white/80 p-4 sm:p-6">
              <p className="text-sm font-semibold">
                {t("settingsPage.accessCode.title")}
              </p>
              <div className="mt-4 flex gap-3">
                <Input
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  placeholder={t("settingsPage.accessCode.placeholder")}
                  disabled={redeemStatus === "executing"}
                  className="border-line bg-white/60 focus:bg-white"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && accessCode.trim()) {
                      executeRedeem({ code: accessCode.trim() });
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => executeRedeem({ code: accessCode.trim() })}
                  disabled={
                    redeemStatus === "executing" || !accessCode.trim()
                  }
                  className="shrink-0 rounded-2xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-[0_18px_40px_-26px_rgba(249,115,22,0.9)] transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {redeemStatus === "executing"
                    ? t("settingsPage.accessCode.redeeming")
                    : t("settingsPage.accessCode.redeem")}
                </button>
              </div>
            </div>
          </motion.section>

          {/* Bank Accounts section */}
          <motion.section variants={fadeUp}>
            <div className="overflow-hidden rounded-3xl border border-line bg-white/80 p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">
                    {t("settingsPage.bankAccounts.title")}
                  </p>
                  <p className="mt-1 text-xs text-ink-muted">
                    {t("settingsPage.bankAccounts.subtitle")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingBankAccount(null);
                    setBankDialogOpen(true);
                  }}
                  className="shrink-0 rounded-2xl bg-brand px-4 py-2 text-sm font-semibold text-white shadow-[0_18px_40px_-26px_rgba(249,115,22,0.9)] transition hover:translate-y-[-1px]"
                >
                  {t("settingsPage.bankAccounts.addAccount")}
                </button>
              </div>

              {bankAccounts.length === 0 ? (
                <p className="mt-4 text-sm text-ink-muted">
                  {t("settingsPage.bankAccounts.empty")}
                </p>
              ) : (
                <motion.div
                  className="mt-4 space-y-3"
                  variants={listVariants}
                >
                  {bankAccounts.map((account) => (
                    <motion.div
                      key={account.id}
                      variants={itemVariants}
                      className="flex items-center justify-between rounded-2xl border border-line bg-white/70 px-4 py-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold truncate">
                            {account.label}
                          </span>
                          {account.isDefault && (
                            <span className="shrink-0 rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-semibold text-brand">
                              {t("settingsPage.bankAccounts.default")}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-ink-muted truncate">
                          {account.iban}
                          {account.bankName ? ` — ${account.bankName}` : ""}
                        </p>
                      </div>
                      <div className="ml-3 flex shrink-0 gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingBankAccount(account);
                            setBankDialogOpen(true);
                          }}
                          className="rounded-xl p-2 text-ink-muted transition hover:bg-ink-soft hover:text-ink"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => execDeleteBank({ id: account.id })}
                          className="rounded-xl p-2 text-ink-muted transition hover:bg-red-50 hover:text-red-500"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>

            <BankAccountFormDialog
              open={bankDialogOpen}
              onOpenChange={setBankDialogOpen}
              account={editingBankAccount}
              onSuccess={refreshBankAccounts}
            />
          </motion.section>

          {/* Business Profile section */}
          <motion.section variants={fadeUp}>
            <BusinessProfileForm
              ref={businessProfileRef}
              profile={businessProfile}
            />
          </motion.section>
        </motion.div>
      </div>
    </main>
  );
}
