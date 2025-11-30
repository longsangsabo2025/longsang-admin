import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, CheckCircle, RefreshCw, Save } from "lucide-react";
import { useEffect, useState } from "react";

interface KnowledgeBase {
  personal: {
    name: string;
    email: string;
    brand_name: string;
    tagline: string;
  };
  products: {
    longsang: {
      status: string;
      urls: {
        production: string;
        development: string;
      };
      pricing: {
        free_tier: { price: string };
        starter: { price: string };
        pro: { price: string };
      };
    };
    sabo_arena: {
      status: string;
      urls: {
        production: string;
      };
    };
  };
  social: {
    linkedin: string;
    twitter: string;
    facebook: string;
    youtube: string;
  };
}

export default function KnowledgeBaseEditor() {
  const { toast } = useToast();
  const [kb, setKb] = useState<KnowledgeBase | null>(null);
  const [loading, setLoading] = useState(false);
  const [validationStatus, setValidationStatus] = useState<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  } | null>(null);

  useEffect(() => {
    loadKB();
  }, []);

  const loadKB = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:3001/api/knowledge-base");
      const data = await response.json();
      setKb(data);

      toast({
        title: "Knowledge Base Loaded",
        description: "Successfully loaded from file",
      });
    } catch (error) {
      toast({
        title: "Load Failed",
        description: "Could not load knowledge base",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveKB = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:3001/api/knowledge-base", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(kb),
      });

      if (response.ok) {
        toast({
          title: "Saved Successfully",
          description: "Knowledge base updated",
        });

        // Validate after save
        await validateKB();
      }
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Could not save knowledge base",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const validateKB = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:3001/api/knowledge-base/validate");
      const data = await response.json();
      setValidationStatus(data);

      if (data.valid) {
        toast({
          title: "Validation Passed",
          description: "Knowledge base is valid",
        });
      } else {
        toast({
          title: "Validation Failed",
          description: `${data.errors.length} errors found`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Validation Failed",
        description: "Could not validate knowledge base",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!kb) {
    return (
      <div className="flex items-center justify-center h-screen">
        <RefreshCw className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold">Knowledge Base Editor</h1>
          <p className="text-muted-foreground mt-2">
            Single source of truth for all product information
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={validateKB} variant="outline" disabled={loading}>
            <CheckCircle className="w-4 h-4 mr-2" />
            Validate
          </Button>
          <Button onClick={saveKB} disabled={loading}>
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      {validationStatus && !validationStatus.valid && (
        <Card className="mb-6 border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              Validation Errors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-1">
              {validationStatus.errors.map((error, i) => (
                <li key={i} className="text-sm text-destructive">
                  {error}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="personal" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="longsang">LongSang</TabsTrigger>
          <TabsTrigger value="sabo">SABO Arena</TabsTrigger>
          <TabsTrigger value="ls-secretary">LS Secretary</TabsTrigger>
          <TabsTrigger value="vungtauland">VungTauLand</TabsTrigger>
        </TabsList>

        <TabsContent value="personal">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Your brand identity and contact information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={kb.personal.name}
                    onChange={(e) =>
                      setKb({
                        ...kb,
                        personal: { ...kb.personal, name: e.target.value },
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={kb.personal.email}
                    onChange={(e) =>
                      setKb({
                        ...kb,
                        personal: { ...kb.personal, email: e.target.value },
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="brand_name">Brand Name</Label>
                  <Input
                    id="brand_name"
                    value={kb.personal.brand_name}
                    onChange={(e) =>
                      setKb({
                        ...kb,
                        personal: { ...kb.personal, brand_name: e.target.value },
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tagline">Tagline</Label>
                  <Input
                    id="tagline"
                    value={kb.personal.tagline}
                    onChange={(e) =>
                      setKb({
                        ...kb,
                        personal: { ...kb.personal, tagline: e.target.value },
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Social Media</Label>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    placeholder="LinkedIn URL"
                    value={kb.social.linkedin}
                    onChange={(e) =>
                      setKb({
                        ...kb,
                        social: { ...kb.social, linkedin: e.target.value },
                      })
                    }
                  />
                  <Input
                    placeholder="Twitter URL"
                    value={kb.social.twitter}
                    onChange={(e) =>
                      setKb({
                        ...kb,
                        social: { ...kb.social, twitter: e.target.value },
                      })
                    }
                  />
                  <Input
                    placeholder="Facebook URL"
                    value={kb.social.facebook}
                    onChange={(e) =>
                      setKb({
                        ...kb,
                        social: { ...kb.social, facebook: e.target.value },
                      })
                    }
                  />
                  <Input
                    placeholder="YouTube URL"
                    value={kb.social.youtube}
                    onChange={(e) =>
                      setKb({
                        ...kb,
                        social: { ...kb.social, youtube: e.target.value },
                      })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="longsang">
          <Card>
            <CardHeader>
              <CardTitle>LongSang Forge</CardTitle>
              <CardDescription>AI Marketing Automation Platform</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="longsang_status">Status</Label>
                <Input
                  id="longsang_status"
                  value={kb.products.longsang.status}
                  onChange={(e) =>
                    setKb({
                      ...kb,
                      products: {
                        ...kb.products,
                        longsang: {
                          ...kb.products.longsang,
                          status: e.target.value,
                        },
                      },
                    })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="longsang_prod_url">Production URL</Label>
                  <Input
                    id="longsang_prod_url"
                    value={kb.products.longsang.urls.production}
                    onChange={(e) =>
                      setKb({
                        ...kb,
                        products: {
                          ...kb.products,
                          longsang: {
                            ...kb.products.longsang,
                            urls: {
                              ...kb.products.longsang.urls,
                              production: e.target.value,
                            },
                          },
                        },
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="longsang_dev_url">Development URL</Label>
                  <Input
                    id="longsang_dev_url"
                    value={kb.products.longsang.urls.development}
                    onChange={(e) =>
                      setKb({
                        ...kb,
                        products: {
                          ...kb.products,
                          longsang: {
                            ...kb.products.longsang,
                            urls: {
                              ...kb.products.longsang.urls,
                              development: e.target.value,
                            },
                          },
                        },
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Pricing</Label>
                <div className="grid grid-cols-3 gap-4">
                  <Input
                    placeholder="Free Tier"
                    value={kb.products.longsang.pricing.free_tier.price}
                    onChange={(e) =>
                      setKb({
                        ...kb,
                        products: {
                          ...kb.products,
                          longsang: {
                            ...kb.products.longsang,
                            pricing: {
                              ...kb.products.longsang.pricing,
                              free_tier: { price: e.target.value },
                            },
                          },
                        },
                      })
                    }
                  />
                  <Input
                    placeholder="Starter"
                    value={kb.products.longsang.pricing.starter.price}
                    onChange={(e) =>
                      setKb({
                        ...kb,
                        products: {
                          ...kb.products,
                          longsang: {
                            ...kb.products.longsang,
                            pricing: {
                              ...kb.products.longsang.pricing,
                              starter: { price: e.target.value },
                            },
                          },
                        },
                      })
                    }
                  />
                  <Input
                    placeholder="Pro"
                    value={kb.products.longsang.pricing.pro.price}
                    onChange={(e) =>
                      setKb({
                        ...kb,
                        products: {
                          ...kb.products,
                          longsang: {
                            ...kb.products.longsang,
                            pricing: {
                              ...kb.products.longsang.pricing,
                              pro: { price: e.target.value },
                            },
                          },
                        },
                      })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sabo">
          <Card>
            <CardHeader>
              <CardTitle>SABO Arena</CardTitle>
              <CardDescription>Tournament Management Platform</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sabo_status">Status</Label>
                <Input
                  id="sabo_status"
                  value={kb.products.sabo_arena.status}
                  onChange={(e) =>
                    setKb({
                      ...kb,
                      products: {
                        ...kb.products,
                        sabo_arena: {
                          ...kb.products.sabo_arena,
                          status: e.target.value,
                        },
                      },
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sabo_prod_url">Production URL</Label>
                <Input
                  id="sabo_prod_url"
                  value={kb.products.sabo_arena.urls.production}
                  onChange={(e) =>
                    setKb({
                      ...kb,
                      products: {
                        ...kb.products,
                        sabo_arena: {
                          ...kb.products.sabo_arena,
                          urls: {
                            ...kb.products.sabo_arena.urls,
                            production: e.target.value,
                          },
                        },
                      },
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Add more tabs for other products */}
      </Tabs>
    </div>
  );
}
