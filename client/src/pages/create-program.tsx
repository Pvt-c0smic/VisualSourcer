import { MainLayout } from "@/components/layout/main-layout";
import { ProgramForm } from "@/components/forms/program-form";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function CreateProgram() {
  return (
    <MainLayout>
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <div className="flex items-center mb-2">
            <Link href="/training-programs">
              <a className="text-neutral-dark dark:text-neutral-light hover:text-primary mr-2">
                <ArrowLeft className="h-4 w-4" />
              </a>
            </Link>
            <h1 className="text-2xl font-semibold text-neutral-darkest dark:text-white">
              Create New Training Program
            </h1>
          </div>
          <p className="text-neutral-dark dark:text-neutral-light">
            Define a new training program for the network battalion
          </p>
        </div>

        <ProgramForm />
      </div>
    </MainLayout>
  );
}
