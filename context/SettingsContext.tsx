'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { AppSettings, Language, Project } from '@/types';
import { mockSettings, mockProjects, DEFAULT_AI_PROMPT } from '@/lib/mockData';
import { supabase } from '@/lib/supabase';

interface SettingsContextValue {
  settings: AppSettings;
  projects: Project[];
  activeProjectId: string;
  activeProject: Project;
  language: Language;
  isRTL: boolean;
  isLoading: boolean;
  setLanguage: (lang: Language) => void;
  setActiveProjectId: (id: string) => void;
  updateSettings: (partial: Partial<AppSettings>) => Promise<void>;
  createProject: (projectData: Partial<Project>) => Promise<Project>;
  duplicateProject: (projectId: string) => Promise<Project>;
  updateProject: (projectId: string, partial: Partial<Project>) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  toggleProjectActive: (projectId: string) => Promise<void>;
  getProjectBySlug: (slug: string) => Project | undefined;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

const LOCAL_STORAGE_PROJECTS_KEY = 'city360_projects_v2';
const LOCAL_STORAGE_ACTIVE_PROJ_KEY = 'city360_active_proj_v2';

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(mockSettings);
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [activeProjectId, setActiveProjectIdState] = useState<string>(mockProjects[0].id);
  const [language, setLanguageState] = useState<Language>('en');
  const [isLoading, setIsLoading] = useState(false);

  const isRTL = language === 'ar';

  // Load projects & settings from LocalStorage or Supabase on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedProjects = localStorage.getItem(LOCAL_STORAGE_PROJECTS_KEY);
        if (savedProjects) {
          const parsed = JSON.parse(savedProjects);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setProjects(parsed);
          }
        }
        const savedActiveId = localStorage.getItem(LOCAL_STORAGE_ACTIVE_PROJ_KEY);
        if (savedActiveId) {
          setActiveProjectIdState(savedActiveId);
        }
      } catch (e) {
        console.error('Failed to load projects from localStorage', e);
      }
    }

    const loadSupabase = async () => {
      if (!supabase) return;
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('*')
          .limit(1)
          .single();
        if (!error && data) {
          setSettings((prev) => ({ ...prev, ...data }));
          if (data.projects && Array.isArray(data.projects) && data.projects.length > 0) {
            setProjects(data.projects);
          }
        }
      } catch (e) {
        console.error('Supabase load error:', e);
      } finally {
        setIsLoading(false);
      }
    };
    loadSupabase();
  }, []);

  // Save projects to localStorage whenever updated
  const persistProjects = useCallback((updatedProjects: Project[]) => {
    setProjects(updatedProjects);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(LOCAL_STORAGE_PROJECTS_KEY, JSON.stringify(updatedProjects));
      } catch (e) {
        console.error('Failed to save projects to localStorage', e);
      }
    }
  }, []);

  // Active project helper
  const activeProject =
    projects.find((p) => p.id === activeProjectId) || projects[0] || mockProjects[0];

  // Apply RTL to document
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
  }, [language, isRTL]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
  }, []);

  const setActiveProjectId = useCallback((id: string) => {
    setActiveProjectIdState(id);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(LOCAL_STORAGE_ACTIVE_PROJ_KEY, id);
      } catch (e) {}
    }
  }, []);

  const getProjectBySlug = useCallback(
    (slug: string): Project | undefined => {
      return projects.find((p) => p.slug === slug);
    },
    [projects]
  );

  // ─── CRUD Operations for Multi-Project ──────────────────────────────────────
  const createProject = useCallback(
    async (projectData: Partial<Project>): Promise<Project> => {
      const uniqueId = `proj_${Date.now()}`;
      const baseSlug = (projectData.project_name || 'new-project')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      const uniqueSlug = `${baseSlug || 'project'}-${Date.now().toString().slice(-4)}`;

      const newProject: Project = {
        id: uniqueId,
        slug: projectData.slug || uniqueSlug,
        is_active: projectData.is_active ?? true,
        company_name: projectData.company_name || activeProject.company_name || 'City Scale',
        company_name_ar: projectData.company_name_ar || activeProject.company_name_ar || 'سيتي سكيل',
        project_name: projectData.project_name || 'New Project',
        project_name_ar: projectData.project_name_ar || 'مشروع جديد',
        virtual_tour_url:
          projectData.virtual_tour_url ||
          'https://www.coohom.com/pub/tool/panorama/aiwalking?obsPlanId=3FO3DBYBNCU7&locale=en_US',
        company_logo_url: projectData.company_logo_url || activeProject.company_logo_url || '/city-scale-logo.png',
        whatsapp_number: projectData.whatsapp_number || '201000000000',
        primary_color: projectData.primary_color || '#6366f1',
        ai_voice: projectData.ai_voice || 'Aoede',
        ai_tone: projectData.ai_tone || 'consultative',
        ai_agent_name: projectData.ai_agent_name || 'Layla',
        ai_prompt: projectData.ai_prompt || DEFAULT_AI_PROMPT,
        created_at: new Date().toISOString(),
      };

      const updated = [...projects, newProject];
      persistProjects(updated);
      setActiveProjectId(newProject.id);

      if (supabase) {
        try {
          await supabase.from('app_settings').upsert({ id: '1', projects: updated });
        } catch (e) {}
      }

      return newProject;
    },
    [projects, activeProject, persistProjects, setActiveProjectId]
  );

  const duplicateProject = useCallback(
    async (projectId: string): Promise<Project> => {
      const source = projects.find((p) => p.id === projectId) || activeProject;
      const uniqueId = `proj_${Date.now()}`;
      const uniqueSlug = `${source.slug}-copy-${Date.now().toString().slice(-4)}`;

      const clonedProject: Project = {
        ...source,
        id: uniqueId,
        slug: uniqueSlug,
        project_name: `${source.project_name} (Copy)`,
        project_name_ar: `${source.project_name_ar} (نسخة)`,
        is_active: true,
        created_at: new Date().toISOString(),
      };

      const updated = [...projects, clonedProject];
      persistProjects(updated);
      setActiveProjectId(clonedProject.id);

      if (supabase) {
        try {
          await supabase.from('app_settings').upsert({ id: '1', projects: updated });
        } catch (e) {}
      }

      return clonedProject;
    },
    [projects, activeProject, persistProjects, setActiveProjectId]
  );

  const updateProject = useCallback(
    async (projectId: string, partial: Partial<Project>): Promise<void> => {
      const updated = projects.map((p) => {
        if (p.id === projectId) {
          return { ...p, ...partial, updated_at: new Date().toISOString() };
        }
        return p;
      });

      persistProjects(updated);

      if (supabase) {
        try {
          await supabase.from('app_settings').upsert({ id: '1', projects: updated });
        } catch (e) {}
      }
    },
    [projects, persistProjects]
  );

  const deleteProject = useCallback(
    async (projectId: string): Promise<void> => {
      if (projects.length <= 1) {
        alert('You must maintain at least one project.');
        return;
      }
      const updated = projects.filter((p) => p.id !== projectId);
      persistProjects(updated);
      if (activeProjectId === projectId) {
        setActiveProjectId(updated[0].id);
      }

      if (supabase) {
        try {
          await supabase.from('app_settings').upsert({ id: '1', projects: updated });
        } catch (e) {}
      }
    },
    [projects, activeProjectId, persistProjects, setActiveProjectId]
  );

  const toggleProjectActive = useCallback(
    async (projectId: string): Promise<void> => {
      const project = projects.find((p) => p.id === projectId);
      if (!project) return;
      await updateProject(projectId, { is_active: !project.is_active });
    },
    [projects, updateProject]
  );

  const updateSettings = useCallback(
    async (partial: Partial<AppSettings>) => {
      const updated = { ...settings, ...partial };
      setSettings(updated);

      // Sync active project if matching
      if (activeProject) {
        await updateProject(activeProject.id, {
          company_name: partial.company_name ?? activeProject.company_name,
          company_name_ar: partial.company_name_ar ?? activeProject.company_name_ar,
          project_name: partial.project_name ?? activeProject.project_name,
          project_name_ar: partial.project_name_ar ?? activeProject.project_name_ar,
          virtual_tour_url:
            partial.virtual_tour_url ?? partial.coohom_url ?? activeProject.virtual_tour_url,
          company_logo_url: partial.company_logo_url ?? activeProject.company_logo_url,
          whatsapp_number: partial.whatsapp_number ?? activeProject.whatsapp_number,
          ai_agent_name: partial.ai_agent_name ?? activeProject.ai_agent_name,
          ai_voice: partial.ai_voice ?? activeProject.ai_voice,
          ai_tone: partial.ai_tone ?? activeProject.ai_tone,
          ai_prompt: partial.ai_prompt ?? activeProject.ai_prompt,
        });
      }

      if (!supabase) return;
      await supabase.from('app_settings').upsert({ ...updated, id: updated.id ?? '1' });
    },
    [settings, activeProject, updateProject]
  );

  return (
    <SettingsContext.Provider
      value={{
        settings,
        projects,
        activeProjectId,
        activeProject,
        language,
        isRTL,
        isLoading,
        setLanguage,
        setActiveProjectId,
        updateSettings,
        createProject,
        duplicateProject,
        updateProject,
        deleteProject,
        toggleProjectActive,
        getProjectBySlug,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
