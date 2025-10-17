"use client";

import React, { useState, useEffect } from "react";
import { TemplateService, TemplateItem } from "@/lib/template-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, FileText, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";

interface TemplateSelectorProps {
  onTemplateSelect: (template: TemplateItem) => void;
  onClose: () => void;
  isLoading?: boolean;
}

export default function TemplateSelector({ onTemplateSelect, onClose, isLoading = false }: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<TemplateItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const [templatesData, categoriesData] = await Promise.all([
          TemplateService.getAllTemplates(),
          TemplateService.getCategories(),
        ]);
        setTemplates(templatesData);
        setCategories(categoriesData);
        setFilteredTemplates(templatesData);
      } catch (error) {
        console.error("Error loading templates:", error);
        showToast("Failed to load templates", "error");
      } finally {
        setLoading(false);
      }
    };

    loadTemplates();
  }, [showToast]);

  useEffect(() => {
    let filtered = templates;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter(template => template.category === selectedCategory);
    }

    setFilteredTemplates(filtered);
  }, [templates, searchTerm, selectedCategory]);

  const handleTemplateSelect = (template: TemplateItem) => {
    onTemplateSelect(template);
  };

  // download removed

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading templates...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Choose a Template</h3>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-sm font-medium line-clamp-2">
                    {template.name}
                  </CardTitle>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {template.uploadedBy}
                </Badge>
              </div>
              {template.description && (
                <CardDescription className="text-xs line-clamp-2">
                  {template.description}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-xs">
                  {template.category}
                </Badge>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    onClick={() => handleTemplateSelect(template)}
                    disabled={isLoading}
                    className="h-7 px-3"
                  >
                    {isLoading ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      "Use"
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No templates found matching your criteria.</p>
        </div>
      )}
    </div>
  );
}
