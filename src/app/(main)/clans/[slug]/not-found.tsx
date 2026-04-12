import Link from "next/link";
import { Shield, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui";

export default function ClanNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
      <div className="p-5 rounded-full bg-primary/10 border border-primary/20">
        <Shield className="w-12 h-12 text-primary" />
      </div>
      <h2 className="text-2xl font-bold text-text">Clan Not Found</h2>
      <p className="text-text-muted max-w-md">
        This clan doesn&apos;t exist or may have been disbanded.
      </p>
      <Link href="/clans">
        <Button
          size="lg"
          className="bg-primary text-black font-semibold hover:bg-primary/90 shadow-lg shadow-primary/20 gap-2"
          leftIcon={<ArrowLeft className="w-4 h-4" />}
        >
          Browse Clans
        </Button>
      </Link>
    </div>
  );
}
