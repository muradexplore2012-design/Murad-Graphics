import React from 'react';
import {
  Layers,
  Palette,
  Sparkles,
  Bot,
  Layout,
  Code,
  Cpu,
  Smartphone,
  Box,
  Folder,
  PenTool,
  Image as ImageIcon,
  Video,
  Music,
  Globe,
  ShoppingBag,
  Shield,
  Type,
  Zap,
  FileText,
  Flame,
  Wand2,
  Brush,
  Camera,
  Film,
  Compass,
  Briefcase,
  Monitor
} from 'lucide-react';

export const CATEGORY_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Layers,
  Palette,
  Sparkles,
  Bot,
  Layout,
  Code,
  Cpu,
  Smartphone,
  Box,
  Folder,
  PenTool,
  Image: ImageIcon,
  Video,
  Music,
  Globe,
  ShoppingBag,
  Shield,
  Type,
  Zap,
  FileText,
  Flame,
  Wand2,
  Brush,
  Camera,
  Film,
  Compass,
  Briefcase,
  Monitor
};

export const CATEGORY_ICON_OPTIONS = [
  { id: 'Layers', label: 'Layers (General)' },
  { id: 'Bot', label: 'AI Voice / Bot' },
  { id: 'Sparkles', label: 'AI & Magic' },
  { id: 'Palette', label: 'Graphic Design' },
  { id: 'Layout', label: 'Theme & Template' },
  { id: 'Code', label: 'Code & Scripts' },
  { id: 'Cpu', label: 'Software & Apps' },
  { id: 'Smartphone', label: 'Mobile Apps' },
  { id: 'Box', label: '3D & Bundles' },
  { id: 'Folder', label: 'Backup & Files' },
  { id: 'PenTool', label: 'Vector & Logos' },
  { id: 'Image', label: 'Photos & Mockups' },
  { id: 'Video', label: 'Video & Motion' },
  { id: 'Music', label: 'Audio & Music' },
  { id: 'Globe', label: 'Web & Domains' },
  { id: 'ShoppingBag', label: 'E-Commerce' },
  { id: 'Shield', label: 'License & Security' },
  { id: 'Type', label: 'Fonts & Typography' },
  { id: 'Flame', label: 'Hot / Trending' },
  { id: 'Monitor', label: 'Desktop & OS' }
];

export interface CategoryIconProps {
  image?: string;
  icon?: string;
  className?: string;
  imgClassName?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  image,
  icon,
  className = 'w-5 h-5',
  imgClassName = 'w-6 h-6 object-contain'
}) => {
  if (image && image.trim().length > 0) {
    return <img src={image} alt="category icon" className={imgClassName} />;
  }

  const IconComponent = icon ? CATEGORY_ICON_MAP[icon] || Layers : Layers;
  return <IconComponent className={className} />;
};
