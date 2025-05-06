import { MainLayout } from "@/components/layout/main-layout";
import { MeetingForm } from "@/components/forms/meeting-form";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function CreateMeeting() {
  return (
    <MainLayout>
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <div className="flex items-center mb-2">
            <Link href="/meetings">
              <a className="text-neutral-dark dark:text-neutral-light hover:text-primary mr-2">
                <ArrowLeft className="h-4 w-4" />
              </a>
            </Link>
            <h1 className="text-2xl font-semibold text-neutral-darkest dark:text-white">
              Schedule New Meeting
            </h1>
          </div>
          <p className="text-neutral-dark dark:text-neutral-light">
            Create a new meeting with stakeholders or training participants
          </p>
        </div>

        <MeetingForm />
      </div>
    </MainLayout>
  );
}
