import { createFileRoute } from "@tanstack/react-router";
import { toPng } from "html-to-image";
import { DownloadIcon, Share2Icon } from "lucide-react";
import {
  type ChangeEvent,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({ component: App });

// ------------------------------------------------------------

const dataUrlToBlob = async (dataUrl: string) => {
  const res = await fetch(dataUrl);
  return await res.blob();
};

function App() {
  const nameTagRef = useRef<HTMLDivElement>(null);
  const [name, setName] = useState("");
  const [jobTitle, setJobTitle] = useState("");

  const isNavigatorCanShare = useMemo(() => {
    return navigator.canShare?.({
      files: [new File([], "placeholder.png", { type: "image/png" })],
    });
  }, []);

  function handleChangeName(event: ChangeEvent<HTMLInputElement>) {
    setName(event.target.value);
  }
  function handleChangeJobTitle(event: ChangeEvent<HTMLInputElement>) {
    setJobTitle(event.target.value);
  }

  const avatarUrl = useMemo(() => {
    const params = new URLSearchParams({
      seed: name,
    });
    return `https://api.dicebear.com/9.x/personas/svg?${params.toString()}`;
  }, [name]);

  const generateNameTagImage = useCallback(async () => {
    if (nameTagRef.current === null) {
      return null;
    }

    const dataUrl = await toPng(nameTagRef.current, {
      cacheBust: true,
      pixelRatio: 2,
    });

    return dataUrl;
  }, []);

  const onDownload = useCallback(async () => {
    const dataUrl = await generateNameTagImage();
    if (dataUrl === null) {
      return;
    }

    const link = document.createElement("a");
    link.download = "nametag.png";
    link.href = dataUrl;
    link.click();
  }, [generateNameTagImage]);

  const onShare = useCallback(async () => {
    const dataUrl = await generateNameTagImage();
    if (dataUrl === null) {
      return;
    }

    const blob = await dataUrlToBlob(dataUrl);
    const file = new File([blob], "nametag.png", { type: "image/png" });

    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: "My Run Stats",
          text: "Check out my latest run!",
        });
      } catch (error: any) {
        if (error.name !== "AbortError") {
          console.error("Error sharing:", error);
        }
      }
    } else {
      alert(
        "Your browser does not support the Web Share API. Please download the image and share it manually.",
      );
    }
  }, [generateNameTagImage]);

  return (
    <div className="dark min-h-screen bg-background w-full flex items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Create Nametag</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Input
              type="text"
              placeholder="Full name"
              maxLength={24}
              value={name}
              onChange={handleChangeName}
              required
            />
            <Input
              type="text"
              placeholder="Job title (Optional)"
              maxLength={36}
              value={jobTitle}
              onChange={handleChangeJobTitle}
            />
          </div>
          {name && (
            <div
              ref={nameTagRef}
              className="flex flex-col gap-2 bg-linear-to-t from-muted to-gray-800 border border-border rounded-lg"
            >
              <div className="flex flex-col gap-2 p-4">
                <p
                  className={cn(
                    "text-4xl text-foreground font-bold wrap-break-word",
                  )}
                >
                  {name}
                </p>
                <p className="text-sm text-foreground/75 wrap-break-word">
                  {jobTitle || "Software Engineer"} @ Linxt Studio
                </p>
              </div>
              <img src={avatarUrl} alt="Avatar" />
            </div>
          )}
          {name && (
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={onShare}>
                <Share2Icon className="size-4" />
                Share
              </Button>
              <Button onClick={onDownload}>
                <DownloadIcon className="size-4" />
                Download
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
