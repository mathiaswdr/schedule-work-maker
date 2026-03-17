"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState, useImperativeHandle, forwardRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";
import Image from "next/image";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { BusinessProfileSchema } from "@/types/business-profile-schema";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { upsertBusinessProfile } from "@/server/actions/business-profile";
import { CloudinaryUploadButton } from "@/components/ui/cloudinary-upload-button";

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

type BusinessProfileFormProps = {
  profile: BusinessProfileData;
};

export type BusinessProfileFormHandle = {
  submit: () => void;
  isExecuting: boolean;
};

const BusinessProfileForm = forwardRef<
  BusinessProfileFormHandle,
  BusinessProfileFormProps
>(function BusinessProfileForm({ profile }, ref) {
  const t = useTranslations("dashboard");
  const shouldReduceMotion = useReducedMotion();

  const [logoUploading, setLogoUploading] = useState(false);

  const form = useForm<z.infer<typeof BusinessProfileSchema>>({
    resolver: zodResolver(BusinessProfileSchema),
    defaultValues: {
      companyName: profile?.companyName || "",
      address: profile?.address || "",
      city: profile?.city || "",
      postalCode: profile?.postalCode || "",
      country: profile?.country || "",
      siret: profile?.siret || "",
      email: profile?.email || "",
      phone: profile?.phone || "",
      logoUrl: profile?.logoUrl || "",
      vatMention: profile?.vatMention || "",
    },
  });

  const { execute, status } = useAction(upsertBusinessProfile, {
    onSuccess: (data) => {
      if (data) toast.success(t("settingsPage.businessProfile.saved"));
      else toast.error(t("settingsPage.error"));
    },
    onError: () => {
      toast.error(t("settingsPage.error"));
    },
  });

  const onSubmit = (values: z.infer<typeof BusinessProfileSchema>) => {
    execute(values);
  };

  useImperativeHandle(ref, () => ({
    submit: () => form.handleSubmit(onSubmit)(),
    isExecuting: status === "executing" || logoUploading,
  }));

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

  const fields = [
    {
      name: "companyName" as const,
      label: t("settingsPage.businessProfile.companyName"),
      placeholder: t("settingsPage.businessProfile.companyNamePlaceholder"),
      required: true,
    },
    {
      name: "address" as const,
      label: t("settingsPage.businessProfile.address"),
      placeholder: t("settingsPage.businessProfile.addressPlaceholder"),
      required: true,
    },
    {
      name: "city" as const,
      label: t("settingsPage.businessProfile.city"),
      placeholder: t("settingsPage.businessProfile.cityPlaceholder"),
      required: true,
    },
    {
      name: "postalCode" as const,
      label: t("settingsPage.businessProfile.postalCode"),
      placeholder: t("settingsPage.businessProfile.postalCodePlaceholder"),
      required: true,
    },
    {
      name: "country" as const,
      label: t("settingsPage.businessProfile.country"),
      placeholder: t("settingsPage.businessProfile.countryPlaceholder"),
      required: true,
    },
    {
      name: "siret" as const,
      label: t("settingsPage.businessProfile.siret"),
      placeholder: t("settingsPage.businessProfile.siretPlaceholder"),
      required: false,
    },
    {
      name: "email" as const,
      label: t("settingsPage.businessProfile.email"),
      placeholder: t("settingsPage.businessProfile.emailPlaceholder"),
      required: true,
    },
    {
      name: "phone" as const,
      label: t("settingsPage.businessProfile.phone"),
      placeholder: t("settingsPage.businessProfile.phonePlaceholder"),
      required: false,
    },
    {
      name: "vatMention" as const,
      label: t("settingsPage.businessProfile.vatMention"),
      placeholder: t("settingsPage.businessProfile.vatMentionPlaceholder"),
      required: false,
    },
  ];

  return (
    <Form {...form}>
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Fields */}
        <div className="rounded-3xl border border-line bg-white/80 p-6">
          <p className="text-sm font-semibold">
            {t("settingsPage.businessProfile.title")}
          </p>
          <p className="mt-1 text-xs text-ink-muted">
            {t("settingsPage.businessProfile.subtitle")}
          </p>
          <motion.div
            className="mt-5 space-y-4"
            variants={listVariants}
            initial="hidden"
            animate="show"
          >
            {fields.map((f) => (
              <motion.div key={f.name} variants={itemVariants}>
                <FormField
                  control={form.control}
                  name={f.name}
                  render={({ field }) => (
                    <FormItem>
                      <div className="rounded-2xl border border-line bg-white/70 px-4 py-3">
                        <label
                          htmlFor={`business-profile-${f.name}`}
                          className="text-xs uppercase text-ink-muted"
                        >
                          {f.label}
                          {f.required && <span className="text-brand ml-0.5">*</span>}
                        </label>
                        <FormControl>
                          <Input
                            id={`business-profile-${f.name}`}
                            disabled={status === "executing"}
                            placeholder={f.placeholder}
                            className="mt-1.5 border-line bg-white/60 focus:bg-white"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Logo */}
        <div className="rounded-3xl border border-line bg-panel p-6">
          <p className="text-sm font-semibold">
            {t("settingsPage.businessProfile.logo")}
          </p>
          <motion.div
            className="mt-4 space-y-4"
            variants={listVariants}
            initial="hidden"
            animate="show"
          >
            <motion.div variants={itemVariants}>
              <div className="rounded-2xl border border-line bg-white/70 px-4 py-4">
                <div className="flex items-center gap-4">
                  {form.watch("logoUrl") ? (
                    <Image
                      className="h-16 w-16 rounded-2xl border border-line object-contain"
                      src={form.watch("logoUrl")!}
                      alt="company logo"
                      width={64}
                      height={64}
                      quality={100}
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-dashed border-line bg-white/60 text-xs text-ink-muted">
                      Logo
                    </div>
                  )}
                  <CloudinaryUploadButton
                    type="image"
                    accept="image/*"
                    label={t("settingsPage.businessProfile.uploadLogo")}
                    uploadingLabel={t("settingsPage.businessProfile.uploading")}
                    onUploadBegin={() => setLogoUploading(true)}
                    onUploadError={() => setLogoUploading(false)}
                    onUploadComplete={(result) => {
                      form.setValue("logoUrl", result.url);
                      setLogoUploading(false);
                    }}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="logoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input type="hidden" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </Form>
  );
});

export default BusinessProfileForm;
