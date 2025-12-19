// Component Marketplace Service
// Manages reusable UI components, templates, and code snippets

export interface Component {
  id: string;
  name: string;
  description: string;
  category: string;
  code: string;
  preview?: string;
  tags: string[];
  author: string;
  downloads: number;
  rating: number;
  createdAt: string;
  updatedAt: string;
}

export interface ComponentCategory {
  id: string;
  name: string;
  icon: string;
  count: number;
}

export interface MarketplaceFilter {
  category?: string;
  tags?: string[];
  search?: string;
  sortBy?: 'popular' | 'recent' | 'rating';
}

// Built-in component library
const BUILT_IN_COMPONENTS: Component[] = [
  {
    id: 'button-primary',
    name: 'Primary Button',
    description: 'Glassmorphism styled primary button with hover effects',
    category: 'buttons',
    code: `export function PrimaryButton({ children, onClick, disabled }: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 
        text-white font-medium hover:scale-105 transition-all duration-300 
        disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
    >
      {children}
    </button>
  );
}`,
    tags: ['button', 'glassmorphism', 'interactive'],
    author: 'Comet Studio',
    downloads: 1250,
    rating: 4.8,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'card-glass',
    name: 'Glass Card',
    description: 'Beautiful glassmorphism card with backdrop blur',
    category: 'cards',
    code: `export function GlassCard({ children, className = '' }: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={\`backdrop-blur-xl bg-white/10 border border-white/20 
      rounded-2xl p-6 shadow-2xl \${className}\`}>
      {children}
    </div>
  );
}`,
    tags: ['card', 'glassmorphism', 'container'],
    author: 'Comet Studio',
    downloads: 2100,
    rating: 4.9,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'input-modern',
    name: 'Modern Input',
    description: 'Sleek input field with floating label animation',
    category: 'forms',
    code: `export function ModernInput({ label, value, onChange, type = 'text' }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div className="relative">
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 bg-transparent border-2 border-white/20 
          rounded-xl focus:border-purple-500 transition-all outline-none"
        placeholder=" "
      />
      <label className="absolute left-4 -top-2 bg-gradient-to-r from-purple-500 
        to-pink-500 px-2 text-sm text-white">
        {label}
      </label>
    </div>
  );
}`,
    tags: ['input', 'form', 'animation'],
    author: 'Comet Studio',
    downloads: 1800,
    rating: 4.7,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'loading-spinner',
    name: 'Loading Spinner',
    description: 'Animated loading spinner with gradient',
    category: 'loaders',
    code: `export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
  };
  
  return (
    <div className={\`\${sizeClasses[size]} border-4 border-white/20 
      border-t-purple-500 rounded-full animate-spin\`} />
  );
}`,
    tags: ['loader', 'animation', 'utility'],
    author: 'Comet Studio',
    downloads: 3200,
    rating: 4.9,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'modal-centered',
    name: 'Centered Modal',
    description: 'Full-screen modal with backdrop blur and animations',
    category: 'modals',
    code: `export function CenteredModal({ isOpen, onClose, children }: {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!isOpen) return null;
  
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center 
        backdrop-blur-md bg-black/50 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="backdrop-blur-xl bg-white/10 border border-white/20 
          rounded-2xl p-8 max-w-2xl w-full shadow-2xl animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}`,
    tags: ['modal', 'overlay', 'glassmorphism'],
    author: 'Comet Studio',
    downloads: 2800,
    rating: 4.8,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'navbar-glass',
    name: 'Glass Navbar',
    description: 'Sticky glassmorphism navigation bar',
    category: 'navigation',
    code: `export function GlassNavbar({ logo, links }: {
  logo: React.ReactNode;
  links: { label: string; href: string }[];
}) {
  return (
    <nav className="sticky top-0 z-40 backdrop-blur-xl bg-white/10 
      border-b border-white/20">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center 
        justify-between">
        <div className="text-2xl font-bold bg-gradient-to-r from-purple-500 
          to-pink-500 bg-clip-text text-transparent">
          {logo}
        </div>
        <div className="flex gap-6">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-white/80 hover:text-white transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
}`,
    tags: ['navbar', 'navigation', 'glassmorphism'],
    author: 'Comet Studio',
    downloads: 1900,
    rating: 4.7,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const CATEGORIES: ComponentCategory[] = [
  { id: 'buttons', name: 'Buttons', icon: '🔘', count: 1 },
  { id: 'cards', name: 'Cards', icon: '🎴', count: 1 },
  { id: 'forms', name: 'Forms', icon: '📝', count: 1 },
  { id: 'loaders', name: 'Loaders', icon: '⏳', count: 1 },
  { id: 'modals', name: 'Modals', icon: '🪟', count: 1 },
  { id: 'navigation', name: 'Navigation', icon: '🧭', count: 1 },
];

export class MarketplaceService {
  private components: Component[] = [];
  private customComponents: Component[] = [];

  constructor() {
    this.components = [...BUILT_IN_COMPONENTS];
  }

  /**
   * Get all components with optional filtering
   */
  getComponents(filter?: MarketplaceFilter): Component[] {
    let filtered = [...this.components, ...this.customComponents];

    // Filter by category
    if (filter?.category) {
      filtered = filtered.filter((c) => c.category === filter.category);
    }

    // Filter by tags
    if (filter?.tags && filter.tags.length > 0) {
      filtered = filtered.filter((c) =>
        filter.tags!.some((tag) => c.tags.includes(tag))
      );
    }

    // Filter by search
    if (filter?.search) {
      const search = filter.search.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(search) ||
          c.description.toLowerCase().includes(search) ||
          c.tags.some((tag) => tag.toLowerCase().includes(search))
      );
    }

    // Sort results
    if (filter?.sortBy) {
      switch (filter.sortBy) {
        case 'popular':
          filtered.sort((a, b) => b.downloads - a.downloads);
          break;
        case 'rating':
          filtered.sort((a, b) => b.rating - a.rating);
          break;
        case 'recent':
          filtered.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          break;
      }
    }

    return filtered;
  }

  /**
   * Get a single component by ID
   */
  getComponent(id: string): Component | undefined {
    return [...this.components, ...this.customComponents].find(
      (c) => c.id === id
    );
  }

  /**
   * Get all categories
   */
  getCategories(): ComponentCategory[] {
    return CATEGORIES;
  }

  /**
   * Add a custom component
   */
  addComponent(component: Omit<Component, 'id' | 'createdAt' | 'updatedAt'>): Component {
    const newComponent: Component = {
      ...component,
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.customComponents.push(newComponent);
    return newComponent;
  }

  /**
   * Update a component
   */
  updateComponent(id: string, updates: Partial<Component>): Component | null {
    const index = this.customComponents.findIndex((c) => c.id === id);
    if (index === -1) return null;

    this.customComponents[index] = {
      ...this.customComponents[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    return this.customComponents[index];
  }

  /**
   * Delete a custom component
   */
  deleteComponent(id: string): boolean {
    const index = this.customComponents.findIndex((c) => c.id === id);
    if (index === -1) return false;

    this.customComponents.splice(index, 1);
    return true;
  }

  /**
   * Increment download count
   */
  incrementDownloads(id: string): void {
    const component = this.getComponent(id);
    if (component) {
      component.downloads++;
    }
  }

  /**
   * Get popular components
   */
  getPopular(limit: number = 6): Component[] {
    return this.getComponents({ sortBy: 'popular' }).slice(0, limit);
  }

  /**
   * Get recent components
   */
  getRecent(limit: number = 6): Component[] {
    return this.getComponents({ sortBy: 'recent' }).slice(0, limit);
  }

  /**
   * Search components
   */
  search(query: string): Component[] {
    return this.getComponents({ search: query });
  }
}

// Export singleton instance
export const marketplaceService = new MarketplaceService();

// Export default
export default marketplaceService;
