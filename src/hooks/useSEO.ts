import { useEffect } from 'react';

export interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'product';
  schema?: Record<string, any>;
}

const DEFAULT_TITLE = 'Vyrqonix | Graphic Resources, Software & Game';
const DEFAULT_DESC = 'A digital marketplace for graphic design resources, editable design files, software and apps.';
const DEFAULT_KEYWORDS = 'vyrqonix, Vyrqonix, Free Game Download, Free PC Games, Free Design, Free Graphic Design, softwer, pc softwe, PC Software, Free Software Download, admibe illustetor, Adobe Illustrator, Adobe Photoshop, Graphic Templates, Vector, PSD, Mockups, Software Download, Digital Marketplace, Murad Graphics, Bangladesh';
const SITE_URL = 'https://vyrqonix.netlify.app';
const DEFAULT_OG_IMAGE = 'https://vyrqonix.netlify.app/og-image.png';

export function useSEO(props: SEOProps) {
  useEffect(() => {
    // 1. Update Title
    const finalTitle = props.title 
      ? (props.title.includes('Vyrqonix') ? props.title : `${props.title} | Vyrqonix`)
      : DEFAULT_TITLE;
    document.title = finalTitle;

    // 2. Helper to set/update meta tag
    const setMeta = (nameOrProperty: string, value: string, isProperty = false) => {
      const selector = isProperty ? `meta[property="${nameOrProperty}"]` : `meta[name="${nameOrProperty}"]`;
      let element = document.querySelector(selector);
      if (!element) {
        element = document.createElement('meta');
        if (isProperty) {
          element.setAttribute('property', nameOrProperty);
        } else {
          element.setAttribute('name', nameOrProperty);
        }
        document.head.appendChild(element);
      }
      element.setAttribute('content', value);
    };

    // 3. Update Description & Keywords
    const finalDesc = props.description || DEFAULT_DESC;
    const finalKeywords = props.keywords ? `${props.keywords}, ${DEFAULT_KEYWORDS}` : DEFAULT_KEYWORDS;
    setMeta('description', finalDesc);
    setMeta('keywords', finalKeywords);

    // 4. Update OpenGraph & Twitter tags
    setMeta('og:title', finalTitle, true);
    setMeta('og:description', finalDesc, true);
    setMeta('og:image', props.ogImage || DEFAULT_OG_IMAGE, true);
    setMeta('og:type', props.ogType || 'website', true);
    setMeta('twitter:title', finalTitle);
    setMeta('twitter:description', finalDesc);
    setMeta('twitter:image', props.ogImage || DEFAULT_OG_IMAGE);

    // 5. Update Canonical Link
    const finalCanonical = props.canonical ? `${SITE_URL}${props.canonical.startsWith('/') ? '' : '/'}${props.canonical}` : SITE_URL;
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', finalCanonical);
    setMeta('og:url', finalCanonical, true);
    setMeta('twitter:url', finalCanonical);

    // 6. Inject or Update JSON-LD Page Schema
    const SCHEMA_ID = 'page-json-ld';
    let schemaScript = document.getElementById(SCHEMA_ID) as HTMLScriptElement | null;

    if (props.schema) {
      if (!schemaScript) {
        schemaScript = document.createElement('script');
        schemaScript.id = SCHEMA_ID;
        schemaScript.type = 'application/ld+json';
        document.head.appendChild(schemaScript);
      }
      schemaScript.textContent = JSON.stringify(props.schema);
    } else if (schemaScript) {
      schemaScript.remove();
    }

    // Cleanup on unmount (removes page-specific schema)
    return () => {
      const scriptToRemove = document.getElementById(SCHEMA_ID);
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [
    props.title, 
    props.description, 
    props.keywords, 
    props.canonical, 
    props.ogImage, 
    props.ogType, 
    props.schema
  ]);
}
