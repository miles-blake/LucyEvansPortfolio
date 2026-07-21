import type { Photo } from "@/generated/prisma/client";

type Props = {
  action: (formData: FormData) => Promise<void>;
  photo?: Photo;
  submitLabel: string;
};

export function PhotoForm({ action, photo, submitLabel }: Props) {
  return (
    <form action={action} className="space-y-5 max-w-xl">
      {photo && <input type="hidden" name="id" value={photo.id} />}

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Title *" name="title" defaultValue={photo?.title} required />
        <Field label="Slug *" name="slug" defaultValue={photo?.slug} required />
      </div>

      <Field
        label="Description"
        name="description"
        defaultValue={photo?.description ?? ""}
        multiline
      />

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Location" name="location" defaultValue={photo?.location ?? ""} />
        <Field label="Collection tag" name="collectionTag" defaultValue={photo?.collectionTag ?? ""} />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Film stock" name="filmStock" defaultValue={photo?.filmStock ?? ""} />
        <Field label="Camera" name="camera" defaultValue={photo?.camera ?? ""} />
      </div>

      <Field
        label="Preview image URL *"
        name="previewImageUrl"
        defaultValue={photo?.previewImageUrl}
        required
      />
      <Field
        label="Full-res file URL *"
        name="fullResFileUrl"
        defaultValue={photo?.fullResFileUrl}
        required
      />

      <div className="grid sm:grid-cols-2 gap-4">
        <Field
          label="Price (USD) *"
          name="priceDisplay"
          type="number"
          step="0.01"
          min="0"
          defaultValue={photo ? (photo.price / 100).toFixed(2) : ""}
          required
        />
      </div>

      <div className="space-y-2">
        <CheckboxField label="Featured" name="featured" defaultChecked={photo?.featured} />
        <CheckboxField label="Limited edition" name="isLimitedEdition" defaultChecked={photo?.isLimitedEdition} />
      </div>

      <Field
        label="Edition size (if limited)"
        name="editionSize"
        type="number"
        min="1"
        defaultValue={photo?.editionSize?.toString() ?? ""}
      />

      <button
        type="submit"
        className="bg-ink text-cream text-sm px-5 py-2.5 rounded-sm hover:opacity-80 transition-opacity"
      >
        {submitLabel}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue = "",
  required,
  multiline,
  type = "text",
  step,
  min,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
  multiline?: boolean;
  type?: string;
  step?: string;
  min?: string;
}) {
  const cls = "w-full border border-border rounded-sm px-3 py-2 text-ink bg-cream focus:outline-none focus:ring-2 focus:ring-sky/40 text-sm";

  return (
    <div>
      <label className="block text-sm text-muted-foreground mb-1.5">{label}</label>
      {multiline ? (
        <textarea rows={3} name={name} defaultValue={defaultValue} required={required} className={`${cls} resize-none`} />
      ) : (
        <input type={type} name={name} defaultValue={defaultValue} required={required} step={step} min={min} className={cls} />
      )}
    </div>
  );
}

function CheckboxField({ label, name, defaultChecked }: { label: string; name: string; defaultChecked?: boolean }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer text-sm text-ink">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="w-4 h-4 accent-ink" />
      {label}
    </label>
  );
}
