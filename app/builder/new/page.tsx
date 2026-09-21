import { requireUser } from "@/lib/session";
import { NewModuleForm } from "@/components/builder/new-module-form";
import { SEED_TEMPLATES } from "@/lib/templates/seedTemplates";

export default async function NewModulePage() {
  await requireUser();

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-2xl font-semibold">New module</h1>
      <p className="mt-1 text-sm text-muted">
        Start from scratch or clone a template — you can change everything
        after.
      </p>
      <div className="mt-8">
        <NewModuleForm templates={SEED_TEMPLATES} />
      </div>
    </div>
  );
}
