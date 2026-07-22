"use client";

"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getQuestionsForEventType } from "@/lib/booking-questionnaire";
import { AddressInput } from "./AddressInput";
import { VenmoPaymentFlow } from "@/components/VenmoPaymentFlow";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";

type ServicePackage = {
  id: string;
  name: string;
  description: string | null;
  rollsIncluded: number;
  photosIncluded: number;
  hoursIncluded: number | null;
  basePrice: number;
  eventTypes: string[];
  addOnPricing: Record<string, number> | null;
};

const REFERRAL_OPTIONS = [
  "Instagram",
  "TikTok",
  "Pinterest",
  "Google",
  "Word of mouth / friend",
  "Past client (returning)",
  "Wedding planner or vendor",
  "Other",
] as const;

const schema = z.object({
  packageId: z.string().min(1, "Select a package"),
  eventType: z.string().min(1, "Select an event type"),
  eventDate: z.string().min(1, "Select a date"),
  customerName: z.string().min(2, "Name is required"),
  customerEmail: z.email("Valid email required"),
  customerPhone: z.string().optional(),
  communicationPreference: z.enum(["email", "sms"]),
  referralSource: z.string().optional(),
  message: z.string().optional(),
  addOns: z.object({
    extraRoll: z.boolean(),
    rushDelivery: z.boolean(),
    secondShooter: z.boolean(),
  }),
});

type FormValues = z.infer<typeof schema>;

const ADD_ON_LABELS: Record<string, string> = {
  extraRoll: "Extra roll",
  rushDelivery: "Rush delivery (1 week)",
  secondShooter: "Second shooter",
};

const ADD_ON_KEYS: Record<string, string> = {
  extraRoll: "extraRollPrice",
  rushDelivery: "rushDeliveryPrice",
  secondShooter: "secondShooterPrice",
};

function formatPrice(cents: number) {
  return `$${(cents / 100).toLocaleString("en-US")}`;
}

function today() {
  return new Date().toISOString().split("T")[0];
}

export default function BookingForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [bookedDates, setBookedDates] = useState<string[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [venmoBooking, setVenmoBooking] = useState<{ bookingId: string; depositAmount: number } | null>(null);

  const preselectedPackageId = searchParams.get("package") ?? "";
  const wasCancelled = searchParams.get("cancelled") === "1";

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      packageId: preselectedPackageId,
      communicationPreference: "email",
      addOns: { extraRoll: false, rushDelivery: false, secondShooter: false },
    },
  });

  const selectedPackageId = watch("packageId");
  const selectedPackage = packages.find((p) => p.id === selectedPackageId) ?? null;
  const selectedAddOns = watch("addOns");
  const selectedDate = watch("eventDate");
  const phone = watch("customerPhone");
  const selectedEventType = watch("eventType");

  const questions = useMemo(
    () => selectedEventType ? getQuestionsForEventType(selectedEventType) : [],
    [selectedEventType]
  );

  const availableAddOns = useMemo(() => {
    if (!selectedPackage) return [];
    const addOnPricing = selectedPackage.addOnPricing ?? {};
    return Object.entries(ADD_ON_KEYS).filter(
      ([, priceKey]) => addOnPricing[priceKey] && addOnPricing[priceKey] > 0
    );
  }, [selectedPackage]);

  const contactStepNum = 3 + (selectedEventType ? 1 : 0) + (availableAddOns.length > 0 ? 1 : 0) + 1;

  const totalPrice = (() => {
    if (!selectedPackage) return 0;
    const addOns = selectedPackage.addOnPricing ?? {};
    let total = selectedPackage.basePrice;
    if (selectedAddOns.extraRoll && addOns.extraRollPrice) total += addOns.extraRollPrice;
    if (selectedAddOns.rushDelivery && addOns.rushDeliveryPrice) total += addOns.rushDeliveryPrice;
    if (selectedAddOns.secondShooter && addOns.secondShooterPrice) total += addOns.secondShooterPrice;
    return total;
  })();
  const depositAmount = Math.round(totalPrice * 0.5);

  useEffect(() => {
    if (selectedPackage && selectedPackage.eventTypes.length === 1) {
      setValue("eventType", selectedPackage.eventTypes[0]);
    }
  }, [selectedPackageId, selectedPackage, setValue]);

  // Pre-populate hours_coverage from package when package changes
  useEffect(() => {
    if (selectedPackage?.hoursIncluded) {
      setAnswers((prev) => ({
        ...prev,
        hours_coverage: String(selectedPackage.hoursIncluded),
      }));
    }
  }, [selectedPackageId, selectedPackage]);

  useEffect(() => {
    Promise.all([
      fetch("/api/services/packages").then((r) => r.json()),
      fetch("/api/booking/booked-dates").then((r) => r.json()),
    ]).then(([pkgsData, datesData]: [{ packages: ServicePackage[] }, { dates: string[] }]) => {
      setPackages(pkgsData.packages ?? []);
      setBookedDates(datesData.dates ?? []);
      setLoadingPackages(false);
    });
  }, []);

  const isDateBooked = (date: string) => bookedDates.includes(date);

  async function submitBooking(values: FormValues, paymentMethod: "stripe" | "venmo") {
    if (isDateBooked(values.eventDate)) {
      setServerError("That date is already booked. Please choose another.");
      return;
    }
    setSubmitting(true);
    setServerError(null);

    try {
      const filteredAnswers = Object.fromEntries(
        Object.entries(answers).filter(([, v]) => v.trim())
      );
      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, questionnaireAnswers: filteredAnswers, paymentMethod, referralSource: values.referralSource || undefined }),
      });

      const json = await res.json();

      if (!res.ok) {
        setServerError(json.error ?? "Something went wrong.");
        setSubmitting(false);
        return;
      }

      if (paymentMethod === "venmo") {
        setVenmoBooking({ bookingId: json.bookingId, depositAmount: json.depositAmount });
        setSubmitting(false);
      } else {
        router.push(json.url);
      }
    } catch {
      setServerError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  function onSubmit(values: FormValues) {
    submitBooking(values, "stripe");
  }

  function onVenmoSubmit(e: React.MouseEvent) {
    e.preventDefault();
    // Trigger react-hook-form validation then submit with venmo
    handleSubmit((values) => submitBooking(values, "venmo"))();
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="mb-10">
        <p className="font-meta text-muted-foreground mb-3">Book a session</p>
        <h1 className="font-display text-4xl text-ink mb-4">Request a booking</h1>
        <p className="text-muted-foreground leading-relaxed">
          A 50% deposit secures your date. The remaining balance is due before your shoot.
          You&rsquo;ll receive a confirmation email within 24 hours.
        </p>
      </div>

      {wasCancelled && (
        <div className="mb-6 p-4 bg-blush/30 border border-rose/20 rounded-sm text-sm text-ink">
          Your payment was cancelled — your booking wasn&rsquo;t confirmed. You can try again below.
        </div>
      )}

      {loadingPackages ? (
        <p className="text-muted-foreground">Loading packages…</p>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8" noValidate>

          {/* Package selection */}
          <fieldset>
            <legend className="font-display text-lg text-ink mb-4">1. Choose a package</legend>
            <div className="space-y-3">
              {packages.map((pkg) => (
                <label
                  key={pkg.id}
                  className={`flex items-start gap-4 p-4 border rounded-sm cursor-pointer transition-colors ${
                    selectedPackageId === pkg.id
                      ? "border-ink bg-ink/5"
                      : "border-border hover:border-sky/40"
                  }`}
                >
                  <input
                    type="radio"
                    value={pkg.id}
                    {...register("packageId")}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-display text-ink">{pkg.name}</span>
                      <span className="font-meta text-sm text-muted-foreground shrink-0">
                        {formatPrice(pkg.basePrice)}
                      </span>
                    </div>
                    {pkg.description && (
                      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                        {pkg.description}
                      </p>
                    )}
                    <p className="font-meta text-xs text-muted-foreground mt-2">
                      {pkg.rollsIncluded} {pkg.rollsIncluded === 1 ? "roll" : "rolls"} · {pkg.photosIncluded}+ photos
                    </p>
                  </div>
                </label>
              ))}
            </div>
            {errors.packageId && (
              <p className="text-rose text-sm mt-2">{errors.packageId.message}</p>
            )}
          </fieldset>

          {/* Event type */}
          {selectedPackage && (
            <fieldset>
              <legend className="font-display text-lg text-ink mb-4">2. Event type</legend>
              <div className="flex flex-wrap gap-3">
                {selectedPackage.eventTypes.map((type) => (
                  <label
                    key={type}
                    className={`px-4 py-2 border rounded-sm cursor-pointer capitalize text-sm transition-colors ${
                      watch("eventType") === type
                        ? "border-ink bg-ink text-cream"
                        : "border-border hover:border-sky/40"
                    }`}
                  >
                    <input
                      type="radio"
                      value={type}
                      {...register("eventType")}
                      className="sr-only"
                    />
                    {type}
                  </label>
                ))}
              </div>
              {errors.eventType && (
                <p className="text-rose text-sm mt-2">{errors.eventType.message}</p>
              )}
            </fieldset>
          )}

          {/* Date */}
          <div>
            <label className="block font-display text-lg text-ink mb-4">3. Event date</label>
            <input
              type="date"
              min={today()}
              {...register("eventDate")}
              className="block border border-border rounded-sm px-3 py-2 text-ink bg-cream focus:outline-none focus:ring-2 focus:ring-sky/40 font-meta"
            />
            {selectedDate && isDateBooked(selectedDate) && (
              <p className="text-rose text-sm mt-2">
                This date is already booked. Please choose another.
              </p>
            )}
            {errors.eventDate && (
              <p className="text-rose text-sm mt-2">{errors.eventDate.message}</p>
            )}
          </div>

          {/* Questionnaire */}
          {questions.length > 0 && (
            <fieldset>
              <legend className="font-display text-lg text-ink mb-1">4. About your shoot</legend>
              <p className="text-sm text-muted-foreground mb-5">All fields are optional — answer what you can and leave the rest blank.</p>
              <div className="space-y-5">
                {questions.map((q) => {
                  const inputCls = "w-full border border-border rounded-sm px-3 py-2 text-ink bg-cream focus:outline-none focus:ring-2 focus:ring-sky/40 text-sm";
                  const val = answers[q.key] ?? "";
                  const set = (v: string) => setAnswers((prev) => ({ ...prev, [q.key]: v }));
                  return (
                    <div key={q.key}>
                      <label className="block text-sm text-muted-foreground mb-1.5">
                        {q.label}
                        {q.key === "hours_coverage" && selectedPackage?.hoursIncluded && (
                          <span className="ml-2 font-meta text-xs text-sky">
                            ({selectedPackage.hoursIncluded}h included with your package)
                          </span>
                        )}
                      </label>
                      {q.type === "address" ? (
                        <AddressInput value={val} onChange={set} placeholder={q.placeholder} className={inputCls} />
                      ) : q.type === "time" ? (
                        <input
                          type="time"
                          value={val}
                          onChange={(e) => set(e.target.value)}
                          className="border border-border rounded-sm px-3 py-2 text-ink bg-cream focus:outline-none focus:ring-2 focus:ring-sky/40 text-sm"
                        />
                      ) : q.type === "number" ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={val}
                            onChange={(e) => set(e.target.value)}
                            min={q.min}
                            max={q.max}
                            className="w-28 border border-border rounded-sm px-3 py-2 text-ink bg-cream focus:outline-none focus:ring-2 focus:ring-sky/40 text-sm"
                          />
                          {q.key === "hours_coverage" && <span className="text-sm text-muted-foreground">hours</span>}
                          {q.key === "guest_count" && <span className="text-sm text-muted-foreground">guests</span>}
                        </div>
                      ) : q.type === "select" ? (
                        <select
                          value={val}
                          onChange={(e) => set(e.target.value)}
                          className="w-full sm:w-auto border border-border rounded-sm px-3 py-2 text-ink bg-cream focus:outline-none focus:ring-2 focus:ring-sky/40 text-sm"
                        >
                          <option value="">Select…</option>
                          {q.options?.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : q.type === "textarea" ? (
                        <textarea
                          value={val}
                          onChange={(e) => set(e.target.value)}
                          placeholder={q.placeholder}
                          rows={3}
                          className={`${inputCls} resize-none`}
                        />
                      ) : (
                        <input
                          type="text"
                          value={val}
                          onChange={(e) => set(e.target.value)}
                          placeholder={q.placeholder}
                          className={inputCls}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </fieldset>
          )}

          {/* Add-ons */}
          {availableAddOns.length > 0 && selectedPackage && (() => {
            const addOnPricing = selectedPackage.addOnPricing ?? {};
            const addOnStep = 4 + (questions.length > 0 ? 1 : 0);
            return (
              <fieldset>
                <legend className="font-display text-lg text-ink mb-4">{addOnStep}. Add-ons</legend>
                <div className="space-y-3">
                  {availableAddOns.map(([key, priceKey]) => (
                    <label key={key} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        {...register(`addOns.${key as "extraRoll" | "rushDelivery" | "secondShooter"}`)}
                        className="w-4 h-4 accent-ink"
                      />
                      <span className="text-ink text-sm">{ADD_ON_LABELS[key]}</span>
                      <span className="font-meta text-xs text-muted-foreground ml-auto">
                        +{formatPrice(addOnPricing[priceKey])}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            );
          })()}

          {/* Contact info */}
          <fieldset>
            <legend className="font-display text-lg text-ink mb-4">
              {contactStepNum}. Your info
            </legend>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-1.5">
                  Name <span className="text-rose">*</span>
                </label>
                <input
                  type="text"
                  autoComplete="name"
                  {...register("customerName")}
                  className="w-full border border-border rounded-sm px-3 py-2 text-ink bg-cream focus:outline-none focus:ring-2 focus:ring-sky/40 text-sm"
                />
                {errors.customerName && (
                  <p className="text-rose text-xs mt-1">{errors.customerName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm text-muted-foreground mb-1.5">
                  Email <span className="text-rose">*</span>
                </label>
                <input
                  type="email"
                  autoComplete="email"
                  {...register("customerEmail")}
                  className="w-full border border-border rounded-sm px-3 py-2 text-ink bg-cream focus:outline-none focus:ring-2 focus:ring-sky/40 text-sm"
                />
                {errors.customerEmail && (
                  <p className="text-rose text-xs mt-1">{errors.customerEmail.message}</p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm text-muted-foreground mb-1.5">Phone (optional)</label>
                <input
                  type="tel"
                  autoComplete="tel"
                  {...register("customerPhone")}
                  className="w-full border border-border rounded-sm px-3 py-2 text-ink bg-cream focus:outline-none focus:ring-2 focus:ring-sky/40 text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                  <label className="block text-sm text-muted-foreground mb-2">Preferred contact method</label>
                  <div className="flex gap-3">
                    {(["email", "sms"] as const).map((val) => {
                      const needsPhone = val === "sms" && (!phone || phone.length <= 4);
                      return (
                        <label
                          key={val}
                          className={`flex items-center gap-2 px-4 py-2 border rounded-sm text-sm transition-colors capitalize ${
                            needsPhone
                              ? "border-border text-muted-foreground/40 cursor-not-allowed"
                              : watch("communicationPreference") === val
                              ? "border-ink bg-ink/5 text-ink cursor-pointer"
                              : "border-border text-muted-foreground hover:border-sky/40 cursor-pointer"
                          }`}
                        >
                          <input
                            type="radio"
                            value={val}
                            disabled={needsPhone}
                            {...register("communicationPreference")}
                            className="sr-only"
                          />
                          {val === "email" ? "Email" : "Text message"}
                        </label>
                      );
                    })}
                  </div>
                  <p className="font-meta text-xs text-muted-foreground mt-1.5">
                    {watch("communicationPreference") === "sms"
                      ? "You'll receive confirmations and reminders by text."
                      : !phone || phone.length <= 4
                      ? "Add a phone number above to enable text message notifications."
                      : "You'll receive confirmations and reminders by email."}
                  </p>
                </div>

              <div className="sm:col-span-2">
                <label className="block text-sm text-muted-foreground mb-1.5">
                  How did you hear about us?
                </label>
                <select
                  {...register("referralSource")}
                  className="w-full border border-border rounded-sm px-3 py-2 text-ink bg-cream focus:outline-none focus:ring-2 focus:ring-sky/40 text-sm"
                >
                  <option value="">— Select one —</option>
                  {REFERRAL_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

            </div>
          </fieldset>

          {/* Price summary + submit */}
          {selectedPackage && (
            <div className="border border-border rounded-sm p-6 bg-cream">
              <h3 className="font-display text-ink mb-4">Summary</h3>
              <dl className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{selectedPackage.name}</dt>
                  <dd className="font-meta">{formatPrice(selectedPackage.basePrice)}</dd>
                </div>
                {selectedAddOns.extraRoll && selectedPackage.addOnPricing?.extraRollPrice && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Extra roll</dt>
                    <dd className="font-meta">+{formatPrice(selectedPackage.addOnPricing.extraRollPrice)}</dd>
                  </div>
                )}
                {selectedAddOns.rushDelivery && selectedPackage.addOnPricing?.rushDeliveryPrice && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Rush delivery</dt>
                    <dd className="font-meta">+{formatPrice(selectedPackage.addOnPricing.rushDeliveryPrice)}</dd>
                  </div>
                )}
                {selectedAddOns.secondShooter && selectedPackage.addOnPricing?.secondShooterPrice && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Second shooter</dt>
                    <dd className="font-meta">+{formatPrice(selectedPackage.addOnPricing.secondShooterPrice)}</dd>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-border">
                  <dt className="text-muted-foreground">Total</dt>
                  <dd className="font-meta">{formatPrice(totalPrice)}</dd>
                </div>
                <div className="flex justify-between font-medium">
                  <dt className="text-ink">Due today (50% deposit)</dt>
                  <dd className="font-meta text-ink">{formatPrice(depositAmount)}</dd>
                </div>
              </dl>

              {serverError && (
                <p className="text-rose text-sm mb-4">{serverError}</p>
              )}

              {venmoBooking ? (
                <VenmoPaymentFlow
                  bookingId={venmoBooking.bookingId}
                  amount={venmoBooking.depositAmount}
                  customerName={watch("customerName")}
                  type="deposit"
                />
              ) : (
                <div className="space-y-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-ink text-cream py-3 rounded-sm font-display text-sm hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? "Redirecting…" : `Pay deposit with card — ${formatPrice(depositAmount)}`}
                  </button>
                  <button
                    type="button"
                    onClick={onVenmoSubmit}
                    disabled={submitting}
                    className="w-full bg-[#008CFF] text-white py-3 rounded-sm font-display text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? "Processing…" : `Pay deposit with Venmo — ${formatPrice(depositAmount)}`}
                  </button>
                  <p className="text-xs text-muted-foreground text-center">
                    Card: instant confirmation via Stripe · Venmo: verified within 24h
                  </p>
                </div>
              )}
            </div>
          )}
        </form>
      )}
    </div>
  );
}
