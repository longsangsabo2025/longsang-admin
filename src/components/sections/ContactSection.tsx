import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Github,
  Globe,
  Linkedin,
  Mail,
  MapPin,
  Twitter,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { z } from "zod";

// Schema will be created with translations inside component

export const ContactSection = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const contactSchema = z.object({
    name: z
      .string()
      .trim()
      .min(1, t("contact.validation.nameRequired"))
      .max(100, t("contact.validation.nameMax")),
    email: z
      .string()
      .trim()
      .email(t("contact.validation.emailInvalid"))
      .max(255, t("contact.validation.emailMax")),
    service: z.string().min(1, t("contact.validation.serviceRequired")),
    budget: z.string().optional(),
    message: z
      .string()
      .trim()
      .min(20, t("contact.validation.messageMin"))
      .max(1000, t("contact.validation.messageMax")),
    subscribeNewsletter: z.boolean().optional(),
  });

  type ContactFormData = z.infer<typeof contactSchema>;
  const [formData, setFormData] = useState<ContactFormData>({
    name: "",
    email: "",
    service: "",
    budget: "",
    message: "",
    subscribeNewsletter: false,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof ContactFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSubmitStatus("idle");

    // Validate form
    const result = contactSchema.safeParse(formData);

    if (!result.success) {
      const fieldErrors: Partial<Record<keyof ContactFormData, string>> = {};
      for (const error of result.error.errors) {
        if (error.path[0]) {
          fieldErrors[error.path[0] as keyof ContactFormData] = error.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      // Insert data into Supabase
      const { data, error } = await supabase
        .from("contacts")
        .insert([
          {
            name: result.data.name,
            email: result.data.email,
            service: result.data.service,
            budget: result.data.budget || null,
            message: result.data.message,
            subscribe_newsletter: result.data.subscribeNewsletter || false,
            status: "new",
          },
        ])
        .select();

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      console.log("Contact saved successfully:", data);

      setSubmitStatus("success");

      // Clear form
      setFormData({
        name: "",
        email: "",
        service: "",
        budget: "",
        message: "",
        subscribeNewsletter: false,
      });

      // Auto-hide success message after 5 seconds
      setTimeout(() => setSubmitStatus("idle"), 5000);
    } catch (error: any) {
      console.error("Form submission error:", error);
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="py-8 md:py-16 relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-primary/5" />
      <div className="max-w-[1600px] mx-auto px-6 md:px-12 lg:px-20 xl:px-28 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
            {t("contact.header")}
          </h2>
          <p className="text-xl font-medium text-muted-foreground">{t("contact.subtitle")}</p>
        </div>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-[1.5fr_1fr] gap-12 lg:gap-16">
          {/* Left Column - Contact Form */}
          <div className="bg-card border border-border/10 rounded-2xl p-8 md:p-10 shadow-[0_4px_24px_rgba(0,0,0,0.2)]">
            {/* Success Message */}
            {submitStatus === "success" && (
              <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-start gap-3 animate-fade-in">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-green-500 font-medium">{t("contact.success.title")}</p>
                  <p className="text-green-500/80 text-sm mt-1">{t("contact.success.message")}</p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {submitStatus === "error" && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3 animate-fade-in">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-500 font-medium">{t("contact.error.message")}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Field */}
              <div>
                <Label
                  htmlFor="name"
                  className="text-sm font-medium text-muted-foreground mb-2 block"
                >
                  {t("contact.form.name")}
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder={t("contact.form.namePlaceholder")}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`bg-background border-border/10 text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:ring-2 focus:ring-primary/20 ${
                    errors.name ? "border-red-500" : ""
                  }`}
                  disabled={isSubmitting}
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              {/* Email Field */}
              <div>
                <Label
                  htmlFor="email"
                  className="text-sm font-medium text-muted-foreground mb-2 block"
                >
                  {t("contact.form.email")}
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t("contact.form.emailPlaceholder")}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`bg-background border-border/10 text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:ring-2 focus:ring-primary/20 ${
                    errors.email ? "border-red-500" : ""
                  }`}
                  disabled={isSubmitting}
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>

              {/* Service Dropdown */}
              <div>
                <Label
                  htmlFor="service"
                  className="text-sm font-medium text-muted-foreground mb-2 block"
                >
                  {t("contact.form.service")}
                </Label>
                <Select
                  value={formData.service}
                  onValueChange={(value) => setFormData({ ...formData, service: value })}
                  disabled={isSubmitting}
                >
                  <SelectTrigger
                    className={`bg-background border-border/10 text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 ${
                      errors.service ? "border-red-500" : ""
                    }`}
                  >
                    <SelectValue placeholder={t("contact.form.servicePlaceholder")} />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border/10 z-50">
                    <SelectItem value="mobile">
                      {t("contact.form.serviceOptions.mobile")}
                    </SelectItem>
                    <SelectItem value="web">{t("contact.form.serviceOptions.web")}</SelectItem>
                    <SelectItem value="automation">
                      {t("contact.form.serviceOptions.automation")}
                    </SelectItem>
                    <SelectItem value="ai">{t("contact.form.serviceOptions.ai")}</SelectItem>
                    <SelectItem value="not-sure">
                      {t("contact.form.serviceOptions.notSure")}
                    </SelectItem>
                  </SelectContent>
                </Select>
                {errors.service && <p className="text-red-500 text-xs mt-1">{errors.service}</p>}
              </div>

              {/* Budget Dropdown */}
              <div>
                <Label
                  htmlFor="budget"
                  className="text-sm font-medium text-muted-foreground mb-2 block"
                >
                  {t("contact.form.budget")}
                </Label>
                <Select
                  value={formData.budget}
                  onValueChange={(value) => setFormData({ ...formData, budget: value })}
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="bg-background border-border/10 text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20">
                    <SelectValue placeholder={t("contact.form.budgetPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border/10 z-50">
                    <SelectItem value="under-5k">
                      {t("contact.form.budgetOptions.under5k")}
                    </SelectItem>
                    <SelectItem value="5k-15k">{t("contact.form.budgetOptions.5k15k")}</SelectItem>
                    <SelectItem value="15k-50k">
                      {t("contact.form.budgetOptions.15k50k")}
                    </SelectItem>
                    <SelectItem value="50k-plus">
                      {t("contact.form.budgetOptions.50kPlus")}
                    </SelectItem>
                    <SelectItem value="not-sure">
                      {t("contact.form.budgetOptions.notSure")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Message Textarea */}
              <div>
                <Label
                  htmlFor="message"
                  className="text-sm font-medium text-muted-foreground mb-2 block"
                >
                  {t("contact.form.message")}
                </Label>
                <Textarea
                  id="message"
                  placeholder={t("contact.form.messagePlaceholder")}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className={`bg-background border-border/10 text-foreground placeholder:text-muted-foreground/50 min-h-[120px] resize-y focus:border-primary focus:ring-2 focus:ring-primary/20 ${
                    errors.message ? "border-red-500" : ""
                  }`}
                  disabled={isSubmitting}
                />
                {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message}</p>}
              </div>

              {/* Newsletter Checkbox */}
              <div className="flex items-center gap-2">
                <Checkbox
                  id="newsletter"
                  checked={formData.subscribeNewsletter}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, subscribeNewsletter: checked as boolean })
                  }
                  disabled={isSubmitting}
                />
                <Label
                  htmlFor="newsletter"
                  className="text-sm text-muted-foreground cursor-pointer"
                >
                  {t("contact.form.newsletter")}
                </Label>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 rounded-xl text-base font-semibold hover:scale-[1.02] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? t("contact.form.submitting") : t("contact.form.submit")}
              </Button>
            </form>
          </div>

          {/* Right Column - Contact Info */}
          <div className="space-y-8">
            {/* Quick Consultation CTA */}
            <div className="bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 border-2 border-primary/30 rounded-2xl p-8 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-primary/20 rounded-xl">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    Đặt lịch tư vấn miễn phí
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    SEO, AI Agent, Automation - Chọn thời gian phù hợp với bạn
                  </p>
                </div>
              </div>
              <Button
                onClick={() => navigate("/consultation")}
                className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-primary-foreground font-semibold py-6 text-lg"
              >
                Xem lịch & Đặt ngay →
              </Button>
            </div>

            {/* Contact Information */}
            <div className="space-y-6">
              {/* Email */}
              <div>
                <p className="text-sm font-bold uppercase tracking-wider text-primary mb-2">
                  {t("contact.info.email")}
                </p>
                <a
                  href="mailto:contact@longsang.org"
                  className="text-base text-muted-foreground hover:text-accent transition-colors duration-200"
                >
                  contact@longsang.org
                </a>
              </div>

              {/* Book a Call */}
              <div>
                <p className="text-sm font-bold uppercase tracking-wider text-primary mb-2">
                  {t("contact.info.bookCall")}
                </p>
                <a
                  href="https://calendly.com/longsang"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-base text-muted-foreground hover:text-accent transition-colors duration-200 block mb-1"
                >
                  {t("contact.info.bookCallText")}
                </a>
              </div>

              {/* Social Links */}
              <div>
                <p className="text-sm font-bold uppercase tracking-wider text-primary mb-3">
                  {t("contact.info.connect")}
                </p>
                <div className="flex gap-4">
                  <a
                    href="https://linkedin.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary hover:scale-110 hover:rotate-6 transition-all duration-250"
                    aria-label="LinkedIn"
                  >
                    <Linkedin className="w-7 h-7" />
                  </a>
                  <a
                    href="https://github.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary hover:scale-110 hover:rotate-6 transition-all duration-250"
                    aria-label="GitHub"
                  >
                    <Github className="w-7 h-7" />
                  </a>
                  <a
                    href="https://twitter.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary hover:scale-110 hover:rotate-6 transition-all duration-250"
                    aria-label="Twitter"
                  >
                    <Twitter className="w-7 h-7" />
                  </a>
                  <a
                    href="mailto:contact@longsang.org"
                    className="text-muted-foreground hover:text-primary hover:scale-110 hover:rotate-6 transition-all duration-250"
                    aria-label="Email"
                  >
                    <Mail className="w-7 h-7" />
                  </a>
                </div>
              </div>

              {/* Location */}
              <div>
                <p className="text-sm font-bold uppercase tracking-wider text-primary mb-2">
                  {t("contact.info.location")}
                </p>
                <p className="text-base text-muted-foreground flex items-center gap-2 mb-1">
                  <MapPin className="w-4 h-4" />
                  {t("contact.info.locationText")}
                </p>
                <p className="text-base text-muted-foreground flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  {t("contact.info.timezone")}
                </p>
              </div>
            </div>

            {/* Consultation Cards */}
            <div className="space-y-4 mt-8">
              {/* Free Consultation Card */}
              <div className="bg-card border border-border/10 rounded-xl p-6 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_12px_24px_rgba(0,0,0,0.2)] transition-all duration-300">
                <p className="text-sm font-bold text-foreground mb-2">
                  {t("contact.consultations.free.badge")}
                </p>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {t("contact.consultations.free.title")}
                </h3>
                <p className="text-sm text-muted-foreground mb-1">
                  {t("contact.consultations.free.duration")}
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  {t("contact.consultations.free.description")}
                </p>
                <Button
                  asChild
                  variant="outline"
                  className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-200"
                >
                  <a href="https://calendly.com/longsang" target="_blank" rel="noopener noreferrer">
                    {t("contact.consultations.free.cta")}
                  </a>
                </Button>
              </div>

              {/* Paid Consultation Card */}
              <div className="bg-card border border-border/10 rounded-xl p-6 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_12px_24px_rgba(0,0,0,0.2)] transition-all duration-300">
                <p className="text-sm font-bold text-foreground mb-2">
                  {t("contact.consultations.paid.badge")}
                </p>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {t("contact.consultations.paid.title")}
                </h3>
                <p className="text-sm text-muted-foreground mb-1">
                  {t("contact.consultations.paid.duration")}
                </p>
                <p className="text-sm text-muted-foreground mb-2">
                  {t("contact.consultations.paid.description")}
                </p>
                <p className="text-sm font-semibold text-primary mb-4">
                  {t("contact.consultations.paid.price")}
                </p>
                <Button
                  asChild
                  variant="outline"
                  className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-200"
                >
                  <a href="#contact">{t("contact.consultations.paid.cta")}</a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
