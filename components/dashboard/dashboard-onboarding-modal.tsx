"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  Landmark,
  UserRound,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import {
  type ComponentProps,
  type FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useForm, type UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { completeOnboarding } from "@/server/actions/onboarding";
import { OnboardingSchema } from "@/types/onboarding-schema";
import { useAction } from "next-safe-action/hooks";
import {
  COUNTRY_OPTIONS,
  SUPPORTED_CURRENCIES,
  getBusinessProfileForCountry,
  getCountryOptionLabel,
  getCurrencyOptionLabel,
  getDefaultCurrencyForCountry,
  normalizeCountryCode,
  type CountryUiLocale,
} from "@/lib/country";

const DEFER_KEY = "kronoma-onboarding-deferred";

type OnboardingValues = z.infer<typeof OnboardingSchema>;
type StepField = keyof OnboardingValues;

type BusinessProfileData = {
  companyName: string | null;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  country: string | null;
  siret: string | null;
  email: string | null;
  phone: string | null;
  vatMention: string | null;
} | null;

type DashboardOnboardingModalProps = {
  shouldPrompt: boolean;
  initialData: {
    name: string | null;
    email: string | null;
    currency: string;
    hourlyRate: number;
    businessProfile: BusinessProfileData;
    hasBankAccount: boolean;
  };
};

export default function DashboardOnboardingModal({
  shouldPrompt,
  initialData,
}: DashboardOnboardingModalProps) {
  const t = useTranslations("dashboard.onboardingModal");
  const locale = useLocale();
  const uiLocale: CountryUiLocale = locale.startsWith("fr") ? "fr" : "en";
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const previousCountryRef = useRef<string | null>(null);

  const form = useForm<OnboardingValues>({
    resolver: zodResolver(OnboardingSchema),
    mode: "onTouched",
    defaultValues: {
      name: initialData.name || "",
      companyName: initialData.businessProfile?.companyName || "",
      address: initialData.businessProfile?.address || "",
      city: initialData.businessProfile?.city || "",
      postalCode: initialData.businessProfile?.postalCode || "",
      country: normalizeCountryCode(initialData.businessProfile?.country) || "CH",
      email: initialData.businessProfile?.email || initialData.email || "",
      phone: initialData.businessProfile?.phone || "",
      siret: initialData.businessProfile?.siret || "",
      vatMention: initialData.businessProfile?.vatMention || "",
      currency: initialData.currency || "CHF",
      hourlyRate: initialData.hourlyRate || 0,
      bankLabel: "",
      bankName: "",
      iban: "",
      bic: "",
    },
  });

  const steps = useMemo(
    () => [
      {
        icon: UserRound,
        title: t("steps.identity.title"),
        description: t("steps.identity.description"),
        fields: ["name", "companyName"] satisfies StepField[],
      },
      {
        icon: Building2,
        title: t("steps.business.title"),
        description: t("steps.business.description"),
        fields: [
          "address",
          "postalCode",
          "city",
          "country",
          "email",
          "phone",
        ] satisfies StepField[],
      },
      {
        icon: CircleDollarSign,
        title: t("steps.billing.title"),
        description: t("steps.billing.description"),
        fields: [
          "currency",
          "hourlyRate",
          "siret",
          "vatMention",
        ] satisfies StepField[],
      },
      {
        icon: Landmark,
        title: t("steps.bank.title"),
        description: initialData.hasBankAccount
          ? t("steps.bank.descriptionExisting")
          : t("steps.bank.description"),
        fields: ["bankLabel", "bankName", "iban", "bic"] satisfies StepField[],
      },
    ],
    [initialData.hasBankAccount, t]
  );

  const step = steps[stepIndex];
  const isLastStep = stepIndex === steps.length - 1;
  const progress = ((stepIndex + 1) / steps.length) * 100;
  const selectedCountry = form.watch("country");
  const countryProfile = getBusinessProfileForCountry(selectedCountry, uiLocale);

  const { execute, status } = useAction(completeOnboarding, {
    onSuccess: (result) => {
      if (!result.data?.success) {
        toast.error(t("error"));
        return;
      }

      sessionStorage.removeItem(DEFER_KEY);
      toast.success(t("success"));
      setOpen(false);
      router.refresh();
    },
    onError: () => {
      toast.error(t("error"));
    },
  });

  const isExecuting = status === "executing";

  useEffect(() => {
    if (!shouldPrompt) {
      sessionStorage.removeItem(DEFER_KEY);
      setOpen(false);
      return;
    }

    if (sessionStorage.getItem(DEFER_KEY)) return;
    setOpen(true);
  }, [shouldPrompt]);

  useEffect(() => {
    const normalizedCountry = normalizeCountryCode(selectedCountry);
    if (!normalizedCountry) return;

    if (previousCountryRef.current === null) {
      previousCountryRef.current = normalizedCountry;
      return;
    }

    if (previousCountryRef.current === normalizedCountry) return;
    previousCountryRef.current = normalizedCountry;
    form.setValue("currency", getDefaultCurrencyForCountry(normalizedCountry), {
      shouldDirty: true,
      shouldValidate: true,
    });
  }, [form, selectedCountry]);

  const handleDefer = () => {
    sessionStorage.setItem(DEFER_KEY, "1");
    setOpen(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setOpen(true);
      return;
    }

    handleDefer();
  };

  const validateCurrentStep = () => form.trigger(step.fields);

  const handleNext = async () => {
    const isValid = await validateCurrentStep();
    if (!isValid) return;
    setStepIndex((current) => Math.min(current + 1, steps.length - 1));
  };

  const handleBack = () => {
    setStepIndex((current) => Math.max(current - 1, 0));
  };

  const onSubmit = (values: OnboardingValues) => {
    execute(values);
  };

  const handleFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isExecuting) return;

    if (!isLastStep) {
      await handleNext();
      return;
    }

    await form.handleSubmit(onSubmit)();
  };

  const StepIcon = step.icon;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        overlayClassName="bg-ink/20 backdrop-blur-[2px]"
        className="max-h-[calc(100vh-2rem)] overflow-y-auto rounded-3xl border-line bg-white/95 p-0 shadow-[0_28px_90px_-45px_rgba(17,24,39,0.65)] backdrop-blur-xl sm:max-w-2xl"
      >
        <div className="grid gap-0 md:grid-cols-[220px_1fr]">
          <aside className="border-b border-line bg-panel px-5 py-5 md:border-b-0 md:border-r">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                <StepIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-ink-muted">
                  {t("eyebrow", {
                    current: stepIndex + 1,
                    total: steps.length,
                  })}
                </p>
                <p className="text-sm font-semibold text-ink">{t("title")}</p>
              </div>
            </div>

            <div className="mt-5 h-2 overflow-hidden rounded-full bg-white">
              <div
                className="h-full rounded-full bg-brand transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="mt-5 space-y-2">
              {steps.map((item, index) => {
                const ItemIcon = item.icon;
                const isActive = index === stepIndex;
                const isDone = index < stepIndex;

                return (
                  <div
                    key={item.title}
                    className={`flex items-center gap-2 rounded-2xl px-3 py-2 text-sm transition ${
                      isActive
                        ? "bg-white text-ink shadow-sm"
                        : "text-ink-muted"
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="h-4 w-4 text-brand-2" />
                    ) : (
                      <ItemIcon className="h-4 w-4" />
                    )}
                    <span className="line-clamp-1">{item.title}</span>
                  </div>
                );
              })}
            </div>
          </aside>

          <div className="px-5 py-5 sm:px-7 sm:py-6">
            <DialogHeader className="pr-8 text-left">
              <DialogTitle className="text-xl font-semibold text-ink">
                {step.title}
              </DialogTitle>
              <DialogDescription className="text-sm leading-6 text-ink-muted">
                {step.description}
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form
                onSubmit={handleFormSubmit}
                className="mt-6 space-y-5"
              >
                {stepIndex === 0 && (
                  <div className="grid gap-4">
                    <TextField name="name" label={t("fields.name")} form={form} />
                    <TextField
                      name="companyName"
                      label={t("fields.companyName")}
                      form={form}
                    />
                  </div>
                )}

                {stepIndex === 1 && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <TextField
                      name="address"
                      label={t("fields.address")}
                      form={form}
                      className="sm:col-span-2"
                    />
                    <TextField
                      name="postalCode"
                      label={t("fields.postalCode")}
                      form={form}
                    />
                    <TextField name="city" label={t("fields.city")} form={form} />
                    <CountryField
                      form={form}
                      label={t("fields.country")}
                      locale={uiLocale}
                    />
                    <TextField
                      name="email"
                      label={t("fields.email")}
                      form={form}
                      type="email"
                    />
                    <TextField
                      name="phone"
                      label={t("fields.phone")}
                      form={form}
                      optional
                    />
                  </div>
                )}

                {stepIndex === 2 && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <CurrencyField
                      form={form}
                      label={t("fields.currency")}
                      locale={uiLocale}
                    />
                    <TextField
                      name="hourlyRate"
                      label={t("fields.hourlyRate")}
                      form={form}
                      type="number"
                      min="0"
                      step="0.01"
                    />
                    <TextField
                      name="siret"
                      label={countryProfile.taxIdLabel}
                      form={form}
                      placeholder={countryProfile.taxIdPlaceholder}
                      optional
                    />
                    <TextField
                      name="vatMention"
                      label={countryProfile.taxMentionLabel}
                      form={form}
                      placeholder={countryProfile.taxMentionPlaceholder}
                      optional
                    />
                  </div>
                )}

                {stepIndex === 3 && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <TextField
                      name="bankLabel"
                      label={t("fields.bankLabel")}
                      form={form}
                      optional
                    />
                    <TextField
                      name="bankName"
                      label={t("fields.bankName")}
                      form={form}
                      optional
                    />
                    <TextField
                      name="iban"
                      label={countryProfile.bankAccountLabel}
                      form={form}
                      className="sm:col-span-2"
                      placeholder={countryProfile.bankAccountPlaceholder}
                      optional
                    />
                    <TextField
                      name="bic"
                      label={countryProfile.bankCodeLabel}
                      form={form}
                      placeholder={countryProfile.bankCodePlaceholder}
                      optional
                    />
                  </div>
                )}

                <div className="flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    onClick={handleDefer}
                    className="rounded-2xl border border-line bg-white/80 px-4 py-3 text-sm font-semibold text-ink-muted transition hover:bg-white hover:text-ink"
                  >
                    {t("later")}
                  </button>

                  <div className="flex gap-3 sm:justify-end">
                    <button
                      type="button"
                      onClick={handleBack}
                      disabled={stepIndex === 0 || isExecuting}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-line bg-white text-ink transition hover:bg-panel disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      <span className="sr-only">{t("back")}</span>
                    </button>

                    {isLastStep ? (
                      <button
                        type="submit"
                        disabled={isExecuting}
                        className="inline-flex min-h-11 flex-1 items-center justify-center rounded-2xl bg-brand px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_-26px_rgba(249,115,22,0.9)] transition hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
                      >
                        {isExecuting ? t("saving") : t("finish")}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleNext}
                        disabled={isExecuting}
                        className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-brand px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_-26px_rgba(249,115,22,0.9)] transition hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
                      >
                        {t("next")}
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TextField({
  form,
  name,
  label,
  optional,
  className,
  ...inputProps
}: {
  form: UseFormReturn<OnboardingValues>;
  name: StepField;
  label: string;
  optional?: boolean;
  className?: string;
} & Omit<ComponentProps<typeof Input>, "form" | "name">) {
  const t = useTranslations("dashboard.onboardingModal");

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <label
            htmlFor={`onboarding-${name}`}
            className="text-xs font-semibold uppercase text-ink-muted"
          >
            {label}
            {optional ? (
              <span className="ml-1 font-normal normal-case">
                {t("optional")}
              </span>
            ) : (
              <span className="ml-0.5 text-brand">*</span>
            )}
          </label>
          <FormControl>
            <Input
              id={`onboarding-${name}`}
              className="mt-1.5 border-line bg-white/75 focus:bg-white"
              {...field}
              value={field.value ?? ""}
              {...inputProps}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function CurrencyField({
  form,
  label,
  locale,
}: {
  form: UseFormReturn<OnboardingValues>;
  label: string;
  locale: CountryUiLocale;
}) {
  return (
    <FormField
      control={form.control}
      name="currency"
      render={({ field }) => (
        <FormItem>
          <label
            htmlFor="onboarding-currency"
            className="text-xs font-semibold uppercase text-ink-muted"
          >
            {label}
            <span className="ml-0.5 text-brand">*</span>
          </label>
          <Select value={field.value} onValueChange={field.onChange}>
            <FormControl>
              <SelectTrigger
                id="onboarding-currency"
                className="mt-1.5 border-line bg-white/75 focus:bg-white"
              >
                <SelectValue />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {SUPPORTED_CURRENCIES.map((currency) => (
                <SelectItem key={currency.code} value={currency.code}>
                  {getCurrencyOptionLabel(currency.code, locale)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function CountryField({
  form,
  label,
  locale,
}: {
  form: UseFormReturn<OnboardingValues>;
  label: string;
  locale: CountryUiLocale;
}) {
  return (
    <FormField
      control={form.control}
      name="country"
      render={({ field }) => (
        <FormItem>
          <label
            htmlFor="onboarding-country"
            className="text-xs font-semibold uppercase text-ink-muted"
          >
            {label}
            <span className="ml-0.5 text-brand">*</span>
          </label>
          <Select
            value={normalizeCountryCode(field.value) || "CH"}
            onValueChange={field.onChange}
          >
            <FormControl>
              <SelectTrigger
                id="onboarding-country"
                className="mt-1.5 border-line bg-white/75 focus:bg-white"
              >
                <SelectValue />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {COUNTRY_OPTIONS.map((country) => (
                <SelectItem key={country.code} value={country.code}>
                  {getCountryOptionLabel(country.code, locale)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
