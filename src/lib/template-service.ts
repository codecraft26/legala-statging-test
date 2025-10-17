export interface TemplateItem {
  id: string;
  name: string;
  filename: string;
  description?: string;
  category?: string;
  uploadedBy: string;
  isInfraHiveTemplate: boolean;
}

// Static templates from public/templates folder
export const INFRAHIVE_TEMPLATES: TemplateItem[] = [
  {
    id: "architect_contract_india",
    name: "Architect Contract (India)",
    filename: "architect_contract_india.docx",
    description: "Professional architect service agreement for Indian projects",
    category: "Professional Services",
    uploadedBy: "InfraHive.ai",
    isInfraHiveTemplate: true,
  },
  {
    id: "commercial_lease_agreement_india",
    name: "Commercial Lease Agreement (India)",
    filename: "commercial_lease_agreement_india.docx",
    description: "Commercial property lease agreement for Indian businesses",
    category: "Real Estate",
    uploadedBy: "InfraHive.ai",
    isInfraHiveTemplate: true,
  },
  {
    id: "employment_agreement_india",
    name: "Employment Agreement (India)",
    filename: "employment_agreement_india.docx",
    description: "Standard employment contract for Indian companies",
    category: "Employment",
    uploadedBy: "InfraHive.ai",
    isInfraHiveTemplate: true,
  },
  {
    id: "lease_agreement_india",
    name: "Lease Agreement (India)",
    filename: "lease_agreement_india.docx",
    description: "Residential lease agreement for Indian properties",
    category: "Real Estate",
    uploadedBy: "InfraHive.ai",
    isInfraHiveTemplate: true,
  },
  {
    id: "loan_agreement_india",
    name: "Loan Agreement (India)",
    filename: "loan_agreement_india.docx",
    description: "Personal or business loan agreement for Indian context",
    category: "Financial",
    uploadedBy: "InfraHive.ai",
    isInfraHiveTemplate: true,
  },
  {
    id: "non_disclosure_agreement_india",
    name: "Non-Disclosure Agreement (India)",
    filename: "non_disclosure_agreement_india.docx",
    description: "Confidentiality agreement for Indian businesses",
    category: "Legal",
    uploadedBy: "InfraHive.ai",
    isInfraHiveTemplate: true,
  },
  {
    id: "partnership_agreement_india",
    name: "Partnership Agreement (India)",
    filename: "partnership_agreement_india.docx",
    description: "Business partnership agreement for Indian companies",
    category: "Business",
    uploadedBy: "InfraHive.ai",
    isInfraHiveTemplate: true,
  },
  {
    id: "real_estate_purchase_agreement_india",
    name: "Real Estate Purchase Agreement (India)",
    filename: "real_estate_purchase_agreement_india.docx",
    description: "Property purchase agreement for Indian real estate",
    category: "Real Estate",
    uploadedBy: "InfraHive.ai",
    isInfraHiveTemplate: true,
  },
  {
    id: "service_agreement_india",
    name: "Service Agreement (India)",
    filename: "service_agreement_india.docx",
    description: "General service agreement for Indian businesses",
    category: "Professional Services",
    uploadedBy: "InfraHive.ai",
    isInfraHiveTemplate: true,
  },
];

export class TemplateService {
  /**
   * Get all available templates (InfraHive templates + user templates)
   */
  static async getAllTemplates(): Promise<TemplateItem[]> {
    // For now, return only InfraHive templates
    // In the future, this could be extended to include user-uploaded templates
    return INFRAHIVE_TEMPLATES;
  }

  /**
   * Load template content from actual file
   */
  static async loadTemplateContent(template: TemplateItem): Promise<string> {
    try {
      const response = await fetch(this.getTemplateFileUrl(template.filename));
      if (!response.ok) {
        throw new Error(`Failed to load template: ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      
      // Use mammoth.js to convert DOCX to HTML
      const mammoth = await import('mammoth');
      const result = await mammoth.convertToHtml({ arrayBuffer });
      
      if (result.messages && result.messages.length > 0) {
        console.warn('Mammoth conversion messages:', result.messages);
      }
      
      // If we successfully got HTML content, use it
      if (result.value && result.value.trim()) {
        return `
          <div class="template-header">
            <h1>${template.name}</h1>
            <p><strong>Template Type:</strong> ${template.category}</p>
            <p><strong>Description:</strong> ${template.description || 'No description available'}</p>
            <p><em>Template provided by ${template.uploadedBy}</em></p>
            <hr>
          </div>
          <div class="template-content">
            ${result.value}
          </div>
        `;
      }
      
      // Fallback to placeholder content if parsing failed
      return `
        <h1>${template.name}</h1>
        <p><strong>Template Type:</strong> ${template.category}</p>
        <p><strong>Description:</strong> ${template.description || 'No description available'}</p>
        <hr>
        <p>This is a template for <strong>${template.name}</strong>.</p>
        <p>Please replace the placeholder content with your actual document content.</p>
        <p><em>Template provided by ${template.uploadedBy}</em></p>
        <br>
        <p><strong>Note:</strong> This template file (${template.filename}) is available for download. The actual DOCX content will be loaded when you download the file.</p>
      `;
    } catch (error) {
      console.error('Error loading template content:', error);
      // Return fallback content instead of throwing
      return `
        <h1>${template.name}</h1>
        <p><strong>Template Type:</strong> ${template.category}</p>
        <p><strong>Description:</strong> ${template.description || 'No description available'}</p>
        <hr>
        <p>This is a template for <strong>${template.name}</strong>.</p>
        <p>Please replace the placeholder content with your actual document content.</p>
        <p><em>Template provided by ${template.uploadedBy}</em></p>
        <br>
        <p><strong>Note:</strong> This template file (${template.filename}) is available for download. The actual DOCX content will be loaded when you download the file.</p>
      `;
    }
  }

  /**
   * Get templates by category
   */
  static async getTemplatesByCategory(category: string): Promise<TemplateItem[]> {
    const allTemplates = await this.getAllTemplates();
    return allTemplates.filter(template => template.category === category);
  }

  /**
   * Get template by ID
   */
  static async getTemplateById(id: string): Promise<TemplateItem | null> {
    const allTemplates = await this.getAllTemplates();
    return allTemplates.find(template => template.id === id) || null;
  }

  /**
   * Get template file URL
   */
  static getTemplateFileUrl(filename: string): string {
    return `/templates/${filename}`;
  }

  /**
   * Get all unique categories
   */
  static async getCategories(): Promise<string[]> {
    const allTemplates = await this.getAllTemplates();
    const categories = new Set(allTemplates.map(template => template.category).filter((category): category is string => Boolean(category)));
    return Array.from(categories).sort();
  }
}
