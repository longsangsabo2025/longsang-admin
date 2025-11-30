import { useState } from "react";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const CVContactSection = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1500));

    toast({
      title: "Message Sent! ✨",
      description: "Thank you for reaching out. I'll get back to you soon!",
    });

    setFormData({ name: "", email: "", subject: "", message: "" });
    setIsSubmitting(false);
  };

  return (
    <section id="contact" className="section-padding bg-background-secondary relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20" />
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/30 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-secondary/30 rounded-full blur-3xl animate-float" style={{ animationDelay: "1s" }} />
      </div>

      <div className="container mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-5xl md:text-6xl font-heading font-black text-gradient-gold">
            LET'S WORK TOGETHER
          </h2>
          
          <p className="text-xl text-foreground-secondary max-w-2xl mx-auto">
            Ready to start your next project? Let's create something amazing!
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-8 max-w-6xl mx-auto">
          {/* Contact Info Cards */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card border border-border rounded-2xl p-6 hover:border-primary/50 transition-all hover-lift group">
              <div className="w-14 h-14 rounded-full bg-primary/20 border-2 border-primary/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Mail className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-lg font-heading font-bold text-foreground mb-2">Email</h3>
              <a
                href="mailto:longsangsabo@gmail.com"
                className="text-foreground-secondary hover:text-primary transition-colors break-all"
              >
                longsangsabo@gmail.com
              </a>
              <p className="text-sm text-muted-foreground mt-2">Click to send an email</p>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 hover:border-secondary/50 transition-all hover-lift group">
              <div className="w-14 h-14 rounded-full bg-secondary/20 border-2 border-secondary/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Phone className="w-7 h-7 text-secondary" />
              </div>
              <h3 className="text-lg font-heading font-bold text-foreground mb-2">Phone</h3>
              <a
                href="tel:+84961167717"
                className="text-foreground-secondary hover:text-secondary transition-colors text-lg font-semibold"
              >
                +84 961 167 717
              </a>
              <p className="text-sm text-muted-foreground mt-2">Available Mon-Sat 9am-6pm</p>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 hover:border-accent/50 transition-all hover-lift group">
              <div className="w-14 h-14 rounded-full bg-accent/20 border-2 border-accent/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <MapPin className="w-7 h-7 text-accent" />
              </div>
              <h3 className="text-lg font-heading font-bold text-foreground mb-2">Location</h3>
              <p className="text-foreground-secondary text-lg">Vung Tau City</p>
              <p className="text-foreground-secondary">Vietnam</p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-3">
            <form onSubmit={handleSubmit} className="bg-card/50 backdrop-glass border border-border rounded-2xl p-8 shadow-elevated">
              <div className="space-y-6">
                <div>
                  <Input
                    placeholder="Your Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="bg-background/50 border-border focus:border-primary text-foreground placeholder:text-muted-foreground"
                  />
                </div>

                <div>
                  <Input
                    type="email"
                    placeholder="Your Email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="bg-background/50 border-border focus:border-primary text-foreground placeholder:text-muted-foreground"
                  />
                </div>

                <div>
                  <Input
                    placeholder="Subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    required
                    className="bg-background/50 border-border focus:border-primary text-foreground placeholder:text-muted-foreground"
                  />
                </div>

                <div>
                  <Textarea
                    placeholder="Your Message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                    rows={6}
                    className="bg-background/50 border-border focus:border-primary text-foreground placeholder:text-muted-foreground resize-none"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-lg h-14 shadow-glow group"
                >
                  {isSubmitting ? (
                    "Sending..."
                  ) : (
                    <>
                      Send Message
                      <Send className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CVContactSection;