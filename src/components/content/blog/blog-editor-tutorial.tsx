"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import {
  PenLine,
  Image as ImageIcon,
  Tags,
  Send,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BlogEditorTutorialProps {
  isOpen: boolean;
  onClose: () => void;
}

const slides = [
  {
    icon: PenLine,
    title: "Write Your Content",
    description:
      "Use the rich text editor to craft your blog post. The toolbar makes formatting easy — no coding needed.",
    tips: [
      "Use headings (H1, H2, H3) to structure your article clearly",
      "Bold or italicize key phrases to add emphasis",
      "Add quotes and code blocks to enrich your content",
    ],
  },
  {
    icon: ImageIcon,
    title: "Add Media & Links",
    description:
      "Make your posts visually engaging by embedding images and linking to relevant resources.",
    tips: [
      "Click the image button and paste a URL to embed an image",
      "Select text and click the link button to add a hyperlink",
      "Use a featured image URL to set the post thumbnail",
    ],
  },
  {
    icon: Tags,
    title: "Categorize & Tag",
    description:
      "Help readers discover your content by choosing a category and adding relevant tags.",
    tips: [
      "Pick the category that best fits your post (e.g. Guide, News)",
      "Add tags separated by commas for better discoverability",
      "Write a short excerpt that will appear in blog listings",
    ],
  },
  {
    icon: Send,
    title: "Publish or Save Draft",
    description:
      "When you're happy with your post, publish it for the world to see — or save it as a draft to finish later.",
    tips: [
      "Click 'Save Draft' to keep working on it before it goes live",
      "Click 'Publish' to submit your post for review",
      "New contributors' posts go through a brief review before going live",
    ],
  },
];

export function BlogEditorTutorial({
  isOpen,
  onClose,
}: BlogEditorTutorialProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slide = slides[currentSlide];
  const Icon = slide.icon;
  const isFirst = currentSlide === 0;
  const isLast = currentSlide === slides.length - 1;

  const handleClose = () => {
    setCurrentSlide(0);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <div className="p-6 sm:p-8">
        {/* Slide content */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-4">
            <Icon className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-text mb-2">{slide.title}</h2>
          <p className="text-text-muted max-w-md mx-auto">
            {slide.description}
          </p>
        </div>

        {/* Tips */}
        <div className="space-y-3 mb-8 max-w-md mx-auto">
          {slide.tips.map((tip, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              <p className="text-sm text-text-secondary">{tip}</p>
            </div>
          ))}
        </div>

        {/* Dot indicators */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurrentSlide(i)}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                i === currentSlide
                  ? "w-6 bg-primary"
                  : "w-2 bg-surface-lighter hover:bg-text-dim"
              )}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentSlide((s) => s - 1)}
            disabled={isFirst}
            className={isFirst ? "invisible" : ""}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>

          {isLast ? (
            <Button variant="primary" size="sm" onClick={handleClose}>
              Got it, let&apos;s write!
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setCurrentSlide((s) => s + 1)}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
